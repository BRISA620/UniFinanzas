"""Add payments table

Revision ID: 20260101_0002
Revises: 20251117_0001
Create Date: 2026-01-01 23:30:00
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260101_0002"
down_revision = "20251117_0001"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "payments",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("category_id", sa.String(length=36), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("frequency", sa.String(length=20), nullable=False, server_default="one_time"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("is_paid", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"]),
    )
    op.create_index("ix_payments_user_id", "payments", ["user_id"])
    op.create_index("ix_payments_category_id", "payments", ["category_id"])
    op.create_index("ix_payments_due_date", "payments", ["due_date"])


def downgrade():
    op.drop_index("ix_payments_due_date", table_name="payments")
    op.drop_index("ix_payments_category_id", table_name="payments")
    op.drop_index("ix_payments_user_id", table_name="payments")
    op.drop_table("payments")
