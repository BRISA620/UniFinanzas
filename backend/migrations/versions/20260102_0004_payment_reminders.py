"""Add payment reminder tracking flags

Revision ID: 20260102_0004
Revises: 20260101_0003
Create Date: 2026-01-02 16:05:00
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260102_0004"
down_revision = "20260101_0003"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "payments",
        sa.Column("reminder_7_sent", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column(
        "payments",
        sa.Column("reminder_3_sent", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column(
        "payments",
        sa.Column("reminder_0_sent", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )


def downgrade():
    op.drop_column("payments", "reminder_0_sent")
    op.drop_column("payments", "reminder_3_sent")
    op.drop_column("payments", "reminder_7_sent")
