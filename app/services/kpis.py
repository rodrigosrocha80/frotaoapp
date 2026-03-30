from dataclasses import dataclass
from datetime import datetime
from statistics import mean
from typing import Iterable


@dataclass
class RegistroFalha:
    veiculo_id: int
    inicio_falha: datetime
    fim_reparo: datetime
    custo: float


def _hours(seconds: float) -> float:
    return seconds / 3600.0


def calcular_mttr(registros: Iterable[RegistroFalha]) -> float:
    duracoes = [
        _hours((r.fim_reparo - r.inicio_falha).total_seconds())
        for r in registros
        if r.fim_reparo > r.inicio_falha
    ]
    return round(mean(duracoes), 2) if duracoes else 0.0


def calcular_mtbf(registros: Iterable[RegistroFalha]) -> float:
    por_veiculo: dict[int, list[RegistroFalha]] = {}
    for r in registros:
        por_veiculo.setdefault(r.veiculo_id, []).append(r)

    intervalos: list[float] = []
    for falhas in por_veiculo.values():
        ordenadas = sorted(falhas, key=lambda x: x.inicio_falha)
        for i in range(1, len(ordenadas)):
            anterior = ordenadas[i - 1]
            atual = ordenadas[i]
            if atual.inicio_falha > anterior.fim_reparo:
                intervalos.append(_hours((atual.inicio_falha - anterior.fim_reparo).total_seconds()))
    return round(mean(intervalos), 2) if intervalos else 0.0


def calcular_disponibilidade_percentual(mtbf_horas: float, mttr_horas: float) -> float:
    total = mtbf_horas + mttr_horas
    return round((mtbf_horas / total) * 100.0, 2) if total > 0 else 0.0


def calcular_custo_total_manutencao(registros: Iterable[RegistroFalha]) -> float:
    return round(sum(r.custo for r in registros), 2)
