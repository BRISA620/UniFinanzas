# Task Queue Guide (Local)

UniFinanzas uses an in-process task queue for background jobs. It runs
inside the Flask app process and does not require Redis or Celery.

## How it works
- Tasks use `task_queue.task` and are executed in a thread pool.
- `delay()` enqueues work and returns a task id.
- Task status is available via the `/api/v1/tasks/<task_id>` endpoint.

## Scheduler (optional)
Periodic tasks are handled by APScheduler. To enable it:

1) Set this in `backend/.env`:
```
TASK_QUEUE_SCHEDULER_ENABLED=true
```

2) Start the backend:
```
python -m flask run
```

## Notes
- Task results are stored in memory (not persistent).
- Cancelling a running task is best-effort.
