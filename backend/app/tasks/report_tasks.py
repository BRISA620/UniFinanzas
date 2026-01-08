"""
Report generation tasks - Asynchronous PDF/CSV generation
"""
import logging
from datetime import date

from app.extensions import task_queue
from app.services.report_service import ReportService
from app.tasks.email_tasks import send_email_task

logger = logging.getLogger(__name__)


@task_queue.task(
    bind=True,
    name='app.tasks.report_tasks.generate_pdf_report_task',
    max_retries=2,
    time_limit=120,  # 2 minutos max para PDFs
    soft_time_limit=100
)
def generate_pdf_report_task(
    self,
    user_id: str,
    report_type: str,
    start_date_str: str,
    end_date_str: str,
    send_email: bool = False,
    user_email: str = None
):
    """
    Genera un reporte PDF de forma asincrona.

    Args:
        user_id: ID del usuario
        report_type: 'weekly' o 'monthly'
        start_date_str: Fecha inicio (ISO format)
        end_date_str: Fecha fin (ISO format)
        send_email: Si debe enviar el PDF por email
        user_email: Email del usuario (requerido si send_email=True)

    Returns:
        dict: Informacion del PDF generado
    """
    try:
        start_date = date.fromisoformat(start_date_str)
        end_date = date.fromisoformat(end_date_str)

        logger.info(f"Generating PDF report for user {user_id}: {report_type} ({start_date} - {end_date})")

        pdf_buffer = ReportService.generate_pdf_report(
            user_id=user_id,
            report_type=report_type,
            start_date=start_date,
            end_date=end_date
        )

        filename = f"reports/{user_id}/reporte_{report_type}_{start_date_str}_{end_date_str}.pdf"

        if send_email and user_email:
            html_content = f"""
            <div style="font-family: Arial, sans-serif;">
                <h2>Tu reporte {report_type} esta listo</h2>
                <p>Periodo: {start_date} - {end_date}</p>
                <p>El reporte PDF ha sido generado exitosamente.</p>
                <p>Descargalo desde la aplicacion UniFinanzas.</p>
            </div>
            """

            send_email_task.delay(
                to_email=user_email,
                subject=f"Reporte {report_type.title()} de UniFinanzas",
                html_content=html_content
            )

        logger.info(f"PDF report generated successfully for user {user_id}")

        return {
            'status': 'success',
            'filename': filename,
            'size': len(pdf_buffer.getvalue()),
            'email_sent': send_email
        }

    except Exception as exc:
        logger.exception(f"Error generating PDF report for user {user_id}: {exc}")
        raise self.retry(exc=exc, countdown=30)
