import uuid
from datetime import datetime, date
from app.extensions import db


class Expense(db.Model):
    __tablename__ = 'expenses'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    category_id = db.Column(db.String(36), db.ForeignKey('categories.id'), nullable=False, index=True)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    description = db.Column(db.Text)
    expense_date = db.Column(db.Date, nullable=False, default=date.today)
    expense_time = db.Column(db.Time(timezone=True), default=lambda: datetime.now().time())
    is_recurring = db.Column(db.Boolean, default=False)
    tags = db.Column(db.JSON, default=list)  # Array of tags
    extra_metadata = db.Column(db.JSON, default=dict)
    is_deleted = db.Column(db.Boolean, default=False)
    deleted_at = db.Column(db.DateTime(timezone=True))
    deleted_reason = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    category = db.relationship('Category', backref=db.backref('expenses', lazy='dynamic'))
    attachments = db.relationship('Attachment', backref='expense', lazy='joined', cascade='all, delete-orphan')

    def soft_delete(self, reason=None):
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()
        self.deleted_reason = reason

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'amount': float(self.amount),
            'category_id': self.category_id,
            'category': self.category.to_dict() if self.category else None,
            'description': self.description,
            'expense_date': self.expense_date.isoformat(),
            'expense_time': self.expense_time.isoformat() if self.expense_time else None,
            'is_recurring': self.is_recurring,
            'tags': self.tags or [],
            'attachments': [a.to_dict() for a in self.attachments],
            'metadata': self.extra_metadata or {},
            'is_deleted': self.is_deleted,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def __repr__(self):
        return f'<Expense ${self.amount} on {self.expense_date}>'


class Attachment(db.Model):
    __tablename__ = 'attachments'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    expense_id = db.Column(db.String(36), db.ForeignKey('expenses.id', ondelete='CASCADE'), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(20), nullable=False)  # 'image', 'pdf', 'other'
    mime_type = db.Column(db.String(100), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)  # bytes
    storage_path = db.Column(db.String(500), nullable=False)
    storage_url = db.Column(db.Text)
    thumbnail_path = db.Column(db.String(500))
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'expense_id': self.expense_id,
            'file_name': self.file_name,
            'file_type': self.file_type,
            'mime_type': self.mime_type,
            'file_size': self.file_size,
            'url': self.storage_url,
            'thumbnail_url': self.thumbnail_path,
            'created_at': self.created_at.isoformat()
        }

    def __repr__(self):
        return f'<Attachment {self.file_name}>'
