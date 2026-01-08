"""Add category fields for redesigned categories

Revision ID: 20260101_0003
Revises: 20260101_0002
Create Date: 2026-01-02 00:10:00
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260101_0003"
down_revision = "20260101_0002"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "categories",
        sa.Column("category_type", sa.String(length=20), nullable=False, server_default="expense"),
    )
    op.add_column("categories", sa.Column("monthly_limit", sa.Numeric(12, 2), nullable=True))
    op.add_column("categories", sa.Column("description", sa.String(length=255), nullable=True))
    op.drop_constraint("uq_user_category_name", "categories", type_="unique")
    op.create_unique_constraint(
        "uq_user_category_name_type",
        "categories",
        ["user_id", "name", "category_type"],
    )
    op.create_index("ix_categories_category_type", "categories", ["category_type"])


def downgrade():
    op.drop_index("ix_categories_category_type", table_name="categories")
    op.drop_constraint("uq_user_category_name_type", "categories", type_="unique")
    op.create_unique_constraint(
        "uq_user_category_name",
        "categories",
        ["user_id", "name"],
    )
    op.drop_column("categories", "description")
    op.drop_column("categories", "monthly_limit")
    op.drop_column("categories", "category_type")
