import logging
from typing import Dict, Optional

from flask import current_app
from pyfcm import FCMNotification


class PushService:
    """Wrapper around FCM (pyfcm) to send push notifications."""

    def __init__(self, server_key: Optional[str] = None):
        self.server_key = server_key or current_app.config.get("FCM_SERVER_KEY")
        self.client = FCMNotification(api_key=self.server_key) if self.server_key else None

    def send_push(self, token: str, title: str, body: str, data: Optional[Dict] = None) -> bool:
        """Send a push notification to a single device token."""
        if not self.client:
            current_app.logger.warning("FCM server key not configured; skipping push send")
            return False

        try:
            result = self.client.notify_single_device(
                registration_id=token,
                message_title=title,
                message_body=body,
                data_message=data or {},
                sound="default",
                badge=1,
            )
            if result.get("failure") == 0:
                return True
            logging.error(f"FCM send failure: {result}")
            return False
        except Exception as exc:
            logging.exception(f"Error sending push to token {token}: {exc}")
            return False
