import os

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.tasks.periodic_tasks import (
    send_weekly_summary,
    send_daily_reminders,
    check_all_budgets,
    cleanup_old_notifications,
    send_payment_reminders,
)


def start_scheduler(app):
    if not app.config.get("TASK_QUEUE_SCHEDULER_ENABLED", False):
        app.logger.info("Task scheduler disabled")
        return None

    if app.debug and os.environ.get("WERKZEUG_RUN_MAIN") != "true":
        return None

    scheduler = BackgroundScheduler(
        timezone=app.config.get("TASK_QUEUE_TIMEZONE", "UTC")
    )

    scheduler.add_job(
        lambda: send_weekly_summary.delay(),
        CronTrigger(day_of_week="sun", hour=20, minute=0),
        id="send_weekly_summary",
        replace_existing=True,
    )
    scheduler.add_job(
        lambda: send_daily_reminders.delay(),
        CronTrigger(minute="*"),
        id="send_daily_reminders",
        replace_existing=True,
    )
    scheduler.add_job(
        lambda: check_all_budgets.delay(),
        CronTrigger(minute="*/30"),
        id="check_all_budgets",
        replace_existing=True,
    )
    scheduler.add_job(
        lambda: cleanup_old_notifications.delay(),
        CronTrigger(hour=3, minute=0),
        id="cleanup_old_notifications",
        replace_existing=True,
    )
    scheduler.add_job(
        lambda: send_payment_reminders.delay(),
        CronTrigger(minute="*"),
        id="send_payment_reminders",
        replace_existing=True,
    )

    scheduler.start()
    app.logger.info("Task scheduler started")
    return scheduler
