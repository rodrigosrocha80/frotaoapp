from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_roles
from app.models import OrdemServico, PerfilUsuario, StatusOrdemServico
from app.schemas import KPIResponse
from app.services.kpis import (
    RegistroFalha,
    calcular_custo_total_manutencao,
    calcular_disponibilidade_percentual,
    calcular_mtbf,
    calcular_mttr,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/kpis", response_model=KPIResponse)
def get_kpis(
    db: Session = Depends(get_db),
    _=Depends(require_roles(PerfilUsuario.ADMIN, PerfilUsuario.SUPERVISOR, PerfilUsuario.MECANICO)),
):
    os_finalizadas = db.scalars(
        select(OrdemServico).where(
            OrdemServico.status == StatusOrdemServico.FINALIZADO,
            OrdemServico.data_inicio.is_not(None),
            OrdemServico.data_fim.is_not(None),
        )
    ).all()

    registros = [
        RegistroFalha(
            veiculo_id=os.veiculo_id,
            inicio_falha=os.data_inicio,  # type: ignore[arg-type]
            fim_reparo=os.data_fim,  # type: ignore[arg-type]
            custo=float(os.custo_total),
        )
        for os in os_finalizadas
    ]

    mtbf = calcular_mtbf(registros)
    mttr = calcular_mttr(registros)
    disponibilidade = calcular_disponibilidade_percentual(mtbf, mttr)
    custo_total = calcular_custo_total_manutencao(registros)

    return KPIResponse(
        mtbf_horas=mtbf,
        mttr_horas=mttr,
        disponibilidade_percentual=disponibilidade,
        custo_total_manutencao=custo_total,
    )
