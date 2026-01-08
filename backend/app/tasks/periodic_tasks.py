"""
Periodic tasks - Scheduled background jobs (APScheduler)
"""
import logging
from datetime import datetime, date, timedelta
from zoneinfo import ZoneInfo

from app.extensions import task_queue, db
from app.models.user import User, UserProfile
from app.models.notification import Notification
from app.models.budget import Budget
from app.models.payment import Payment
from app.services.budget_service import BudgetService
from app.tasks.notification_tasks import send_notification_task

logger = logging.getLogger(__name__)

def _pref_enabled(prefs, key, default=False):
    value = prefs.get(key, default)
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"true", "1", "yes", "y", "on"}
    return bool(value)


@task_queue.task(name='app.tasks.periodic_tasks.send_weekly_summary')
def send_weekly_summary():
    """
    Envía resumen semanal a todos los usuarios que lo tengan habilitado.

    Se ejecuta: Domingos a las 20:00 (configurado en task_scheduler.py)
    """
    logger.info("Starting weekly summary task")

    try:
        # Obtener usuarios con resumen semanal habilitado
        profiles = UserProfile.query.join(User).filter(
            User.is_active == True
        ).all()

        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)

        sent_count = 0

        for profile in profiles:
            try:
                prefs = profile.notification_preferences or {}
                if not _pref_enabled(prefs, "weekly_summary", True):
                    continue

                # Obtener datos del resumen
                total_spent = BudgetService.get_period_expenses(
                    profile.user_id,
                    week_start,
                    week_end
                )

                by_category = BudgetService.get_expenses_by_category(
                    profile.user_id,
                    week_start,
                    week_end
                )

                budget = BudgetService.get_current_budget(profile.user_id)
                budget_amount = float(budget.total_amount) if budget else 0

                # Construir mensaje
                title = f"Resumen Semanal - {week_start.strftime('%d/%m')} a {week_end.strftime('%d/%m')}"

                if budget:
                    percentage = (float(total_spent) / budget_amount * 100) if budget_amount > 0 else 0
                    message = f"Gastaste ${float(total_spent):,.2f} de ${budget_amount:,.2f} ({percentage:.1f}%)"
                else:
                    message = f"Gastaste ${float(total_spent):,.2f} esta semana"

                # Top 3 categorías
                top_categories = sorted(by_category, key=lambda x: x['total'], reverse=True)[:3]

                data = {
                    'total_spent': float(total_spent),
                    'budget': budget_amount,
                    'week_start': week_start.isoformat(),
                    'week_end': week_end.isoformat(),
                    'top_categories': [
                        f"{cat['icon']} {cat['name']}: ${cat['total']:,.2f}"
                        for cat in top_categories
                    ]
                }

                # Enviar notificación asíncrona
                send_notification_task.delay(
                    user_id=profile.user_id,
                    title=title,
                    message=message,
                    notification_type='weekly_summary',
                    data=data,
                    channels=['push', 'email', 'db']
                )

                sent_count += 1

            except Exception as user_exc:
                logger.exception(f"Error sending weekly summary to user {profile.user_id}: {user_exc}")
                continue

        logger.info(f"Weekly summary task completed. Sent to {sent_count} users")
        return {'status': 'success', 'sent_count': sent_count}

    except Exception as exc:
        logger.exception(f"Error in weekly summary task: {exc}")
        return {'status': 'error', 'message': str(exc)}


@task_queue.task(name='app.tasks.periodic_tasks.send_daily_reminders')
def send_daily_reminders():
    """
    Envía recordatorios diarios a usuarios que lo tengan habilitado.

    Se ejecuta: Cada minuto (configurado en task_scheduler.py)
    Filtra por hora/minuto según preferencia de cada usuario.
    """
    logger.info("Starting daily reminders task")

    try:
        timezone_name = "UTC"
        try:
            from flask import current_app
            timezone_name = current_app.config.get("TASK_QUEUE_TIMEZONE", "UTC")
        except Exception:
            timezone_name = "UTC"

        # Obtener usuarios con recordatorios habilitados
        profiles = UserProfile.query.join(User).filter(
            User.is_active == True
        ).all()

        sent_count = 0

        for profile in profiles:
            try:
                prefs = profile.notification_preferences or {}
                if not _pref_enabled(prefs, "daily_reminder", False):
                    continue

                user_now = datetime.now(ZoneInfo(timezone_name))

                reminder_time = prefs.get('reminder_time', '20:00')
                try:
                    reminder_parts = reminder_time.split(":")
                    reminder_hour = int(reminder_parts[0])
                    reminder_minute = int(reminder_parts[1]) if len(reminder_parts) > 1 else 0
                except (ValueError, TypeError):
                    reminder_hour, reminder_minute = 20, 0

                if (user_now.hour, user_now.minute) < (reminder_hour, reminder_minute):
                    continue

                day_start = user_now.replace(hour=0, minute=0, second=0, microsecond=0)
                day_start_utc = day_start.astimezone(ZoneInfo("UTC")).replace(tzinfo=None)
                day_end_utc = (day_start + timedelta(days=1)).astimezone(ZoneInfo("UTC")).replace(tzinfo=None)

                already_sent = Notification.query.filter(
                    Notification.user_id == profile.user_id,
                    Notification.created_at >= day_start_utc,
                    Notification.created_at < day_end_utc,
                    Notification.title == "Recordatorio Diario"
                ).first()

                if already_sent:
                    continue

                # Obtener gasto del día
                today = user_now.date()
                daily_spent = BudgetService.get_period_expenses(profile.user_id, today, today)

                title = "Recordatorio Diario"
                message = f"Hoy has gastado ${float(daily_spent):,.2f}. ¿Registraste todos tus gastos?"

                send_notification_task.delay(
                    user_id=profile.user_id,
                    title=title,
                    message=message,
                    notification_type='daily_reminder',
                    data={'daily_spent': float(daily_spent)},
                    channels=['push', 'email', 'db']
                )

                sent_count += 1

            except Exception as user_exc:
                logger.exception(f"Error sending reminder to user {profile.user_id}: {user_exc}")
                continue

        logger.info(f"Daily reminders task completed. Sent to {sent_count} users")
        return {'status': 'success', 'sent_count': sent_count}

    except Exception as exc:
        logger.exception(f"Error in daily reminders task: {exc}")
        return {'status': 'error', 'message': str(exc)}


@task_queue.task(name='app.tasks.periodic_tasks.check_all_budgets')
def check_all_budgets():
    """
    Verifica umbrales de presupuesto para todos los usuarios activos.

    Se ejecuta: Cada 30 minutos (configurado en task_scheduler.py)
    Envía alertas si alguien superó umbrales desde la última verificación.
    """
    logger.info("Starting budget check task")

    try:
        # Obtener presupuestos activos
        budgets = Budget.query.filter_by(is_active=True).all()

        alerts_sent = 0

        for budget in budgets:
            try:
                profile = UserProfile.query.filter_by(user_id=budget.user_id).first()
                if not profile:
                    continue

                prefs = profile.notification_preferences
                if not prefs.get('threshold_alerts', True):
                    continue

                # Calcular indicador de riesgo
                risk_indicator = BudgetService.get_risk_indicator(budget.user_id)

                if not risk_indicator or risk_indicator['level'] in ['grey', 'green']:
                    continue

                # Verificar si ya enviamos alerta reciente (últimas 6 horas)
                recent_alert = Notification.query.filter(
                    Notification.user_id == budget.user_id,
                    Notification.notification_type == 'threshold_alert',
                    Notification.created_at >= datetime.utcnow() - timedelta(hours=6)
                ).first()

                if recent_alert:
                    continue  # Ya enviamos alerta reciente

                # Enviar alerta
                level = risk_indicator['level']
                percentage = risk_indicator['percentage']

                if level == 'yellow':
                    title = "Advertencia de Presupuesto"
                    message = f"Has alcanzado el {percentage:.1f}% de tu presupuesto."
                else:  # red
                    title = "Alerta Crítica de Presupuesto"
                    message = f"Has superado el {percentage:.1f}% de tu presupuesto. ¡Atención requerida!"

                send_notification_task.delay(
                    user_id=budget.user_id,
                    title=title,
                    message=message,
                    notification_type='threshold_alert',
                    data=risk_indicator,
                    channels=['push', 'email', 'db']
                )

                alerts_sent += 1

            except Exception as budget_exc:
                logger.exception(f"Error checking budget {budget.id}: {budget_exc}")
                continue

        logger.info(f"Budget check task completed. Alerts sent: {alerts_sent}")
        return {'status': 'success', 'alerts_sent': alerts_sent}

    except Exception as exc:
        logger.exception(f"Error in budget check task: {exc}")
        return {'status': 'error', 'message': str(exc)}


@task_queue.task(name='app.tasks.periodic_tasks.cleanup_old_notifications')
def cleanup_old_notifications():
    """
    Limpia notificaciones antiguas leídas (más de 30 días).

    Se ejecuta: Diariamente a las 3 AM (configurado en task_scheduler.py)
    """
    logger.info("Starting notification cleanup task")

    try:
        cutoff_date = datetime.utcnow() - timedelta(days=30)

        # Eliminar notificaciones leídas antiguas
        deleted_count = Notification.query.filter(
            Notification.is_read == True,
            Notification.created_at < cutoff_date
        ).delete()

        db.session.commit()

        logger.info(f"Notification cleanup completed. Deleted {deleted_count} old notifications")
        return {'status': 'success', 'deleted_count': deleted_count}

    except Exception as exc:
        logger.exception(f"Error in cleanup task: {exc}")
        db.session.rollback()
        return {'status': 'error', 'message': str(exc)}


@task_queue.task(name='app.tasks.periodic_tasks.send_payment_reminders')
def send_payment_reminders():
    """
    Envia recordatorios de pagos (7 dias, 3 dias y el mismo dia).

    Se ejecuta: Cada minuto (configurado en task_scheduler.py)
    Filtra por hora/minuto según preferencia de cada usuario.
    """
    logger.info("Starting payment reminders task")

    try:
        timezone_name = "UTC"
        try:
            from flask import current_app
            timezone_name = current_app.config.get("TASK_QUEUE_TIMEZONE", "UTC")
        except Exception:
            timezone_name = "UTC"

        today = date.today()
        reminder_plan = [
            (7, "reminder_7_sent"),
            (3, "reminder_3_sent"),
            (0, "reminder_0_sent"),
        ]

        sent_count = 0
        user_now = datetime.now(ZoneInfo(timezone_name))

        for days_before, flag_name in reminder_plan:
            target_date = today + timedelta(days=days_before)
            payments = Payment.query.filter(
                Payment.is_paid == False,
                Payment.due_date == target_date
            ).all()

            for payment in payments:
                if getattr(payment, flag_name):
                    continue

                # Verificar preferencias del usuario
                profile = UserProfile.query.filter_by(user_id=payment.user_id).first()
                if not profile:
                    continue

                prefs = profile.notification_preferences or {}

                # Verificar si las notificaciones de pagos están habilitadas
                if not _pref_enabled(prefs, "payment_reminders", True):
                    continue

                # Verificar hora configurada
                payment_reminder_time = prefs.get('payment_reminder_time', '18:00')
                try:
                    reminder_parts = payment_reminder_time.split(":")
                    reminder_hour = int(reminder_parts[0])
                    reminder_minute = int(reminder_parts[1]) if len(reminder_parts) > 1 else 0
                except (ValueError, TypeError):
                    reminder_hour, reminder_minute = 18, 0

                # Solo enviar a la hora configurada
                if (user_now.hour, user_now.minute) != (reminder_hour, reminder_minute):
                    continue

                title = "Recordatorio de pago"
                if days_before > 0:
                    message = (
                        f"Tu pago '{payment.name}' vence en {days_before} dias "
                        f"({payment.due_date.isoformat()})."
                    )
                else:
                    message = (
                        f"Tu pago '{payment.name}' vence hoy "
                        f"({payment.due_date.isoformat()})."
                    )

                # Determinar canales según preferencias
                channels = ["db"]
                if _pref_enabled(prefs, "push_enabled", True):
                    channels.append("push")
                if _pref_enabled(prefs, "email_enabled", True):
                    channels.append("email")

                send_notification_task.delay(
                    user_id=payment.user_id,
                    title=title,
                    message=message,
                    notification_type="payment_reminder",
                    data={
                        "payment_id": payment.id,
                        "payment_name": payment.name,
                        "amount": float(payment.amount),
                        "due_date": payment.due_date.isoformat(),
                        "days_before": days_before,
                    },
                    channels=channels
                )

                setattr(payment, flag_name, True)
                sent_count += 1

        db.session.commit()
        logger.info(f"Payment reminders task completed. Sent: {sent_count}")
        return {"status": "success", "sent_count": sent_count}

    except Exception as exc:
        logger.exception(f"Error in payment reminders task: {exc}")
        db.session.rollback()
        return {"status": "error", "message": str(exc)}
