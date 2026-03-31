"""allow service orders for vehicle or equipment

Revision ID: 0003_add_equipamento_to_ordens_servico
Revises: 0002_add_equipamentos
Create Date: 2026-03-31
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0003_add_equipamento_to_ordens_servico"
down_revision = "0002_add_equipamentos"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("ordens_servico", sa.Column("equipamento_id", sa.Integer(), nullable=True))
    op.create_index("ix_ordens_servico_equipamento_id", "ordens_servico", ["equipamento_id"], unique=False)
    op.create_foreign_key(
        "fk_ordens_servico_equipamento_id",
        "ordens_servico",
        "equipamentos",
        ["equipamento_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.alter_column("ordens_servico", "veiculo_id", existing_type=sa.Integer(), nullable=True)
    op.create_check_constraint(
        "ck_ordens_servico_target_unico",
        "ordens_servico",
        "(veiculo_id IS NOT NULL AND equipamento_id IS NULL) OR "
        "(veiculo_id IS NULL AND equipamento_id IS NOT NULL)",
    )


def downgrade() -> None:
    op.drop_constraint("ck_ordens_servico_target_unico", "ordens_servico", type_="check")
    op.alter_column("ordens_servico", "veiculo_id", existing_type=sa.Integer(), nullable=False)
    op.drop_constraint("fk_ordens_servico_equipamento_id", "ordens_servico", type_="foreignkey")
    op.drop_index("ix_ordens_servico_equipamento_id", table_name="ordens_servico")
    op.drop_column("ordens_servico", "equipamento_id")
