import uuid
from datetime import datetime
from app.extensions import db


class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(50), nullable=False)  # 'threshold_alert', 'weekly_summary', 'reminder', 'daily_reminder'
    data = db.Column(db.JSON, default=dict)
    is_read = db.Column(db.Boolean, default=False)
    read_at = db.Column(db.DateTime(timezone=True))
    sent_via = db.Column(db.String(20), default='push')  # 'push', 'email', 'both', 'none'
    sent_at = db.Column(db.DateTime(timezone=True))
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

    def mark_as_read(self):
        self.is_read = True
        self.read_at = datetime.utcnow()

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'notification_type': self.notification_type,
            'data': self.data,
            'is_read': self.is_read,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'sent_via': self.sent_via,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'created_at': self.created_at.isoformat()
        }

    def __repr__(self):
        return f'<Notification {self.title}>'
