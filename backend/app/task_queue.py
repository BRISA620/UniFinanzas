import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from enum import Enum
from typing import Any, Callable, Dict, Optional


class TaskState(str, Enum):
    PENDING = "PENDING"
    STARTED = "STARTED"
    SUCCESS = "SUCCESS"
    FAILURE = "FAILURE"
    RETRY = "RETRY"
    REVOKED = "REVOKED"


class RetryTask(Exception):
    def __init__(self, exc: Optional[Exception] = None, countdown: Optional[int] = None):
        super().__init__(str(exc) if exc else "Retry requested")
        self.exc = exc
        self.countdown = countdown


@dataclass
class TaskMeta:
    name: Optional[str] = None
    bind: bool = False
    max_retries: int = 0
    default_retry_delay: int = 0


@dataclass
class TaskRecord:
    id: str
    name: str
    state: TaskState
    result: Any = None
    info: Any = None
    retries: int = 0
    max_retries: int = 0
    future: Any = None
    cancel_requested: bool = False
    created_at: float = 0.0
    updated_at: float = 0.0


class TaskRequest:
    def __init__(self, retries: int):
        self.retries = retries


class TaskContext:
    def __init__(self, task_id: str, max_retries: int, default_retry_delay: int, retries: int):
        self.id = task_id
        self.max_retries = max_retries
        self.default_retry_delay = default_retry_delay
        self.request = TaskRequest(retries)

    def retry(self, exc: Optional[Exception] = None, countdown: Optional[int] = None):
        if self.request.retries >= self.max_retries:
            return exc or Exception("Max retries exceeded")
        delay = self.default_retry_delay if countdown is None else countdown
        return RetryTask(exc=exc, countdown=delay)


class LocalAsyncResult:
    def __init__(self, task_id: str, queue: "TaskQueue"):
        self.id = task_id
        self._queue = queue

    @property
    def state(self) -> str:
        record = self._queue._get_record(self.id)
        return record.state.value if record else TaskState.PENDING.value

    @property
    def result(self):
        record = self._queue._get_record(self.id)
        return record.result if record else None

    @property
    def info(self):
        record = self._queue._get_record(self.id)
        return record.info if record else None

    def revoke(self, terminate: bool = False):
        self._queue.revoke(self.id)


class TaskQueue:
    def __init__(self, max_workers: int = 4):
        self._executor = ThreadPoolExecutor(max_workers=max_workers)
        self._tasks: Dict[str, TaskRecord] = {}
        self._lock = threading.Lock()
        self._app = None

    def init_app(self, app):
        self._app = app
        max_workers = app.config.get("TASK_QUEUE_MAX_WORKERS")
        if isinstance(max_workers, int) and max_workers > 0:
            self._executor.shutdown(wait=False)
            self._executor = ThreadPoolExecutor(max_workers=max_workers)

    def task(self, *dargs, **dkwargs):
        def decorator(func: Callable):
            meta = TaskMeta(
                name=dkwargs.get("name"),
                bind=dkwargs.get("bind", False),
                max_retries=dkwargs.get("max_retries", 0),
                default_retry_delay=dkwargs.get("default_retry_delay", 0),
            )

            def delay(*args, **kwargs):
                return self.enqueue(func, meta, args, kwargs)

            func.delay = delay
            func.apply_async = delay
            func._task_meta = meta
            return func

        if dargs and callable(dargs[0]):
            return decorator(dargs[0])
        return decorator

    def enqueue(self, func: Callable, meta: TaskMeta, args, kwargs) -> LocalAsyncResult:
        task_id = str(uuid.uuid4())
        name = meta.name or getattr(func, "__name__", "task")
        now = time.time()
        record = TaskRecord(
            id=task_id,
            name=name,
            state=TaskState.PENDING,
            retries=0,
            max_retries=meta.max_retries,
            created_at=now,
            updated_at=now,
        )
        with self._lock:
            self._tasks[task_id] = record
        self._submit(task_id, func, meta, args, kwargs, retries=0)
        return LocalAsyncResult(task_id, self)

    def AsyncResult(self, task_id: str) -> LocalAsyncResult:
        return LocalAsyncResult(task_id, self)

    def revoke(self, task_id: str):
        record = self._get_record(task_id)
        if not record:
            return
        with self._lock:
            record.cancel_requested = True
            if record.future and record.future.cancel():
                record.state = TaskState.REVOKED
                record.info = "Task cancelled before execution"
                record.updated_at = time.time()

    def _get_record(self, task_id: str) -> Optional[TaskRecord]:
        with self._lock:
            return self._tasks.get(task_id)

    def _submit(self, task_id: str, func: Callable, meta: TaskMeta, args, kwargs, retries: int):
        def runner():
            record = self._get_record(task_id)
            if not record:
                return
            if record.cancel_requested:
                record.state = TaskState.REVOKED
                record.info = "Task cancelled"
                record.updated_at = time.time()
                return

            record.state = TaskState.STARTED
            record.updated_at = time.time()

            def execute():
                if meta.bind:
                    context = TaskContext(
                        task_id=task_id,
                        max_retries=meta.max_retries,
                        default_retry_delay=meta.default_retry_delay,
                        retries=retries,
                    )
                    return func(context, *args, **kwargs)
                return func(*args, **kwargs)

            try:
                if self._app:
                    with self._app.app_context():
                        result = execute()
                else:
                    result = execute()

                record.result = result
                if record.cancel_requested:
                    record.state = TaskState.REVOKED
                    record.info = "Task cancelled"
                else:
                    record.state = TaskState.SUCCESS
                record.updated_at = time.time()
            except RetryTask as retry_exc:
                if record.cancel_requested:
                    record.state = TaskState.REVOKED
                    record.info = "Task cancelled"
                    record.updated_at = time.time()
                    return
                next_retry = retries + 1
                record.retries = next_retry
                record.state = TaskState.RETRY
                record.info = str(retry_exc.exc) if retry_exc.exc else "Retry scheduled"
                record.updated_at = time.time()

                if next_retry > meta.max_retries:
                    record.state = TaskState.FAILURE
                    record.info = str(retry_exc.exc) if retry_exc.exc else "Max retries exceeded"
                    record.updated_at = time.time()
                    return

                delay = retry_exc.countdown if retry_exc.countdown is not None else meta.default_retry_delay
                threading.Timer(
                    delay,
                    lambda: self._submit(task_id, func, meta, args, kwargs, retries=next_retry)
                ).start()
            except Exception as exc:
                record.state = TaskState.FAILURE
                record.info = str(exc)
                record.updated_at = time.time()

        future = self._executor.submit(runner)
        record = self._get_record(task_id)
        if record:
            record.future = future
