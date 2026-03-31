from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class PerfilUsuario(str, Enum):
    ADMIN = "admin"
    MECANICO = "mecanico"
    SUPERVISOR = "supervisor"


class StatusVeiculo(str, Enum):
    DISPONIVEL = "disponivel"
    EM_MANUTENCAO = "em_manutencao"
    INDISPONIVEL = "indisponivel"


class StatusOrdemServico(str, Enum):
    ABERTO = "aberto"
    EM_CHECKLIST = "em_checklist"
    EM_EXECUCAO = "em_execucao"
    FINALIZADO = "finalizado"


class TipoManutencao(str, Enum):
    PREVENTIVA = "preventiva"
    CORRETIVA = "corretiva"


class CategoriaEquipamento(str, Enum):
    VEICULO = "veiculo"
    EQUIPAMENTO = "equipamento"
    MAQUINA = "maquina"
    OUTRO = "outro"


class TipoCombustivel(str, Enum):
    GASOLINA = "gasolina"
    DIESEL = "diesel"
    ALCOOL = "alcool"
    GNV = "gnv"
    HIBRIDO = "hibrido"
    ELETRICO = "eletrico"
    OUTRO = "outro"


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    supabase_user_id: Mapped[Optional[str]] = mapped_column(String(64), unique=True, nullable=True, index=True)
    nome: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(180), unique=True, nullable=False, index=True)
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    perfil: Mapped[PerfilUsuario] = mapped_column(SAEnum(PerfilUsuario), nullable=False, index=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Veiculo(Base):
    __tablename__ = "veiculos"

    id: Mapped[int] = mapped_column(primary_key=True)
    placa: Mapped[str] = mapped_column(String(10), unique=True, nullable=False, index=True)
    modelo: Mapped[str] = mapped_column(String(120), nullable=False)
    km_atual: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[StatusVeiculo] = mapped_column(
        SAEnum(StatusVeiculo), default=StatusVeiculo.DISPONIVEL, nullable=False, index=True
    )

    pneus_posicoes: Mapped[list[VeiculoPneuPosicao]] = relationship(back_populates="veiculo")
    ordens_servico: Mapped[list[OrdemServico]] = relationship(back_populates="veiculo")


class Pneu(Base):
    __tablename__ = "pneus"

    id: Mapped[int] = mapped_column(primary_key=True)
    codigo_fogo: Mapped[str] = mapped_column(String(60), unique=True, nullable=False, index=True)
    custo_aquisicao: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    km_acumulado: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sulco_atual_mm: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=Decimal("0.00"))
    status: Mapped[str] = mapped_column(String(30), default="em_uso", nullable=False)

    posicoes: Mapped[list[VeiculoPneuPosicao]] = relationship(back_populates="pneu")
    historico_sulco: Mapped[list[PneuHistoricoSulco]] = relationship(back_populates="pneu")


class VeiculoPneuPosicao(Base):
    __tablename__ = "veiculo_pneu_posicoes"

    id: Mapped[int] = mapped_column(primary_key=True)
    veiculo_id: Mapped[int] = mapped_column(ForeignKey("veiculos.id", ondelete="CASCADE"), nullable=False, index=True)
    pneu_id: Mapped[int] = mapped_column(ForeignKey("pneus.id", ondelete="RESTRICT"), nullable=False, index=True)
    eixo_numero: Mapped[int] = mapped_column(Integer, nullable=False)
    lado: Mapped[str] = mapped_column(String(1), nullable=False)
    posicao_no_eixo: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    km_instalacao: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    instalado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    removido_em: Mapped[Optional[datetime]] = mapped_column(DateTime)

    veiculo: Mapped[Veiculo] = relationship(back_populates="pneus_posicoes")
    pneu: Mapped[Pneu] = relationship(back_populates="posicoes")

    __table_args__ = (
        UniqueConstraint("veiculo_id", "eixo_numero", "lado", "posicao_no_eixo", name="uq_posicao_ativa"),
    )


class PneuHistoricoSulco(Base):
    __tablename__ = "pneu_historico_sulco"

    id: Mapped[int] = mapped_column(primary_key=True)
    pneu_id: Mapped[int] = mapped_column(ForeignKey("pneus.id", ondelete="CASCADE"), nullable=False, index=True)
    data_medicao: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    sulco_mm: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    km_no_momento: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    observacao: Mapped[Optional[str]] = mapped_column(Text)

    pneu: Mapped[Pneu] = relationship(back_populates="historico_sulco")


class OrdemServico(Base):
    __tablename__ = "ordens_servico"

    id: Mapped[int] = mapped_column(primary_key=True)
    veiculo_id: Mapped[int] = mapped_column(ForeignKey("veiculos.id", ondelete="RESTRICT"), nullable=False, index=True)
    criada_por_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="RESTRICT"), nullable=False)
    responsavel_id: Mapped[Optional[int]] = mapped_column(ForeignKey("usuarios.id", ondelete="SET NULL"))
    tipo_manutencao: Mapped[TipoManutencao] = mapped_column(SAEnum(TipoManutencao), nullable=False)
    status: Mapped[StatusOrdemServico] = mapped_column(
        SAEnum(StatusOrdemServico), default=StatusOrdemServico.ABERTO, nullable=False, index=True
    )
    descricao: Mapped[str] = mapped_column(Text, nullable=False)
    custo_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    data_abertura: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    data_inicio: Mapped[Optional[datetime]] = mapped_column(DateTime)
    data_fim: Mapped[Optional[datetime]] = mapped_column(DateTime)
    km_abertura: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    km_fechamento: Mapped[Optional[int]] = mapped_column(Integer)

    veiculo: Mapped[Veiculo] = relationship(back_populates="ordens_servico")


class ManutencaoPreventiva(Base):
    __tablename__ = "manutencoes_preventivas"

    id: Mapped[int] = mapped_column(primary_key=True)
    veiculo_id: Mapped[int] = mapped_column(ForeignKey("veiculos.id", ondelete="CASCADE"), nullable=False, index=True)
    descricao: Mapped[str] = mapped_column(String(200), nullable=False)
    periodicidade_km: Mapped[Optional[int]] = mapped_column(Integer)
    periodicidade_dias: Mapped[Optional[int]] = mapped_column(Integer)
    ultimo_km_execucao: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ultima_execucao_em: Mapped[Optional[date]] = mapped_column(Date)
    proximo_km_previsto: Mapped[Optional[int]] = mapped_column(Integer)
    proxima_data_prevista: Mapped[Optional[date]] = mapped_column(Date)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Equipamento(Base):
    __tablename__ = "equipamentos"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    descricao: Mapped[Optional[str]] = mapped_column(Text)
    categoria: Mapped[CategoriaEquipamento] = mapped_column(SAEnum(CategoriaEquipamento), nullable=False, index=True)
    cor: Mapped[Optional[str]] = mapped_column(String(50))
    ano: Mapped[Optional[int]] = mapped_column(Integer)
    modelo: Mapped[Optional[str]] = mapped_column(String(120))
    renavam: Mapped[Optional[str]] = mapped_column(String(11), unique=True, index=True)
    numero_serie: Mapped[Optional[str]] = mapped_column(String(100), unique=True, index=True)
    chassi: Mapped[Optional[str]] = mapped_column(String(17), unique=True, index=True)
    placa: Mapped[Optional[str]] = mapped_column(String(10), unique=True, index=True)
    etiqueta_tag: Mapped[Optional[str]] = mapped_column(String(50), unique=True, index=True)
    capacidade_tanque: Mapped[Optional[Decimal]] = mapped_column(Numeric(8, 2))
    tipo_combustivel: Mapped[Optional[TipoCombustivel]] = mapped_column(SAEnum(TipoCombustivel))
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
