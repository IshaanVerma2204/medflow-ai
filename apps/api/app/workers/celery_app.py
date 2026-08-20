from celery import Celery
from app.config import settings

celery_app = Celery(
    "medflow",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.workers.tasks"]
)

celery_app.conf.task_routes = {
    "app.workers.tasks.*": "main-queue"
}
