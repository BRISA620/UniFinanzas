import uuid
from datetime import datetime, date
from app.extensions import db


class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    category_id = db.Column(db.String(36), db.ForeignKey('categories.id'), nullable=True, index=True)
    name = db.Column(db.String(255), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    due_date = db.Column(db.Date, nullable=False, default=date.today)
    frequency = db.Column(db.String(20), nullable=False, default='one_time')
    notes = db.Column(db.Text)
    is_paid = db.Column(db.Boolean, default=False)
    reminder_7_sent = db.Column(db.Boolean, default=False)
    reminder_3_sent = db.Column(db.Boolean, default=False)
    reminder_0_sent = db.Column(db.Boolean, default=False)
    paid_at = db.Column(db.DateTime(timezone=True))
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    category = db.relationship('Category', backref=db.backref('payments', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'category_id': self.category_id,
            'category': self.category.to_dict() if self.category else None,
            'name': self.name,
            'amount': float(self.amount),
            'due_date': self.due_date.isoformat(),
            'frequency': self.frequency,
            'notes': self.notes,
            'is_paid': self.is_paid,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
