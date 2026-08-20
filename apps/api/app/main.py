from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.services.storage import storage_service
from app.api import auth, patients, documents, ai, audit
import logging

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="MedFlow AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(patients.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(audit.router, prefix="/api")

@app.on_event("startup")
def on_startup():
    init_db()
    try:
        storage_service.ensure_bucket_exists()
    except Exception as e:
        logging.error(f"Failed to create bucket on startup: {e}")

@app.get("/health")
def health_check():
    return {"status": "ok", "version": "1.0.0"}
