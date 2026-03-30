from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user, require_roles
from app.models import OrdemServico, PerfilUsuario, StatusOrdemServico, TipoManutencao, Usuario, Veiculo
from app.schemas import OSCreate, OSFinalizarInput, OSStatusUpdate
from app.services.os_service import finalizar_ordem_servico

router = APIRouter(prefix="/os", tags=["ordens-servico"])


@router.post("/abrir")
def abrir_os(
    payload: OSCreate,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
    _=Depends(require_roles(PerfilUsuario.ADMIN, PerfilUsuario.MECANICO, PerfilUsuario.SUPERVISOR)),
):
    veiculo = db.get(Veiculo, payload.veiculo_id)
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veiculo nao encontrado")

    os_obj = OrdemServico(
        veiculo_id=payload.veiculo_id,
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


@router.patch("/{os_id}/status")
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


@router.post("/{os_id}/finalizar")
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
