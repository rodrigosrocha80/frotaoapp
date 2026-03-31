from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    Equipamento,
    OrdemServico,
    Pneu,
    PneuHistoricoSulco,
    StatusOrdemServico,
    StatusVeiculo,
    Veiculo,
    VeiculoPneuPosicao,
)
from app.schemas import OSFinalizarInput


def finalizar_ordem_servico(db: Session, os_id: int, payload: OSFinalizarInput) -> OrdemServico:
    os_obj = db.get(OrdemServico, os_id)
    if not os_obj:
        raise ValueError("Ordem de Servico nao encontrada")
    if os_obj.status == StatusOrdemServico.FINALIZADO:
        raise ValueError("Ordem de Servico ja finalizada")
    if payload.km_fechamento < os_obj.km_abertura:
        raise ValueError("km_fechamento nao pode ser menor que km_abertura")

    # Atualiza OS
    os_obj.km_fechamento = payload.km_fechamento
    os_obj.custo_total = payload.custo_total
    os_obj.data_fim = payload.data_fim or datetime.utcnow()
    os_obj.status = StatusOrdemServico.FINALIZADO

    if os_obj.veiculo_id:
        veiculo = db.get(Veiculo, os_obj.veiculo_id)
        if not veiculo:
            raise ValueError("Veiculo vinculado nao encontrado")

        delta_km = payload.km_fechamento - os_obj.km_abertura

        veiculo.km_atual = max(veiculo.km_atual, payload.km_fechamento)
        veiculo.status = StatusVeiculo(payload.status_veiculo_final)

        posicoes_ativas = db.scalars(
            select(VeiculoPneuPosicao).where(
                VeiculoPneuPosicao.veiculo_id == veiculo.id,
                VeiculoPneuPosicao.removido_em.is_(None),
            )
        ).all()
        for pos in posicoes_ativas:
            pneu = db.get(Pneu, pos.pneu_id)
            if pneu:
                pneu.km_acumulado += delta_km

        for leitura in payload.sulcos:
            pneu = db.get(Pneu, leitura.pneu_id)
            if not pneu:
                continue
            pneu.sulco_atual_mm = leitura.sulco_mm
            db.add(
                PneuHistoricoSulco(
                    pneu_id=pneu.id,
                    sulco_mm=leitura.sulco_mm,
                    km_no_momento=payload.km_fechamento,
                )
            )

        db.add(veiculo)
    elif os_obj.equipamento_id:
        equipamento = db.get(Equipamento, os_obj.equipamento_id)
        if not equipamento:
            raise ValueError("Equipamento vinculado nao encontrado")
        if payload.sulcos:
            raise ValueError("Leituras de sulco nao se aplicam a ordens de servico de equipamento")
    else:
        raise ValueError("Ordem de Servico sem vinculo com veiculo ou equipamento")

    db.add(os_obj)
    db.commit()
    db.refresh(os_obj)
    return os_obj
