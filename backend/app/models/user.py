import uuid
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db
from sqlalchemy.ext.mutable import MutableDict


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    verification_token = db.Column(db.String(255))
    reset_token = db.Column(db.String(255))
    reset_token_expires = db.Column(db.DateTime(timezone=True))
    last_login = db.Column(db.DateTime(timezone=True))
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    profile = db.relationship('UserProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    expenses = db.relationship('Expense', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    categories = db.relationship('Category', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    budgets = db.relationship('Budget', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    notifications = db.relationship('Notification', backref='user', lazy='dynamic', cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def __repr__(self):
        return f'<User {self.email}>'


class UserProfile(db.Model):
    __tablename__ = 'user_profiles'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    currency_code = db.Column(db.String(3), default='MXN')
    timezone = db.Column(db.String(50), default='America/Lima')
    weekly_closing_day = db.Column(db.Integer, default=0)  # 0=Sunday
    budget_method = db.Column(db.String(20), default='weekly')
    notification_preferences = db.Column(MutableDict.as_mutable(db.JSON), default=lambda: {
        'push_enabled': True,
        'email_enabled': True,
        'threshold_alerts': True,
        'weekly_summary': True,
        'daily_reminder': False,
        'reminder_time': '20:00',
        'payment_reminders': True,
        'payment_reminder_time': '18:00'
    })
    risk_thresholds = db.Column(MutableDict.as_mutable(db.JSON), default=lambda: {
        'yellow': 60,
        'red': 85
    })
    fcm_token = db.Column(db.String(255))
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def full_name(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name or self.last_name or "Usuario"

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.full_name,
            'currency_code': self.currency_code,
            'timezone': self.timezone,
            'weekly_closing_day': self.weekly_closing_day,
            'budget_method': self.budget_method,
            'notification_preferences': self.notification_preferences,
            'risk_thresholds': self.risk_thresholds,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class RefreshToken(db.Model):
    __tablename__ = 'refresh_tokens'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    token_hash = db.Column(db.String(255), nullable=False)
    device_info = db.Column(db.JSON)
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    revoked = db.Column(db.Boolean, default=False)
    revoked_at = db.Column(db.DateTime(timezone=True))
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('refresh_tokens', lazy='dynamic'))
