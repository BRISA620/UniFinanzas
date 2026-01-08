from flask import request
from app.extensions import db
from app.models import AuditLog


def log_audit(user_id, entity_type, entity_id, action, old_values=None, new_values=None, reason=None):
    """Log audit trail for entity changes"""
    try:
        audit_log = AuditLog(
            user_id=user_id,
            entity_type=entity_type,
            entity_id=str(entity_id),
            action=action,
            old_values=old_values,
            new_values=new_values,
            ip_address=request.remote_addr if request else None,
            user_agent=request.headers.get('User-Agent') if request else None,
            reason=reason
        )

        db.session.add(audit_log)
        db.session.commit()

    except Exception as e:
        # Don't fail the main operation if audit fails
        db.session.rollback()
        print(f"Audit log error: {e}")


def get_audit_trail(user_id, entity_type=None, entity_id=None, limit=100):
    """Get audit trail for user"""
    query = AuditLog.query.filter_by(user_id=user_id)

    if entity_type:
        query = query.filter_by(entity_type=entity_type)

    if entity_id:
        query = query.filter_by(entity_id=str(entity_id))

    return query.order_by(AuditLog.created_at.desc()).limit(limit).all()
