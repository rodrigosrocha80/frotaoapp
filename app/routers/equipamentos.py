from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_roles
from app.models import CategoriaEquipamento, Equipamento, PerfilUsuario
from app.schemas import EquipamentoCreate, EquipamentoOut, EquipamentoUpdate

router = APIRouter(prefix="/equipamentos", tags=["equipamentos"])


@router.get("", response_model=list[EquipamentoOut])
def list_equipamentos(
    db: Session = Depends(get_db),
    categoria: CategoriaEquipamento | None = Query(None),
    ativo: bool | None = Query(None),
    nome: str | None = Query(None),
    _=Depends(require_roles(PerfilUsuario.ADMIN, PerfilUsuario.MECANICO, PerfilUsuario.SUPERVISOR)),
):
    """Listar equipamentos com filtros opcionais"""
    query = select(Equipamento)
    
    if categoria:
        query = query.where(Equipamento.categoria == categoria)
    if ativo is not None:
        query = query.where(Equipamento.ativo == ativo)
    if nome:
        query = query.where(Equipamento.nome.ilike(f"%{nome}%"))
    
    return db.scalars(query.order_by(Equipamento.nome)).all()


@router.get("/{equipamento_id}", response_model=EquipamentoOut)
def get_equipamento(
    equipamento_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_roles(PerfilUsuario.ADMIN, PerfilUsuario.MECANICO, PerfilUsuario.SUPERVISOR)),
):
    """Obter detalhes de um equipamento específico"""
    equipamento = db.get(Equipamento, equipamento_id)
    if not equipamento:
        raise HTTPException(status_code=404, detail="Equipamento não encontrado")
    return equipamento


@router.post("", response_model=EquipamentoOut)
def create_equipamento(
    equipamento_data: EquipamentoCreate,
    db: Session = Depends(get_db),
    _=Depends(require_roles(PerfilUsuario.ADMIN, PerfilUsuario.MECANICO)),
):
    """Criar um novo equipamento"""
    # Validar unicidade dos campos únicos
    if equipamento_data.renavam and db.scalar(
        select(Equipamento).where(Equipamento.renavam == equipamento_data.renavam)
    ):
        raise HTTPException(status_code=400, detail="RENAVAM já existe")
    
    if equipamento_data.numero_serie and db.scalar(
        select(Equipamento).where(Equipamento.numero_serie == equipamento_data.numero_serie)
    ):
        raise HTTPException(status_code=400, detail="Número de série já existe")
    
    if equipamento_data.chassi and db.scalar(
        select(Equipamento).where(Equipamento.chassi == equipamento_data.chassi)
    ):
        raise HTTPException(status_code=400, detail="Chassi já existe")
    
    if equipamento_data.placa and db.scalar(
        select(Equipamento).where(Equipamento.placa == equipamento_data.placa)
    ):
        raise HTTPException(status_code=400, detail="Placa já existe")
    
    if equipamento_data.etiqueta_tag and db.scalar(
        select(Equipamento).where(Equipamento.etiqueta_tag == equipamento_data.etiqueta_tag)
    ):
        raise HTTPException(status_code=400, detail="Etiqueta/TAG já existe")
    
    equipamento = Equipamento(**equipamento_data.model_dump())
    db.add(equipamento)
    db.commit()
    db.refresh(equipamento)
    return equipamento


@router.put("/{equipamento_id}", response_model=EquipamentoOut)
def update_equipamento(
    equipamento_id: int,
    equipamento_data: EquipamentoUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_roles(PerfilUsuario.ADMIN, PerfilUsuario.MECANICO)),
):
    """Atualizar um equipamento existente"""
    equipamento = db.get(Equipamento, equipamento_id)
    if not equipamento:
        raise HTTPException(status_code=404, detail="Equipamento não encontrado")
    
    # Validar unicidade dos campos únicos em atualização
    updates = equipamento_data.model_dump(exclude_unset=True)
    
    if "renavam" in updates and updates["renavam"]:
        existing = db.scalar(
            select(Equipamento).where(
                Equipamento.renavam == updates["renavam"],
                Equipamento.id != equipamento_id
            )
        )
        if existing:
            raise HTTPException(status_code=400, detail="RENAVAM já existe")
    
    if "numero_serie" in updates and updates["numero_serie"]:
        existing = db.scalar(
            select(Equipamento).where(
                Equipamento.numero_serie == updates["numero_serie"],
                Equipamento.id != equipamento_id
            )
        )
        if existing:
            raise HTTPException(status_code=400, detail="Número de série já existe")
    
    if "chassi" in updates and updates["chassi"]:
        existing = db.scalar(
            select(Equipamento).where(
                Equipamento.chassi == updates["chassi"],
                Equipamento.id != equipamento_id
            )
        )
        if existing:
            raise HTTPException(status_code=400, detail="Chassi já existe")
    
    if "placa" in updates and updates["placa"]:
        existing = db.scalar(
            select(Equipamento).where(
                Equipamento.placa == updates["placa"],
                Equipamento.id != equipamento_id
            )
        )
        if existing:
            raise HTTPException(status_code=400, detail="Placa já existe")
    
    if "etiqueta_tag" in updates and updates["etiqueta_tag"]:
        existing = db.scalar(
            select(Equipamento).where(
                Equipamento.etiqueta_tag == updates["etiqueta_tag"],
                Equipamento.id != equipamento_id
            )
        )
        if existing:
            raise HTTPException(status_code=400, detail="Etiqueta/TAG já existe")
    
    for field, value in updates.items():
        setattr(equipamento, field, value)
    
    db.commit()
    db.refresh(equipamento)
    return equipamento


@router.delete("/{equipamento_id}")
def delete_equipamento(
    equipamento_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_roles(PerfilUsuario.ADMIN)),
):
    """Deletar um equipamento (apenas admin)"""
    equipamento = db.get(Equipamento, equipamento_id)
    if not equipamento:
        raise HTTPException(status_code=404, detail="Equipamento não encontrado")
    
    db.delete(equipamento)
    db.commit()
    return {"message": "Equipamento deletado com sucesso"}
