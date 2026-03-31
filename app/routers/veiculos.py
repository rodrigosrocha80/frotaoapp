from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_roles
from app.models import PerfilUsuario, Veiculo
from app.schemas import VeiculoCreate, VeiculoOut

router = APIRouter(prefix="/veiculos", tags=["veiculos"])


@router.get("", response_model=list[VeiculoOut])
def list_veiculos(
    db: Session = Depends(get_db),
    _=Depends(require_roles(PerfilUsuario.ADMIN, PerfilUsuario.MECANICO, PerfilUsuario.SUPERVISOR)),
):
    return db.scalars(select(Veiculo).order_by(Veiculo.placa)).all()


@router.post("", response_model=VeiculoOut)
def create_veiculo(
    veiculo_data: VeiculoCreate,
    db: Session = Depends(get_db),
    _=Depends(require_roles(PerfilUsuario.ADMIN, PerfilUsuario.MECANICO)),
):
    placa_existente = db.scalar(select(Veiculo).where(Veiculo.placa == veiculo_data.placa))
    if placa_existente:
        raise HTTPException(status_code=400, detail="Placa do veículo já existe")

    veiculo = Veiculo(**veiculo_data.model_dump())
    db.add(veiculo)
    db.commit()
    db.refresh(veiculo)
    return veiculo
