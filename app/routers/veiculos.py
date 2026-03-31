from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_roles
from app.models import PerfilUsuario, Veiculo
from app.schemas import VeiculoOut

router = APIRouter(prefix="/veiculos", tags=["veiculos"])


@router.get("", response_model=list[VeiculoOut])
def list_veiculos(
    db: Session = Depends(get_db),
    _=Depends(require_roles(PerfilUsuario.ADMIN, PerfilUsuario.MECANICO, PerfilUsuario.SUPERVISOR)),
):
    return db.scalars(select(Veiculo).order_by(Veiculo.placa)).all()
