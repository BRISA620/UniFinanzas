import json
import logging
import urllib.error
import urllib.request
from typing import Optional

from flask import current_app


class EmailService:
    """Wrapper around Brevo SMTP API to send transactional emails."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        api_url: Optional[str] = None,
    ):
        self.api_key = api_key or current_app.config.get("BREVO_API_KEY")
        self.from_email = from_email or current_app.config.get("BREVO_FROM_EMAIL", "noreply@unifinanzas.com")
        self.from_name = from_name or current_app.config.get("BREVO_FROM_NAME", "UniFinanzas")
        self.api_url = api_url or current_app.config.get("BREVO_API_URL", "https://api.brevo.com/v3/smtp/email")

    def send_email(self, to_email: str, subject: str, html_content: str, text_content: Optional[str] = None) -> bool:
        """Send a basic email through Brevo. Returns True on success, False otherwise."""
        if not self.api_key:
            current_app.logger.warning("Brevo API key not configured; skipping email send")
            return False

        payload = {
            "sender": {
                "email": self.from_email,
                "name": self.from_name,
            },
            "to": [
                {"email": to_email}
            ],
            "subject": subject,
            "htmlContent": html_content,
            "textContent": text_content or html_content,
        }

        data = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            self.api_url,
            data=data,
            method="POST",
            headers={
                "api-key": self.api_key,
                "content-type": "application/json",
                "accept": "application/json",
            },
        )

        try:
            with urllib.request.urlopen(request, timeout=10) as response:
                return 200 <= response.status < 300
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="ignore")
            logging.error(f"Brevo returned status {exc.code}: {body}")
            return False
        except Exception as exc:
            logging.exception(f"Error sending email to {to_email}: {exc}")
            return False
