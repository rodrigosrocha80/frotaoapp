"""add equipamentos table

Revision ID: 0002_add_equipamentos
Revises: 0001_initial
Create Date: 2026-03-31
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM


# revision identifiers, used by Alembic.
revision = "0002_add_equipamentos"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


categoria_equipamento_enum = ENUM(
    "VEICULO", "EQUIPAMENTO", "MAQUINA", "OUTRO", name="categoriaequipamento", create_type=False
)
tipo_combustivel_enum = ENUM(
    "GASOLINA", "DIESEL", "ALCOOL", "GNV", "HIBRIDO", "ELETRICO", "OUTRO",
    name="tipocombustivel", create_type=False
)


def upgrade() -> None:
    bind = op.get_bind()
    categoria_equipamento_enum.create(bind, checkfirst=True)
    tipo_combustivel_enum.create(bind, checkfirst=True)

    op.create_table(
        "equipamentos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nome", sa.String(length=120), nullable=False),
        sa.Column("descricao", sa.Text(), nullable=True),
        sa.Column("categoria", categoria_equipamento_enum, nullable=False),
        sa.Column("cor", sa.String(length=50), nullable=True),
        sa.Column("ano", sa.Integer(), nullable=True),
        sa.Column("modelo", sa.String(length=120), nullable=True),
        sa.Column("renavam", sa.String(length=11), nullable=True),
        sa.Column("numero_serie", sa.String(length=100), nullable=True),
        sa.Column("chassi", sa.String(length=17), nullable=True),
        sa.Column("placa", sa.String(length=10), nullable=True),
        sa.Column("etiqueta_tag", sa.String(length=50), nullable=True),
        sa.Column("capacidade_tanque", sa.Numeric(8, 2), nullable=True),
        sa.Column("tipo_combustivel", tipo_combustivel_enum, nullable=True),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("criado_em", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("renavam", name="uq_equipamento_renavam"),
        sa.UniqueConstraint("numero_serie", name="uq_equipamento_numero_serie"),
        sa.UniqueConstraint("chassi", name="uq_equipamento_chassi"),
        sa.UniqueConstraint("placa", name="uq_equipamento_placa"),
        sa.UniqueConstraint("etiqueta_tag", name="uq_equipamento_etiqueta_tag"),
    )
    op.create_index("ix_equipamentos_nome", "equipamentos", ["nome"], unique=False)
    op.create_index("ix_equipamentos_categoria", "equipamentos", ["categoria"], unique=False)
    op.create_index("ix_equipamentos_ativo", "equipamentos", ["ativo"], unique=False)
    op.create_index("ix_equipamentos_placa", "equipamentos", ["placa"], unique=False)
    op.create_index("ix_equipamentos_renavam", "equipamentos", ["renavam"], unique=False)
    op.create_index("ix_equipamentos_numero_serie", "equipamentos", ["numero_serie"], unique=False)
    op.create_index("ix_equipamentos_chassi", "equipamentos", ["chassi"], unique=False)
    op.create_index("ix_equipamentos_etiqueta_tag", "equipamentos", ["etiqueta_tag"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_equipamentos_etiqueta_tag", table_name="equipamentos")
    op.drop_index("ix_equipamentos_chassi", table_name="equipamentos")
    op.drop_index("ix_equipamentos_numero_serie", table_name="equipamentos")
    op.drop_index("ix_equipamentos_renavam", table_name="equipamentos")
    op.drop_index("ix_equipamentos_placa", table_name="equipamentos")
    op.drop_index("ix_equipamentos_ativo", table_name="equipamentos")
    op.drop_index("ix_equipamentos_categoria", table_name="equipamentos")
    op.drop_index("ix_equipamentos_nome", table_name="equipamentos")
    op.drop_table("equipamentos")

    bind = op.get_bind()
    tipo_combustivel_enum.drop(bind, checkfirst=True)
    categoria_equipamento_enum.drop(bind, checkfirst=True)
