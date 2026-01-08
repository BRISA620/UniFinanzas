"""
Notification tasks - Asynchronous push/email notifications
"""
import logging
from typing import Dict, List, Optional
from datetime import datetime

from app.extensions import task_queue, db
from app.models.notification import Notification
from app.models.user import User, UserProfile
from app.services.email_service import EmailService
from app.services.push_service import PushService

logger = logging.getLogger(__name__)


@task_queue.task(
    bind=True,
    name='app.tasks.notification_tasks.send_push_notification_task',
    max_retries=3,
    default_retry_delay=30
)
def send_push_notification_task(self, token: str, title: str, body: str, data: Optional[Dict] = None):
    """Envía push notification de forma asíncrona"""
    try:
        push_service = PushService()
        success = push_service.send_push(token, title, body, data)

        if success:
            logger.info(f"Push notification sent to token: {token[:10]}...")
            return {'status': 'success'}
        else:
            raise self.retry(exc=Exception("Push notification failed"))

    except Exception as exc:
        logger.exception(f"Error sending push: {exc}")
        raise self.retry(exc=exc, countdown=30 * (2 ** self.request.retries))


@task_queue.task(
    bind=True,
    name='app.tasks.notification_tasks.send_notification_task',
    max_retries=2
)
def send_notification_task(
    self,
    user_id: str,
    title: str,
    message: str,
    notification_type: str = "general",
    data: Optional[Dict] = None,
    channels: Optional[List[str]] = None
):
    """
    Envía notificación completa (DB + push + email) de forma asíncrona.

    Esta es la tarea principal que reemplaza a NotificationService.send_notification()
    para operaciones asíncronas.
    """
    try:
        if channels is None:
            channels = ['push', 'email', 'db']

        user = User.query.filter_by(id=user_id).first()
        if not user:
            logger.error(f"User {user_id} not found")
            return {'status': 'error', 'message': 'User not found'}

        profile = UserProfile.query.filter_by(user_id=user_id).first()
        prefs = profile.notification_preferences if profile else {}

        # Channel gating based on preferences
        push_allowed = prefs.get("push_enabled", True) and profile and profile.fcm_token
        email_allowed = prefs.get("email_enabled", True) and user.email

        if notification_type == "threshold_alert":
            push_allowed = push_allowed and prefs.get("threshold_alerts", True)
            email_allowed = email_allowed and prefs.get("threshold_alerts", True)
        elif notification_type == "weekly_summary":
            push_allowed = push_allowed and prefs.get("weekly_summary", True)
            email_allowed = email_allowed and prefs.get("weekly_summary", True)

        send_push = push_allowed and "push" in channels
        send_email = email_allowed and "email" in channels
        save_db = "db" in channels

        sent_via = []
        sent_at = None

        # Enviar push
        if send_push:
            push_service = PushService()
            if push_service.send_push(profile.fcm_token, title, message, data):
                sent_via.append("push")
                sent_at = sent_at or datetime.utcnow()

        # Enviar email
        if send_email:
            email_service = EmailService()
            html = _build_email_html(title, message, data)
            if email_service.send_email(user.email, title, html):
                sent_via.append("email")
                sent_at = sent_at or datetime.utcnow()

        # Guardar en DB
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

        logger.info(f"Notification sent to user {user_id} via {sent_via}")

        return {
            'status': 'success',
            'sent_via': sent_via,
            'notification_id': notification.id if notification else None
        }

    except Exception as exc:
        logger.exception(f"Error sending notification to user {user_id}: {exc}")
        db.session.rollback()
        raise self.retry(exc=exc)


def _build_email_html(title: str, message: str, data: Optional[Dict]) -> str:
    """Construye HTML para emails de notificaciones con diseño mejorado"""

    # Detectar tipo de notificación y construir contenido específico
    if data and 'payment_name' in data:
        # Template para recordatorios de pago
        return _build_payment_reminder_html(title, message, data)
    elif data and 'percentage' in data and 'spent' in data:
        # Template para alertas de presupuesto
        return _build_budget_alert_html(title, message, data)
    elif data and 'total_spent' in data and 'week_start' in data:
        # Template para resumen semanal
        return _build_weekly_summary_html(title, message, data)
    else:
        # Template genérico por defecto
        return _build_generic_html(title, message, data)


def _build_payment_reminder_html(title: str, message: str, data: Dict) -> str:
    """Template HTML para recordatorios de pagos"""
    payment_name = data.get('payment_name', 'Pago')
    amount = data.get('amount', 0)
    due_date = data.get('due_date', '')
    days_before = data.get('days_before', 0)

    # Formatear fecha
    try:
        from datetime import datetime
        date_obj = datetime.fromisoformat(due_date)
        formatted_date = date_obj.strftime('%d de %B de %Y')
    except:
        formatted_date = due_date

    # Color según urgencia
    if days_before == 0:
        color = '#EF4444'  # Rojo
        urgency = 'VENCE HOY'
    elif days_before <= 3:
        color = '#F59E0B'  # Amarillo
        urgency = f'Vence en {days_before} días'
    else:
        color = '#3B82F6'  # Azul
        urgency = f'Vence en {days_before} días'

    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; max-width: 600px;">

                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, {color} 0%, {color}CC 100%); padding: 32px 40px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">💳 {title}</h1>
                            <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">{urgency}</p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">

                            <!-- Payment Info Card -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Detalles del Pago</p>

                                        <table width="100%" cellpadding="8" cellspacing="0">
                                            <tr>
                                                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                                    <p style="margin: 0; font-size: 13px; color: #6b7280;">Concepto</p>
                                                </td>
                                                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                                                    <p style="margin: 0; font-size: 15px; color: #111827; font-weight: 600;">{payment_name}</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                                    <p style="margin: 0; font-size: 13px; color: #6b7280;">Monto</p>
                                                </td>
                                                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                                                    <p style="margin: 0; font-size: 18px; color: #111827; font-weight: 700;">S/ {amount:.2f}</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <p style="margin: 0; font-size: 13px; color: #6b7280;">Fecha de vencimiento</p>
                                                </td>
                                                <td style="padding: 8px 0; text-align: right;">
                                                    <p style="margin: 0; font-size: 15px; color: #111827; font-weight: 600;">{formatted_date}</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Message -->
                            <p style="margin: 0 0 24px 0; font-size: 15px; color: #374151; line-height: 1.6;">{message}</p>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 8px 0;">
                                        <a href="#" style="display: inline-block; background-color: {color}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">Ver mis Pagos</a>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.5;">
                                Este mensaje fue enviado por <strong>UniFinanzas</strong><br>
                                Tu asistente personal de finanzas
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    """


def _build_budget_alert_html(title: str, message: str, data: Dict) -> str:
    """Template HTML para alertas de presupuesto"""
    percentage = data.get('percentage', 0)
    spent = data.get('spent', 0)
    budget = data.get('budget', 0)
    level = data.get('level', 'yellow')

    # Color según nivel
    if level == 'red':
        color = '#EF4444'
        icon = '🚨'
    elif level == 'yellow':
        color = '#F59E0B'
        icon = '⚠️'
    else:
        color = '#10B981'
        icon = '✅'

    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); max-width: 600px;">
                    <tr>
                        <td style="background: linear-gradient(135deg, {color} 0%, {color}CC 100%); padding: 32px 40px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px;">{icon}</h1>
                            <h2 style="color: #ffffff; margin: 12px 0 0 0; font-size: 24px; font-weight: 700;">{title}</h2>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">{message}</p>

                            <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                                <div style="text-align: center; margin-bottom: 16px;">
                                    <p style="margin: 0; font-size: 48px; font-weight: 700; color: {color};">{percentage:.1f}%</p>
                                    <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">de tu presupuesto utilizado</p>
                                </div>
                                <table width="100%" cellpadding="8" cellspacing="0">
                                    <tr>
                                        <td style="text-align: left;">
                                            <p style="margin: 0; font-size: 13px; color: #6b7280;">Gastado</p>
                                            <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 600; color: #111827;">S/ {spent:.2f}</p>
                                        </td>
                                        <td style="text-align: right;">
                                            <p style="margin: 0; font-size: 13px; color: #6b7280;">Presupuesto</p>
                                            <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 600; color: #111827;">S/ {budget:.2f}</p>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #6b7280;">
                                Este mensaje fue enviado por <strong>UniFinanzas</strong>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    """


def _build_weekly_summary_html(title: str, message: str, data: Dict) -> str:
    """Template HTML para resumen semanal"""
    total_spent = data.get('total_spent', 0)
    budget = data.get('budget', 0)
    top_categories = data.get('top_categories', [])

    categories_html = ""
    for cat in top_categories[:3]:
        categories_html += f'<li style="margin-bottom: 8px; font-size: 14px; color: #374151;">{cat}</li>'

    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); max-width: 600px;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px 40px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px;">📊</h1>
                            <h2 style="color: #ffffff; margin: 12px 0 0 0; font-size: 24px; font-weight: 700;">{title}</h2>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151;">{message}</p>

                            <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                                <h3 style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Top Categorías</h3>
                                <ul style="margin: 0; padding-left: 20px;">
                                    {categories_html}
                                </ul>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #6b7280;">
                                Este mensaje fue enviado por <strong>UniFinanzas</strong>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    """


def _build_generic_html(title: str, message: str, data: Optional[Dict]) -> str:
    """Template HTML genérico para otras notificaciones"""
    extra = ""
    if data:
        items = "".join(f"<li style='margin-bottom: 8px; font-size: 14px; color: #374151;'><strong>{k}:</strong> {v}</li>" for k, v in data.items())
        extra = f"<ul style='margin: 16px 0; padding-left: 20px;'>{items}</ul>"

    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); max-width: 600px;">
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px; font-weight: 700;">{title}</h2>
                            <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">{message}</p>
                            {extra}
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #6b7280;">
                                Este mensaje fue enviado por <strong>UniFinanzas</strong>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    """


@task_queue.task(
    bind=True,
    name='app.tasks.notification_tasks.check_budget_threshold_task',
    max_retries=1
)
def check_budget_threshold_task(self, user_id: str, expense_amount: float):
    """
    Verifica umbrales de presupuesto después de crear un gasto.

    Esta tarea se dispara automáticamente cuando se crea un gasto.
    Calcula el nuevo porcentaje de gasto y envía alertas si se superan umbrales.
    """
    try:
        from app.services.budget_service import BudgetService

        # Obtener indicador de riesgo actualizado
        risk_indicator = BudgetService.get_risk_indicator(user_id)

        if not risk_indicator or risk_indicator['level'] == 'grey':
            # No hay presupuesto activo
            return {'status': 'no_budget'}

        level = risk_indicator['level']
        percentage = risk_indicator['percentage']

        # Enviar alerta si superó umbral amarillo o rojo
        if level in ['yellow', 'red']:
            profile = UserProfile.query.filter_by(user_id=user_id).first()
            prefs = profile.notification_preferences if profile else {}

            # Verificar si las alertas de umbral están habilitadas
            if not prefs.get('threshold_alerts', True):
                return {'status': 'alerts_disabled'}

            if level == 'yellow':
                title = "Advertencia de Presupuesto"
                message = f"Has alcanzado el {percentage:.1f}% de tu presupuesto semanal. Considera reducir gastos."
            else:  # red
                title = "Alerta Crítica de Presupuesto"
                message = f"Has superado el {percentage:.1f}% de tu presupuesto semanal. ¡Atención urgente requerida!"

            # Enviar notificación asíncrona
            send_notification_task.delay(
                user_id=user_id,
                title=title,
                message=message,
                notification_type='threshold_alert',
                data={
                    'percentage': percentage,
                    'spent': risk_indicator['spent'],
                    'budget': risk_indicator['budget'],
                    'level': level
                },
                channels=['push', 'email', 'db']
            )

            logger.info(f"Budget threshold alert sent to user {user_id} (level={level})")
            return {'status': 'alert_sent', 'level': level}

        return {'status': 'ok', 'level': level}

    except Exception as exc:
        logger.exception(f"Error checking budget threshold for user {user_id}: {exc}")
        raise self.retry(exc=exc)
