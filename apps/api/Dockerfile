FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y tesseract-ocr libpq-dev gcc && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --default-timeout=1000 --no-cache-dir -r requirements.txt
COPY . .
CMD sh -c "celery -A app.workers.tasks worker --loglevel=info & uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}"
