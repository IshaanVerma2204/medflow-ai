from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.services.storage import storage_service
from app.api import auth, patients, documents, ai, audit
import logging

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="MedFlow AI API", version="1.0.0")

import os

CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://medflow-ai-xcjl.vercel.app",
    "https://medflow-ai.vercel.app",
]

# Also allow any additional origins from environment variable
extra = os.getenv("CORS_ORIGINS", "")
if extra:
    CORS_ORIGINS += [o.strip() for o in extra.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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

@app.get("/")
def read_root():
    return {"status": "ok", "message": "MedFlow AI API is running"}

@app.get("/api/health")
def health_check():
    return {"status": "ok", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
