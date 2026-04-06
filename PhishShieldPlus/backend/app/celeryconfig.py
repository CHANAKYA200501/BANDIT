import os
from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "phishshield",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.celery.worker"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "poll_urlhaus_every_5_min": {
            "task": "app.celery.worker.poll_urlhaus",
            "schedule": 300.0,
        },
        "poll_openphish_every_10_min": {
            "task": "app.celery.worker.poll_openphish",
            "schedule": 600.0,
        },
        "poll_alienvault_every_15_min": {
            "task": "app.celery.worker.poll_alienvault",
            "schedule": 900.0,
        },
        "refresh_stats_every_30_sec": {
            "task": "app.celery.worker.refresh_stats",
            "schedule": 30.0,
        }
    }
)
