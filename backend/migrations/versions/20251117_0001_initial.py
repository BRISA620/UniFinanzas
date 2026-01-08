"""Initial database schema."""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20251117_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False, unique=True, index=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("verification_token", sa.String(length=255)),
        sa.Column("reset_token", sa.String(length=255)),
        sa.Column("reset_token_expires", sa.DateTime(timezone=True)),
        sa.Column("last_login", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "user_profiles",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("first_name", sa.String(length=100)),
        sa.Column("last_name", sa.String(length=100)),
        sa.Column("currency_code", sa.String(length=3), server_default="MXN"),
        sa.Column("timezone", sa.String(length=50), server_default="America/Lima"),
        sa.Column("weekly_closing_day", sa.Integer(), server_default="0"),
        sa.Column("budget_method", sa.String(length=20), server_default="weekly"),
        sa.Column("notification_preferences", sa.JSON(), server_default=sa.text("'{}'")),
        sa.Column("risk_thresholds", sa.JSON(), server_default=sa.text("'{}'")),
        sa.Column("fcm_token", sa.String(length=255)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.String(length=255), nullable=False),
        sa.Column("device_info", sa.JSON()),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("revoked_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "categories",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("icon", sa.String(length=50)),
        sa.Column("color", sa.String(length=7), server_default="#6B7280"),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("sort_order", sa.Integer(), server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "name", name="uq_user_category_name"),
    )
    op.create_index("ix_categories_user_id", "categories", ["user_id"])

    op.create_table(
        "budgets",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("period_start", sa.Date(), nullable=False),
        sa.Column("period_end", sa.Date(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("notes", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("period_end > period_start", name="ck_budget_period"),
        sa.CheckConstraint("total_amount > 0", name="ck_budget_amount"),
    )
    op.create_index("ix_budgets_user_id", "budgets", ["user_id"])

    op.create_table(
        "expenses",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("category_id", sa.String(length=36), sa.ForeignKey("categories.id"), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("expense_date", sa.Date(), nullable=False),
        sa.Column("expense_time", sa.Time(timezone=True)),
        sa.Column("is_recurring", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("tags", sa.JSON(), server_default=sa.text("'[]'")),
        sa.Column("extra_metadata", sa.JSON(), server_default=sa.text("'{}'")),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
        sa.Column("deleted_reason", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_expenses_user_id", "expenses", ["user_id"])
    op.create_index("ix_expenses_category_id", "expenses", ["category_id"])

    op.create_table(
        "attachments",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("expense_id", sa.String(length=36), sa.ForeignKey("expenses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("file_type", sa.String(length=20), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("storage_path", sa.String(length=500), nullable=False),
        sa.Column("storage_url", sa.Text()),
        sa.Column("thumbnail_path", sa.String(length=500)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "budget_allocations",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("budget_id", sa.String(length=36), sa.ForeignKey("budgets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("category_id", sa.String(length=36), sa.ForeignKey("categories.id"), nullable=False),
        sa.Column("allocated_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("budget_id", "category_id", name="uq_budget_category"),
        sa.CheckConstraint("allocated_amount >= 0", name="ck_allocation_amount"),
    )

    op.create_table(
        "savings_goals",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("target_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("current_amount", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("target_date", sa.Date()),
        sa.Column("status", sa.String(length=20), server_default="active"),
        sa.Column("suggested_weekly_amount", sa.Numeric(12, 2)),
        sa.Column("icon", sa.String(length=50)),
        sa.Column("color", sa.String(length=7)),
        sa.Column("notes", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("target_amount > 0", name="ck_goal_target"),
        sa.CheckConstraint("current_amount >= 0", name="ck_goal_current"),
    )
    op.create_index("ix_savings_goals_user_id", "savings_goals", ["user_id"])

    op.create_table(
        "goal_contributions",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("goal_id", sa.String(length=36), sa.ForeignKey("savings_goals.id", ondelete="CASCADE"), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("contribution_date", sa.Date(), nullable=False),
        sa.Column("notes", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("amount > 0", name="ck_contribution_amount"),
    )

    op.create_table(
        "notifications",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("notification_type", sa.String(length=50), nullable=False),
        sa.Column("data", sa.JSON(), server_default=sa.text("'{}'")),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("read_at", sa.DateTime(timezone=True)),
        sa.Column("sent_via", sa.String(length=20), server_default="push"),
        sa.Column("sent_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])
    op.create_index("ix_notifications_is_read", "notifications", ["is_read"])

    op.create_table(
        "weekly_closures",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("budget_id", sa.String(length=36), sa.ForeignKey("budgets.id")),
        sa.Column("period_start", sa.Date(), nullable=False),
        sa.Column("period_end", sa.Date(), nullable=False),
        sa.Column("total_budget", sa.Numeric(12, 2), nullable=False),
        sa.Column("total_spent", sa.Numeric(12, 2), nullable=False),
        sa.Column("risk_level", sa.String(length=20), nullable=False),
        sa.Column("summary_data", sa.JSON(), server_default=sa.text("'{}'")),
        sa.Column("report_sent", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_weekly_closures_user_id", "weekly_closures", ["user_id"])

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("entity_type", sa.String(length=50), nullable=False),
        sa.Column("entity_id", sa.String(length=36), nullable=False),
        sa.Column("action", sa.String(length=20), nullable=False),
        sa.Column("old_values", sa.JSON()),
        sa.Column("new_values", sa.JSON()),
        sa.Column("ip_address", sa.String(length=45)),
        sa.Column("user_agent", sa.Text()),
        sa.Column("reason", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_audit_logs_user_id", "audit_logs", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_audit_logs_user_id", table_name="audit_logs")
    op.drop_table("audit_logs")

    op.drop_index("ix_weekly_closures_user_id", table_name="weekly_closures")
    op.drop_table("weekly_closures")

    op.drop_index("ix_notifications_is_read", table_name="notifications")
    op.drop_index("ix_notifications_user_id", table_name="notifications")
    op.drop_table("notifications")

    op.drop_table("goal_contributions")

    op.drop_index("ix_savings_goals_user_id", table_name="savings_goals")
    op.drop_table("savings_goals")

    op.drop_table("budget_allocations")

    op.drop_table("attachments")

    op.drop_index("ix_expenses_category_id", table_name="expenses")
    op.drop_index("ix_expenses_user_id", table_name="expenses")
    op.drop_table("expenses")

    op.drop_index("ix_budgets_user_id", table_name="budgets")
    op.drop_table("budgets")

    op.drop_index("ix_categories_user_id", table_name="categories")
    op.drop_table("categories")

    op.drop_table("refresh_tokens")

    op.drop_table("user_profiles")

    op.drop_table("users")
