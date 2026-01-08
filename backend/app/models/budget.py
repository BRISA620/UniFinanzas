import uuid
from datetime import datetime
from app.extensions import db


class Budget(db.Model):
    __tablename__ = 'budgets'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    total_amount = db.Column(db.Numeric(12, 2), nullable=False)
    period_start = db.Column(db.Date, nullable=False)
    period_end = db.Column(db.Date, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    allocations = db.relationship('BudgetAllocation', backref='budget', lazy='joined', cascade='all, delete-orphan')

    __table_args__ = (
        db.CheckConstraint('period_end > period_start', name='ck_budget_period'),
        db.CheckConstraint('total_amount > 0', name='ck_budget_amount'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'total_amount': float(self.total_amount),
            'period_start': self.period_start.isoformat(),
            'period_end': self.period_end.isoformat(),
            'is_active': self.is_active,
            'notes': self.notes,
            'allocations': [a.to_dict() for a in self.allocations],
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def __repr__(self):
        return f'<Budget ${self.total_amount} ({self.period_start} - {self.period_end})>'


class BudgetAllocation(db.Model):
    __tablename__ = 'budget_allocations'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    budget_id = db.Column(db.String(36), db.ForeignKey('budgets.id', ondelete='CASCADE'), nullable=False)
    category_id = db.Column(db.String(36), db.ForeignKey('categories.id'), nullable=False)
    allocated_amount = db.Column(db.Numeric(12, 2), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    category = db.relationship('Category')

    __table_args__ = (
        db.UniqueConstraint('budget_id', 'category_id', name='uq_budget_category'),
        db.CheckConstraint('allocated_amount >= 0', name='ck_allocation_amount'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'budget_id': self.budget_id,
            'category_id': self.category_id,
            'category': self.category.to_dict() if self.category else None,
            'allocated_amount': float(self.allocated_amount),
            'created_at': self.created_at.isoformat()
        }
