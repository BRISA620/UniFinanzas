"""
Email tasks - Asynchronous email sending
"""
import logging
from typing import Optional

from app.extensions import task_queue
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)


@task_queue.task(
    bind=True,
    name='app.tasks.email_tasks.send_email_task',
    max_retries=3,
    default_retry_delay=60  # 1 minuto
)
def send_email_task(self, to_email: str, subject: str, html_content: str, text_content: Optional[str] = None):
    """
    Envía un email de forma asíncrona.

    Args:
        to_email: Destinatario
        subject: Asunto del email
        html_content: Contenido HTML
        text_content: Contenido en texto plano (opcional)

    Returns:
        dict: Resultado del envío
    """
    try:
        email_service = EmailService()
        success = email_service.send_email(to_email, subject, html_content, text_content)

        if success:
            logger.info(f"Email sent successfully to {to_email}")
            return {'status': 'success', 'to': to_email}
        else:
            logger.error(f"Email failed to send to {to_email}")
            # Retry automático
            raise self.retry(exc=Exception("Email send failed"))

    except Exception as exc:
        logger.exception(f"Error sending email to {to_email}: {exc}")
        # Retry con backoff exponencial
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
