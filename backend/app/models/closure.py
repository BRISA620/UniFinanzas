import uuid
from datetime import datetime
from app.extensions import db


class WeeklyClosure(db.Model):
    __tablename__ = 'weekly_closures'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    budget_id = db.Column(db.String(36), db.ForeignKey('budgets.id'))
    period_start = db.Column(db.Date, nullable=False)
    period_end = db.Column(db.Date, nullable=False)
    total_budget = db.Column(db.Numeric(12, 2), nullable=False)
    total_spent = db.Column(db.Numeric(12, 2), nullable=False)
    risk_level = db.Column(db.String(20), nullable=False)  # 'green', 'yellow', 'red'
    summary_data = db.Column(db.JSON, nullable=False, default=dict)
    report_sent = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    budget = db.relationship('Budget', backref=db.backref('closures', lazy='dynamic'))

    @property
    def total_saved(self):
        return float(self.total_budget - self.total_spent)

    @property
    def percentage_used(self):
        if self.total_budget and self.total_budget > 0:
            return float((self.total_spent / self.total_budget) * 100)
        return 0

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'budget_id': self.budget_id,
            'period_start': self.period_start.isoformat(),
            'period_end': self.period_end.isoformat(),
            'total_budget': float(self.total_budget),
            'total_spent': float(self.total_spent),
            'total_saved': self.total_saved,
            'percentage_used': round(self.percentage_used, 2),
            'risk_level': self.risk_level,
            'summary_data': self.summary_data,
            'report_sent': self.report_sent,
            'created_at': self.created_at.isoformat()
        }

    def __repr__(self):
        return f'<WeeklyClosure {self.period_start} - {self.period_end}>'
