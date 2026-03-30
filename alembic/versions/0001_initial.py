"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-03-30
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM


# revision identifiers, used by Alembic.
revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


perfilusuario_enum = ENUM(
    "ADMIN", "MECANICO", "SUPERVISOR", name="perfilusuario", create_type=False
)
statusveiculo_enum = ENUM(
    "DISPONIVEL", "EM_MANUTENCAO", "INDISPONIVEL", name="statusveiculo", create_type=False
)
statusos_enum = ENUM(
    "ABERTO",
    "EM_CHECKLIST",
    "EM_EXECUCAO",
    "FINALIZADO",
    name="statusordemservico",
    create_type=False,
)
tipomanut_enum = ENUM("PREVENTIVA", "CORRETIVA", name="tipomanutencao", create_type=False)


def upgrade() -> None:
    bind = op.get_bind()
    perfilusuario_enum.create(bind, checkfirst=True)
    statusveiculo_enum.create(bind, checkfirst=True)
    statusos_enum.create(bind, checkfirst=True)
    tipomanut_enum.create(bind, checkfirst=True)

    op.create_table(
        "usuarios",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("supabase_user_id", sa.String(length=64), nullable=True),
        sa.Column("nome", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=180), nullable=False),
        sa.Column("senha_hash", sa.String(length=255), nullable=False),
        sa.Column("perfil", perfilusuario_enum, nullable=False),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("criado_em", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("supabase_user_id"),
    )
    op.create_index("ix_usuarios_email", "usuarios", ["email"], unique=False)
    op.create_index("ix_usuarios_perfil", "usuarios", ["perfil"], unique=False)
    op.create_index("ix_usuarios_supabase_user_id", "usuarios", ["supabase_user_id"], unique=False)

    op.create_table(
        "veiculos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("placa", sa.String(length=10), nullable=False),
        sa.Column("modelo", sa.String(length=120), nullable=False),
        sa.Column("km_atual", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", statusveiculo_enum, nullable=False),
        sa.UniqueConstraint("placa"),
    )
    op.create_index("ix_veiculos_placa", "veiculos", ["placa"], unique=False)
    op.create_index("ix_veiculos_status", "veiculos", ["status"], unique=False)

    op.create_table(
        "pneus",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("codigo_fogo", sa.String(length=60), nullable=False),
        sa.Column("custo_aquisicao", sa.Numeric(12, 2), nullable=False, server_default="0.00"),
        sa.Column("km_acumulado", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("sulco_atual_mm", sa.Numeric(5, 2), nullable=False, server_default="0.00"),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="em_uso"),
        sa.UniqueConstraint("codigo_fogo"),
    )
    op.create_index("ix_pneus_codigo_fogo", "pneus", ["codigo_fogo"], unique=False)

    op.create_table(
        "ordens_servico",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("veiculo_id", sa.Integer(), sa.ForeignKey("veiculos.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("criada_por_id", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("responsavel_id", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("tipo_manutencao", tipomanut_enum, nullable=False),
        sa.Column("status", statusos_enum, nullable=False),
        sa.Column("descricao", sa.Text(), nullable=False),
        sa.Column("custo_total", sa.Numeric(12, 2), nullable=False, server_default="0.00"),
        sa.Column("data_abertura", sa.DateTime(), nullable=False),
        sa.Column("data_inicio", sa.DateTime(), nullable=True),
        sa.Column("data_fim", sa.DateTime(), nullable=True),
        sa.Column("km_abertura", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("km_fechamento", sa.Integer(), nullable=True),
    )
    op.create_index("ix_ordens_servico_status", "ordens_servico", ["status"], unique=False)
    op.create_index("ix_ordens_servico_veiculo_id", "ordens_servico", ["veiculo_id"], unique=False)

    op.create_table(
        "manutencoes_preventivas",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("veiculo_id", sa.Integer(), sa.ForeignKey("veiculos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("descricao", sa.String(length=200), nullable=False),
        sa.Column("periodicidade_km", sa.Integer(), nullable=True),
        sa.Column("periodicidade_dias", sa.Integer(), nullable=True),
        sa.Column("ultimo_km_execucao", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ultima_execucao_em", sa.Date(), nullable=True),
        sa.Column("proximo_km_previsto", sa.Integer(), nullable=True),
        sa.Column("proxima_data_prevista", sa.Date(), nullable=True),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.create_index("ix_manutencoes_preventivas_veiculo_id", "manutencoes_preventivas", ["veiculo_id"], unique=False)

    op.create_table(
        "veiculo_pneu_posicoes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("veiculo_id", sa.Integer(), sa.ForeignKey("veiculos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("pneu_id", sa.Integer(), sa.ForeignKey("pneus.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("eixo_numero", sa.Integer(), nullable=False),
        sa.Column("lado", sa.String(length=1), nullable=False),
        sa.Column("posicao_no_eixo", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("km_instalacao", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("instalado_em", sa.DateTime(), nullable=False),
        sa.Column("removido_em", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("veiculo_id", "eixo_numero", "lado", "posicao_no_eixo", name="uq_posicao_ativa"),
    )
    op.create_index("ix_veiculo_pneu_posicoes_pneu_id", "veiculo_pneu_posicoes", ["pneu_id"], unique=False)
    op.create_index("ix_veiculo_pneu_posicoes_veiculo_id", "veiculo_pneu_posicoes", ["veiculo_id"], unique=False)

    op.create_table(
        "pneu_historico_sulco",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("pneu_id", sa.Integer(), sa.ForeignKey("pneus.id", ondelete="CASCADE"), nullable=False),
        sa.Column("data_medicao", sa.Date(), nullable=False),
        sa.Column("sulco_mm", sa.Numeric(5, 2), nullable=False),
        sa.Column("km_no_momento", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("observacao", sa.Text(), nullable=True),
    )
    op.create_index("ix_pneu_historico_sulco_pneu_id", "pneu_historico_sulco", ["pneu_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_pneu_historico_sulco_pneu_id", table_name="pneu_historico_sulco")
    op.drop_table("pneu_historico_sulco")

    op.drop_index("ix_veiculo_pneu_posicoes_veiculo_id", table_name="veiculo_pneu_posicoes")
    op.drop_index("ix_veiculo_pneu_posicoes_pneu_id", table_name="veiculo_pneu_posicoes")
    op.drop_table("veiculo_pneu_posicoes")

    op.drop_index("ix_manutencoes_preventivas_veiculo_id", table_name="manutencoes_preventivas")
    op.drop_table("manutencoes_preventivas")

    op.drop_index("ix_ordens_servico_veiculo_id", table_name="ordens_servico")
    op.drop_index("ix_ordens_servico_status", table_name="ordens_servico")
    op.drop_table("ordens_servico")

    op.drop_index("ix_pneus_codigo_fogo", table_name="pneus")
    op.drop_table("pneus")

    op.drop_index("ix_veiculos_status", table_name="veiculos")
    op.drop_index("ix_veiculos_placa", table_name="veiculos")
    op.drop_table("veiculos")

    op.drop_index("ix_usuarios_supabase_user_id", table_name="usuarios")
    op.drop_index("ix_usuarios_perfil", table_name="usuarios")
    op.drop_index("ix_usuarios_email", table_name="usuarios")
    op.drop_table("usuarios")

    bind = op.get_bind()
    tipomanut_enum.drop(bind, checkfirst=True)
    statusos_enum.drop(bind, checkfirst=True)
    statusveiculo_enum.drop(bind, checkfirst=True)
    perfilusuario_enum.drop(bind, checkfirst=True)
