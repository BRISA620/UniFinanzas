from datetime import datetime
from typing import Dict, Iterable, Optional

from flask import current_app

from app.extensions import db
from app.models import Notification, UserProfile, User
from app.services.email_service import EmailService
from app.services.push_service import PushService


class NotificationService:
    """Centralized notification dispatch (DB record + push/email)."""

    @staticmethod
    def send_notification(
        user_id: str,
        title: str,
        message: str,
        notification_type: str = "general",
        data: Optional[Dict] = None,
        channels: Iterable[str] = ("push", "email", "db"),
    ) -> Notification:
        """Create a notification record and deliver through available channels."""
        user = User.query.filter_by(id=user_id).first()
        if not user:
            raise ValueError("User not found")

        profile = UserProfile.query.filter_by(user_id=user_id).first()
        prefs = profile.notification_preferences if profile else {}

        # Channel gating based on preferences and notification type
        push_allowed = prefs.get("push_enabled", True) and profile and profile.fcm_token
        email_allowed = prefs.get("email_enabled", True) and user.email

        if notification_type == "threshold_alert":
            push_allowed = push_allowed and prefs.get("threshold_alerts", True)
            email_allowed = email_allowed and prefs.get("threshold_alerts", True)
        if notification_type == "weekly_summary":
            push_allowed = push_allowed and prefs.get("weekly_summary", True)
            email_allowed = email_allowed and prefs.get("weekly_summary", True)

        send_push = push_allowed and "push" in channels
        send_email = email_allowed and "email" in channels
        save_db = "db" in channels

        sent_via = []
        sent_at = None

        if send_push:
            push_service = PushService()
            if push_service.send_push(profile.fcm_token, title, message, data):
                sent_via.append("push")
                sent_at = sent_at or datetime.utcnow()

        if send_email:
            email_service = EmailService()
            html = NotificationService._build_email_html(title, message, data)
            if email_service.send_email(user.email, title, html):
                sent_via.append("email")
                sent_at = sent_at or datetime.utcnow()

        notification = None
        if save_db:
            notification = Notification(
                user_id=user_id,
                title=title,
                message=message,
                notification_type=notification_type,
                data=data or {},
                sent_via="both" if len(sent_via) == 2 else (sent_via[0] if sent_via else "none"),
                sent_at=sent_at,
            )
            db.session.add(notification)
            db.session.commit()

        current_app.logger.info(
            f"Notification dispatched to user {user_id} via {sent_via or 'none'} (type={notification_type})"
        )
        return notification

    @staticmethod
    def _build_email_html(title: str, message: str, data: Optional[Dict]) -> str:
        """Minimal HTML template for emails."""
        extra = ""
        if data:
            items = "".join(f"<li><strong>{k}:</strong> {v}</li>" for k, v in data.items())
            extra = f"<ul>{items}</ul>"
        return f"""
            <div style="font-family: Arial, sans-serif; line-height:1.5; color:#111827;">
                <h2 style="color:#111827;">{title}</h2>
                <p>{message}</p>
                {extra}
                <p style="color:#6b7280; font-size:12px; margin-top:24px;">
                    Este mensaje fue enviado por UniFinanzas.
                </p>
            </div>
        """
