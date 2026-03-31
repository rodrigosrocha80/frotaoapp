from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


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


class OSCreate(BaseModel):
    veiculo_id: int
    tipo_manutencao: TipoManutencao
    descricao: str
    responsavel_id: Optional[int] = None
    km_abertura: int = Field(ge=0)


class OSStatusUpdate(BaseModel):
    status: StatusOrdemServico


class PneuSulcoInput(BaseModel):
    pneu_id: int
    sulco_mm: Decimal = Field(ge=0)


class OSFinalizarInput(BaseModel):
    km_fechamento: int = Field(ge=0)
    custo_total: Decimal = Field(ge=0)
    status_veiculo_final: StatusVeiculo = StatusVeiculo.DISPONIVEL
    data_fim: datetime | None = None
    sulcos: list[PneuSulcoInput] = []


class KPIResponse(BaseModel):
    mtbf_horas: float
    mttr_horas: float
    disponibilidade_percentual: float
    custo_total_manutencao: float


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    email: str
    perfil: PerfilUsuario


class VeiculoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    placa: str
    modelo: str
    km_atual: int
    status: StatusVeiculo


class OrdemServicoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    id: int
    veiculo_id: int
    criada_por_id: int
    responsavel_id: Optional[int] = None
    tipo_manutencao: TipoManutencao
    status: StatusOrdemServico
    descricao: str
    custo_total: Decimal
    data_abertura: datetime
    data_inicio: Optional[datetime] = None
    data_fim: Optional[datetime] = None
    km_abertura: int
    km_fechamento: Optional[int] = None


class EquipamentoCreate(BaseModel):
    nome: str
    descricao: Optional[str] = None
    categoria: CategoriaEquipamento
    cor: Optional[str] = None
    ano: Optional[int] = None
    modelo: Optional[str] = None
    renavam: Optional[str] = None
    numero_serie: Optional[str] = None
    chassi: Optional[str] = None
    placa: Optional[str] = None
    etiqueta_tag: Optional[str] = None
    capacidade_tanque: Optional[Decimal] = None
    tipo_combustivel: Optional[TipoCombustivel] = None


class EquipamentoUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    categoria: Optional[CategoriaEquipamento] = None
    cor: Optional[str] = None
    ano: Optional[int] = None
    modelo: Optional[str] = None
    renavam: Optional[str] = None
    numero_serie: Optional[str] = None
    chassi: Optional[str] = None
    placa: Optional[str] = None
    etiqueta_tag: Optional[str] = None
    capacidade_tanque: Optional[Decimal] = None
    tipo_combustivel: Optional[TipoCombustivel] = None
    ativo: Optional[bool] = None


class EquipamentoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    descricao: Optional[str] = None
    categoria: CategoriaEquipamento
    cor: Optional[str] = None
    ano: Optional[int] = None
    modelo: Optional[str] = None
    renavam: Optional[str] = None
    numero_serie: Optional[str] = None
    chassi: Optional[str] = None
    placa: Optional[str] = None
    etiqueta_tag: Optional[str] = None
    capacidade_tanque: Optional[Decimal] = None
    tipo_combustivel: Optional[TipoCombustivel] = None
    ativo: bool
    criado_em: datetime
