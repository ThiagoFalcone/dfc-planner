"""Criação inicial: usuarios, projetos, cenarios, periodos, auditoria_eventos"""

from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "usuarios",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("nome", sa.Text(), nullable=False),
        sa.Column("email", sa.Text(), nullable=False, unique=True),
        sa.Column("senha_hash", sa.Text(), nullable=False),
        sa.Column("empresa", sa.Text(), nullable=True),
        sa.Column("projeto_ativo_id", sa.Text(), nullable=True),
        sa.Column("criado_em", sa.Text(), nullable=False),
    )
    op.create_table(
        "projetos",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("usuario_id", sa.Text(), sa.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("nome_projeto", sa.Text(), nullable=False),
        sa.Column("cenario_ativo_id", sa.Text(), nullable=True),
        sa.Column("criado_em", sa.Text(), nullable=False),
        sa.Column("atualizado_em", sa.Text(), nullable=False),
    )
    op.create_index("ix_projetos_usuario_id", "projetos", ["usuario_id"])
    op.create_table(
        "cenarios",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("projeto_id", sa.Text(), sa.ForeignKey("projetos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("ordem", sa.Integer(), nullable=False),
        sa.Column("nome", sa.Text(), nullable=False),
        sa.Column("descricao_premissas", sa.Text(), nullable=False, server_default=""),
        sa.Column("proveniencia_fonte", sa.Text(), nullable=False),
        sa.Column("proveniencia_referencia", sa.Text(), nullable=False, server_default=""),
        sa.Column("proveniencia_responsavel", sa.Text(), nullable=False),
        sa.Column("proveniencia_atualizado_em", sa.Text(), nullable=False),
        sa.Column("cor", sa.Integer(), nullable=False),
        sa.Column("tma", sa.Text(), nullable=False, server_default=""),
    )
    op.create_index("ix_cenarios_projeto_id", "cenarios", ["projeto_id"])
    # Nota de design: campos monetários em TEXT, não NUMERIC — ver
    # comentário completo na classe Periodo em app/models.py.
    op.create_table(
        "periodos",
        sa.Column("cenario_id", sa.Text(), sa.ForeignKey("cenarios.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("mes", sa.Integer(), primary_key=True),
        sa.Column("receitas", sa.Text(), nullable=False),
        sa.Column("despesas", sa.Text(), nullable=False),
        sa.Column("investimentos", sa.Text(), nullable=False),
        sa.Column("tributos", sa.Text(), nullable=False),
        sa.Column("residual", sa.Text(), nullable=False),
    )
    op.create_table(
        "auditoria_eventos",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("usuario_id", sa.Text(), sa.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("timestamp", sa.Text(), nullable=False),
        sa.Column("projeto_id", sa.Text(), nullable=True),
        sa.Column("projeto_nome", sa.Text(), nullable=True),
        sa.Column("cenario_id", sa.Text(), nullable=True),
        sa.Column("cenario_nome", sa.Text(), nullable=True),
        sa.Column("category", sa.Text(), nullable=False),
        sa.Column("entity", sa.Text(), nullable=False),
        sa.Column("field", sa.Text(), nullable=True),
        sa.Column("previous_value", sa.Text(), nullable=True),
        sa.Column("new_value", sa.Text(), nullable=True),
        sa.Column("action", sa.Text(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
    )
    op.create_index("ix_auditoria_eventos_usuario_id", "auditoria_eventos", ["usuario_id"])
    op.create_index("ix_auditoria_eventos_timestamp", "auditoria_eventos", ["timestamp"])


def downgrade() -> None:
    op.drop_table("auditoria_eventos")
    op.drop_table("periodos")
    op.drop_table("cenarios")
    op.drop_table("projetos")
    op.drop_table("usuarios")
