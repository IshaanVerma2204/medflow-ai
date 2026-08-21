"""
MedFlow AI — AI API Routes
Handles chat, document analysis trigger, flags, and agent run status.
"""
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
import tempfile
import os

from app.config import settings
from app.database import get_db
from app.models.user import User, UserRole
from app.models.ai import AIFlag, AgentRun, AgentMessage, AuditLog
from app.models.document import Document
from app.models.patient import PatientProfile
from app.schemas.ai import AIFlagResponse, ApprovalRequest
from app.security.auth import get_current_active_user, require_role
from app.security.rbac import require_patient_access

router = APIRouter(prefix="/ai", tags=["ai"])


# ─── Request / Response Models ────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    patient_id: str
    conversation_history: Optional[List[dict]] = None


class ChatResponse(BaseModel):
    response: str
    sources: List[dict] = []
    disclaimer: str
    retrieved_chunks: int = 0
    is_mock: bool = False


class AnalyzeDocumentRequest(BaseModel):
    document_id: str
    patient_id: str


class AgentRunResponse(BaseModel):
    id: str
    workflow_type: str
    status: str
    started_at: str
    completed_at: Optional[str] = None
    messages: List[dict] = []


# ─── Chat (RAG) ───────────────────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
def chat_with_rag(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """AI chat with RAG — retrieves patient documents and generates grounded response."""
    from app.agents.rag_agent import rag_agent

    # Authorization check
    require_patient_access(uuid.UUID(req.patient_id), current_user, db)

    result = rag_agent.chat(
        patient_id=req.patient_id,
        query=req.message,
        db=db,
        conversation_history=req.conversation_history,
    )

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        patient_id=uuid.UUID(req.patient_id),
        agent="RAGAgent",
        action="chat_query",
        input_summary=req.message[:200],
        output_summary=result.get("response", "")[:200],
        tool_used="retrieve_relevant_chunks",
        retrieved_sources=result.get("sources", []),
        human_decision="not_required",
    )
    db.add(audit)
    db.commit()

    return ChatResponse(
        response=result.get("response", ""),
        sources=result.get("sources", []),
        disclaimer=result.get("disclaimer", ""),
        retrieved_chunks=result.get("retrieved_chunks", 0),
        is_mock=result.get("is_mock", False),
    )


# ─── Speech Transcription (Whisper) ───────────────────────────────────────────

@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
):
    """High-accuracy medical speech-to-text using OpenAI Whisper."""
    if settings.is_mock_ai:
        return {"text": "What are my current medications? (Note: Add OpenAI API Key for real transcription)"}
        
    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Whisper requires a file-like object with a name, so we save the upload temp
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name
            
        with open(temp_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                prompt="medical terminology, amoxicillin, hba1c, metformin, diagnosis, follow-up"
            )
            
        os.remove(temp_path)
        return {"text": transcription.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── Document Analysis Trigger ────────────────────────────────────────────────

@router.post("/analyze-document")
def trigger_document_analysis(
    req: AnalyzeDocumentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Trigger the full AI analysis workflow for a document."""
    require_patient_access(uuid.UUID(req.patient_id), current_user, db)

    doc = db.query(Document).filter(Document.id == uuid.UUID(req.document_id)).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if str(doc.patient_id) != req.patient_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Create an AgentRun to track the workflow
    run = AgentRun(
        patient_id=uuid.UUID(req.patient_id),
        document_id=uuid.UUID(req.document_id),
        triggered_by=current_user.id,
        workflow_type="document_processing",
        status="received",
        started_at=datetime.utcnow(),
        input_data={"document_id": req.document_id, "patient_id": req.patient_id},
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    run_id = str(run.id)

    # If document hasn't been text-extracted yet, do it synchronously first (for demo)
    if not doc.pages:
        from app.services.storage import storage_service
        from app.services.document_processor import document_processor
        from app.models.document import DocumentPage, DocumentStatus, DocumentType

        try:
            doc.status = DocumentStatus.PROCESSING
            db.commit()
            file_data = storage_service.download_file(doc.storage_key)
            if doc.document_type == DocumentType.PDF:
                pages = document_processor.extract_text_from_pdf(file_data)
            elif doc.document_type == DocumentType.DOCX:
                pages = document_processor.extract_text_from_docx(file_data)
            elif doc.document_type == DocumentType.TXT:
                pages = document_processor.extract_text_from_txt(file_data)
            else:
                pages = document_processor.extract_text_from_image(file_data)

            for page_data in pages:
                db.add(DocumentPage(
                    document_id=doc.id,
                    page_number=page_data["page_number"],
                    content=page_data["content"],
                ))
            doc.page_count = len(pages)
            db.commit()
        except Exception as e:
            doc.status = DocumentStatus.FAILED
            doc.processing_error = str(e)
            db.commit()

    # Dispatch to Celery or run inline (fallback for no-worker environments)
    try:
        from app.workers.tasks import analyze_document_task
        analyze_document_task.delay(req.document_id, run_id)
        async_mode = True
    except Exception:
        # Run inline if Celery not available (e.g., dev without Redis)
        from app.agents.orchestrator import process_document_workflow
        process_document_workflow(req.document_id, run_id)
        async_mode = False

    return {
        "run_id": run_id,
        "status": "received",
        "async": async_mode,
        "message": "Document analysis started. Check run status for progress.",
    }


# ─── AI Flags ─────────────────────────────────────────────────────────────────

@router.get("/flags", response_model=List[AIFlagResponse])
def get_flags(
    patient_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get AI flags. Patients see only their own; clinicians/admins see assigned patients."""
    q = db.query(AIFlag)

    if current_user.role == UserRole.PATIENT:
        # Patients can only see their own flags
        profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
        if not profile:
            return []
        q = q.filter(AIFlag.patient_id == profile.id)
    elif patient_id:
        require_patient_access(uuid.UUID(patient_id), current_user, db)
        q = q.filter(AIFlag.patient_id == uuid.UUID(patient_id))

    if status:
        q = q.filter(AIFlag.status == status)

    return q.order_by(AIFlag.created_at.desc()).all()


@router.post("/flags/{flag_id}/approve", response_model=AIFlagResponse)
def approve_flag(
    flag_id: uuid.UUID,
    req: ApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.CLINICIAN, UserRole.ADMIN)),
):
    """Approve an AI flag after clinician review."""
    flag = db.query(AIFlag).filter(AIFlag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")

    flag.status = "approved"
    flag.review_notes = req.notes
    flag.reviewed_by = current_user.id
    flag.reviewed_at = datetime.utcnow()

    audit = AuditLog(
        user_id=current_user.id,
        patient_id=flag.patient_id,
        agent=flag.agent_name,
        action="flag_approved",
        resource_type="ai_flag",
        resource_id=flag.id,
        confidence=flag.confidence,
        human_decision="approved",
        final_action=req.notes,
    )
    db.add(audit)
    db.commit()
    db.refresh(flag)
    return flag


@router.post("/flags/{flag_id}/reject", response_model=AIFlagResponse)
def reject_flag(
    flag_id: uuid.UUID,
    req: ApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.CLINICIAN, UserRole.ADMIN)),
):
    """Reject an AI flag after clinician review."""
    flag = db.query(AIFlag).filter(AIFlag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")

    flag.status = "rejected"
    flag.review_notes = req.notes
    flag.reviewed_by = current_user.id
    flag.reviewed_at = datetime.utcnow()

    audit = AuditLog(
        user_id=current_user.id,
        patient_id=flag.patient_id,
        agent=flag.agent_name,
        action="flag_rejected",
        resource_type="ai_flag",
        resource_id=flag.id,
        confidence=flag.confidence,
        human_decision="rejected",
        final_action=req.notes,
    )
    db.add(audit)
    db.commit()
    db.refresh(flag)
    return flag


@router.post("/flags/{flag_id}/request-review", response_model=AIFlagResponse)
def request_review(
    flag_id: uuid.UUID,
    req: ApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Request additional review for an AI flag."""
    flag = db.query(AIFlag).filter(AIFlag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")
    flag.status = "review_requested"
    flag.review_notes = req.notes
    db.commit()
    db.refresh(flag)
    return flag


# ─── Agent Runs ───────────────────────────────────────────────────────────────

@router.get("/agent-runs")
def list_runs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List agent runs for current user's patients."""
    if current_user.role == UserRole.PATIENT:
        profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
        if not profile:
            return []
        runs = db.query(AgentRun).filter(AgentRun.patient_id == profile.id).order_by(AgentRun.started_at.desc()).all()
    else:
        runs = db.query(AgentRun).order_by(AgentRun.started_at.desc()).limit(50).all()

    return [
        {
            "id": str(r.id),
            "workflow_type": r.workflow_type,
            "status": r.status,
            "started_at": str(r.started_at),
            "completed_at": str(r.completed_at) if r.completed_at else None,
        }
        for r in runs
    ]


@router.get("/agent-runs/{run_id}")
def get_run_status(
    run_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get detailed status of an agent run including all messages."""
    run = db.query(AgentRun).filter(AgentRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    messages = db.query(AgentMessage).filter(AgentMessage.run_id == run_id).order_by(AgentMessage.created_at).all()

    return {
        "id": str(run.id),
        "workflow_type": run.workflow_type,
        "status": run.status,
        "started_at": str(run.started_at),
        "completed_at": str(run.completed_at) if run.completed_at else None,
        "error_message": run.error_message,
        "messages": [
            {
                "agent_name": m.agent_name,
                "message_type": m.message_type,
                "content": m.content,
                "created_at": str(m.created_at),
            }
            for m in messages
        ],
    }


# ─── Summary Generation ───────────────────────────────────────────────────────

class SummaryRequest(BaseModel):
    patient_id: str
    summary_type: str = "clinical"  # "clinical" or "patient"


@router.post("/generate-summary")
def generate_summary(
    req: SummaryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Generate a clinical or patient-friendly summary for a patient."""
    from app.agents.summary_agent import summary_agent
    from app.tools.medical_tools import get_medications, get_diagnoses, get_lab_results

    require_patient_access(uuid.UUID(req.patient_id), current_user, db)

    patient_data = {
        "medications": get_medications(req.patient_id, db),
        "diagnoses": get_diagnoses(req.patient_id, db),
        "lab_results": get_lab_results(req.patient_id, db),
    }

    if req.summary_type == "patient":
        result = summary_agent.generate_patient_summary(patient_data)
    else:
        result = summary_agent.generate_clinical_summary(patient_data)

    audit = AuditLog(
        user_id=current_user.id,
        patient_id=uuid.UUID(req.patient_id),
        agent="SummaryAgent",
        action=f"generate_{req.summary_type}_summary",
        human_decision="not_required",
    )
    db.add(audit)
    db.commit()

    return result
