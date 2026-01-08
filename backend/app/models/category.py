import uuid
from datetime import datetime
from app.extensions import db


class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    icon = db.Column(db.String(50), default='tag')
    color = db.Column(db.String(7), default='#6B7280')  # Hex color
    category_type = db.Column(db.String(20), nullable=False, default='expense', index=True)
    monthly_limit = db.Column(db.Numeric(12, 2))
    description = db.Column(db.String(255))
    is_default = db.Column(db.Boolean, default=False)
    sort_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'name', 'category_type', name='uq_user_category_name_type'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'icon': self.icon,
            'color': self.color,
            'category_type': self.category_type,
            'monthly_limit': float(self.monthly_limit) if self.monthly_limit is not None else None,
            'description': self.description,
            'is_default': self.is_default,
            'sort_order': self.sort_order,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<Category {self.name}>'
