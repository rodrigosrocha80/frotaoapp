from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user, require_roles
from app.models import (
    Equipamento,
    OrdemServico,
    PerfilUsuario,
    StatusOrdemServico,
    TipoManutencao,
    Usuario,
    Veiculo,
)
from app.schemas import OSCreate, OSFinalizarInput, OSStatusUpdate, OrdemServicoOut
from app.services.os_service import finalizar_ordem_servico

router = APIRouter(prefix="/os", tags=["ordens-servico"])


@router.get("", response_model=list[OrdemServicoOut])
def list_os(
    db: Session = Depends(get_db),
    status_filter: Optional[str] = Query(None, alias="status"),
    _=Depends(require_roles(PerfilUsuario.ADMIN, PerfilUsuario.MECANICO, PerfilUsuario.SUPERVISOR)),
):
    q = select(OrdemServico).order_by(OrdemServico.id.desc())
    if status_filter:
        try:
            st = StatusOrdemServico(status_filter)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Status invalido") from exc
        q = q.where(OrdemServico.status == st)
    return db.scalars(q).all()


@router.get("/{os_id}", response_model=OrdemServicoOut)
def get_os(
    os_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_roles(PerfilUsuario.ADMIN, PerfilUsuario.MECANICO, PerfilUsuario.SUPERVISOR)),
):
    os_obj = db.get(OrdemServico, os_id)
    if not os_obj:
        raise HTTPException(status_code=404, detail="OS nao encontrada")
    return os_obj


@router.post("/abrir", response_model=OrdemServicoOut)
def abrir_os(
    payload: OSCreate,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
    _=Depends(require_roles(PerfilUsuario.ADMIN, PerfilUsuario.MECANICO, PerfilUsuario.SUPERVISOR)),
):
    veiculo_id: int | None = None
    equipamento_id: int | None = None

    if payload.asset_type == "veiculo":
        if bool(payload.veiculo_id) == bool(payload.novo_veiculo):
            raise HTTPException(
                status_code=400,
                detail="Informe um veículo existente ou cadastre um novo veículo para abrir a OS.",
            )

        if payload.equipamento_id or payload.novo_equipamento:
            raise HTTPException(status_code=400, detail="Não misture veículo com equipamento na mesma OS.")

        if payload.veiculo_id:
            veiculo = db.get(Veiculo, payload.veiculo_id)
            if not veiculo:
                raise HTTPException(status_code=404, detail="Veículo não encontrado")
            veiculo_id = veiculo.id
        else:
            novo_veiculo = payload.novo_veiculo
            if not novo_veiculo:
                raise HTTPException(status_code=400, detail="Dados do novo veículo não informados")

            placa_existente = db.scalar(select(Veiculo).where(Veiculo.placa == novo_veiculo.placa))
            if placa_existente:
                raise HTTPException(status_code=400, detail="Placa do veículo já existe")

            veiculo = Veiculo(
                placa=novo_veiculo.placa,
                modelo=novo_veiculo.modelo,
                km_atual=max(novo_veiculo.km_atual, payload.km_abertura),
                status=novo_veiculo.status,
            )
            db.add(veiculo)
            db.flush()
            veiculo_id = veiculo.id
    else:
        if bool(payload.equipamento_id) == bool(payload.novo_equipamento):
            raise HTTPException(
                status_code=400,
                detail="Informe um equipamento existente ou cadastre um novo equipamento para abrir a OS.",
            )

        if payload.veiculo_id or payload.novo_veiculo:
            raise HTTPException(status_code=400, detail="Não misture equipamento com veículo na mesma OS.")

        if payload.equipamento_id:
            equipamento = db.get(Equipamento, payload.equipamento_id)
            if not equipamento:
                raise HTTPException(status_code=404, detail="Equipamento não encontrado")
            equipamento_id = equipamento.id
        else:
            novo_equipamento = payload.novo_equipamento
            if not novo_equipamento:
                raise HTTPException(status_code=400, detail="Dados do novo equipamento não informados")

            if novo_equipamento.renavam and db.scalar(
                select(Equipamento).where(Equipamento.renavam == novo_equipamento.renavam)
            ):
                raise HTTPException(status_code=400, detail="RENAVAM já existe")

            if novo_equipamento.numero_serie and db.scalar(
                select(Equipamento).where(Equipamento.numero_serie == novo_equipamento.numero_serie)
            ):
                raise HTTPException(status_code=400, detail="Número de série já existe")

            if novo_equipamento.chassi and db.scalar(
                select(Equipamento).where(Equipamento.chassi == novo_equipamento.chassi)
            ):
                raise HTTPException(status_code=400, detail="Chassi já existe")

            if novo_equipamento.placa and db.scalar(
                select(Equipamento).where(Equipamento.placa == novo_equipamento.placa)
            ):
                raise HTTPException(status_code=400, detail="Placa já existe")

            if novo_equipamento.etiqueta_tag and db.scalar(
                select(Equipamento).where(Equipamento.etiqueta_tag == novo_equipamento.etiqueta_tag)
            ):
                raise HTTPException(status_code=400, detail="Etiqueta/TAG já existe")

            equipamento = Equipamento(**novo_equipamento.model_dump())
            db.add(equipamento)
            db.flush()
            equipamento_id = equipamento.id

    os_obj = OrdemServico(
        veiculo_id=veiculo_id,
        equipamento_id=equipamento_id,
        tipo_manutencao=TipoManutencao(payload.tipo_manutencao),
        descricao=payload.descricao,
        responsavel_id=payload.responsavel_id,
        criada_por_id=user.id,
        km_abertura=payload.km_abertura,
        status=StatusOrdemServico.ABERTO,
    )
    db.add(os_obj)
    db.commit()
    db.refresh(os_obj)
    return os_obj


@router.patch("/{os_id}/status", response_model=OrdemServicoOut)
def atualizar_status_os(
    os_id: int,
    payload: OSStatusUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_roles(PerfilUsuario.ADMIN, PerfilUsuario.MECANICO, PerfilUsuario.SUPERVISOR)),
):
    os_obj = db.get(OrdemServico, os_id)
    if not os_obj:
        raise HTTPException(status_code=404, detail="OS nao encontrada")
    os_obj.status = StatusOrdemServico(payload.status)
    if os_obj.status == StatusOrdemServico.EM_EXECUCAO and not os_obj.data_inicio:
        os_obj.data_inicio = datetime.utcnow()
    db.add(os_obj)
    db.commit()
    db.refresh(os_obj)
    return os_obj


@router.post("/{os_id}/finalizar", response_model=OrdemServicoOut)
def finalizar_os(
    os_id: int,
    payload: OSFinalizarInput,
    db: Session = Depends(get_db),
    _=Depends(require_roles(PerfilUsuario.ADMIN, PerfilUsuario.MECANICO)),
):
    try:
        os_obj = finalizar_ordem_servico(db, os_id, payload)
        return os_obj
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
