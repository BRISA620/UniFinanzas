import uuid
from datetime import datetime
from app.extensions import db


class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    entity_type = db.Column(db.String(50), nullable=False)  # 'expense', 'budget', 'category', etc.
    entity_id = db.Column(db.String(36), nullable=False)
    action = db.Column(db.String(20), nullable=False)  # 'create', 'update', 'delete'
    old_values = db.Column(db.JSON)
    new_values = db.Column(db.JSON)
    ip_address = db.Column(db.String(45))  # IPv6 compatible
    user_agent = db.Column(db.Text)
    reason = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'action': self.action,
            'old_values': self.old_values,
            'new_values': self.new_values,
            'ip_address': self.ip_address,
            'reason': self.reason,
            'created_at': self.created_at.isoformat()
        }

    def __repr__(self):
        return f'<AuditLog {self.action} on {self.entity_type}:{self.entity_id}>'
