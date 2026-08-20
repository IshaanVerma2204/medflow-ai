"""
MedFlow AI — Agent Tools
All tools enforce authorization and never return data cross-patient.
"""
from typing import Any, Dict, List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.patient import PatientProfile
from app.models.document import Document, DocumentPage
from app.models.medical import Medication, Diagnosis, LabResult, FollowUpTask
from app.models.timeline import PatientTimelineEvent
from app.models.ai import AIFlag, AgentRun, AgentMessage, ToolCall, AuditLog, Notification
from app.database import SessionLocal
import logging
import time
import uuid

logger = logging.getLogger(__name__)


def _log_tool_call(db: Session, run_id: Optional[str], agent_name: str, tool_name: str,
                   input_data: Dict, output_data: Any = None, error: str = None,
                   duration_ms: int = None) -> None:
    """Persist every tool invocation to the audit trail."""
    if run_id:
        tc = ToolCall(
            run_id=UUID(run_id),
            agent_name=agent_name,
            tool_name=tool_name,
            input_data=input_data,
            output_data=output_data,
            error=error,
            duration_ms=duration_ms,
        )
        db.add(tc)
        db.commit()


# ─── Patient Record Tools ────────────────────────────────────────────────────

def get_patient_profile(patient_id: str, db: Session) -> Dict:
    """Return demographic info for a patient."""
    patient = db.query(PatientProfile).filter(PatientProfile.id == UUID(patient_id)).first()
    if not patient:
        return {"error": "Patient not found"}
    return {
        "id": str(patient.id),
        "user_id": str(patient.user_id),
        "date_of_birth": str(patient.date_of_birth) if patient.date_of_birth else None,
        "gender": patient.gender,
        "blood_type": patient.blood_type,
        "allergies_summary": patient.allergies_summary,
        "health_summary": patient.health_summary,
    }


def get_patient_timeline(patient_id: str, db: Session, limit: int = 50) -> List[Dict]:
    """Return chronological timeline events for a patient."""
    events = (
        db.query(PatientTimelineEvent)
        .filter(PatientTimelineEvent.patient_id == UUID(patient_id))
        .order_by(PatientTimelineEvent.event_date.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": str(e.id),
            "event_date": str(e.event_date),
            "event_type": e.event_type,
            "title": e.title,
            "description": e.description,
            "entity_type": e.entity_type,
            "entity_id": str(e.entity_id) if e.entity_id else None,
            "document_id": str(e.document_id) if e.document_id else None,
        }
        for e in events
    ]


def get_medications(patient_id: str, db: Session, current_only: bool = False) -> List[Dict]:
    """Return medications for a patient."""
    q = db.query(Medication).filter(Medication.patient_id == UUID(patient_id))
    if current_only:
        q = q.filter(Medication.is_current == True)
    meds = q.all()
    return [
        {
            "id": str(m.id),
            "name": m.name,
            "dosage": m.dosage,
            "frequency": m.frequency,
            "route": m.route,
            "status": m.status,
            "is_current": m.is_current,
            "start_date": str(m.start_date) if m.start_date else None,
            "end_date": str(m.end_date) if m.end_date else None,
            "prescriber": m.prescriber,
            "source_text": m.source_text,
            "confidence": m.confidence,
            "document_id": str(m.document_id) if m.document_id else None,
        }
        for m in meds
    ]


def get_lab_results(patient_id: str, db: Session, test_name: Optional[str] = None) -> List[Dict]:
    """Return lab results for a patient."""
    q = db.query(LabResult).filter(LabResult.patient_id == UUID(patient_id))
    if test_name:
        q = q.filter(LabResult.test_name.ilike(f"%{test_name}%"))
    results = q.order_by(LabResult.test_date.desc()).all()
    return [
        {
            "id": str(r.id),
            "test_name": r.test_name,
            "value": r.value,
            "unit": r.unit,
            "reference_range": r.reference_range,
            "is_abnormal": r.is_abnormal,
            "test_date": str(r.test_date) if r.test_date else None,
            "ordering_doctor": r.ordering_doctor,
            "source_text": r.source_text,
            "confidence": r.confidence,
        }
        for r in results
    ]


def get_diagnoses(patient_id: str, db: Session) -> List[Dict]:
    """Return diagnoses for a patient."""
    diagnoses = db.query(Diagnosis).filter(Diagnosis.patient_id == UUID(patient_id)).all()
    return [
        {
            "id": str(d.id),
            "name": d.name,
            "icd_code": d.icd_code,
            "diagnosed_date": str(d.diagnosed_date) if d.diagnosed_date else None,
            "status": d.status,
            "severity": d.severity,
            "diagnosing_doctor": d.diagnosing_doctor,
            "source_text": d.source_text,
            "confidence": d.confidence,
        }
        for d in diagnoses
    ]


def search_patient_records(patient_id: str, query: str, db: Session) -> List[Dict]:
    """Full-text search across patient document pages."""
    pages = (
        db.query(DocumentPage)
        .join(Document, DocumentPage.document_id == Document.id)
        .filter(Document.patient_id == UUID(patient_id))
        .filter(DocumentPage.content.ilike(f"%{query}%"))
        .limit(10)
        .all()
    )
    return [
        {
            "document_id": str(p.document_id),
            "page_number": p.page_number,
            "excerpt": p.content[:500],
        }
        for p in pages
    ]


def retrieve_document(document_id: str, patient_id: str, db: Session) -> Dict:
    """Retrieve a document and its pages, enforcing patient ownership."""
    doc = (
        db.query(Document)
        .filter(Document.id == UUID(document_id))
        .filter(Document.patient_id == UUID(patient_id))
        .first()
    )
    if not doc:
        return {"error": "Document not found or access denied"}
    pages = db.query(DocumentPage).filter(DocumentPage.document_id == doc.id).all()
    return {
        "id": str(doc.id),
        "filename": doc.original_filename,
        "document_type": doc.document_type.value,
        "document_date": str(doc.document_date) if doc.document_date else None,
        "document_title": doc.document_title,
        "pages": [{"page_number": p.page_number, "content": p.content} for p in pages],
    }


# ─── Write / Action Tools ────────────────────────────────────────────────────

def create_followup_task(
    patient_id: str,
    task: str,
    task_type: str,
    priority: str,
    responsible_role: str,
    db: Session,
    due_date: Optional[str] = None,
    source_text: Optional[str] = None,
    document_id: Optional[str] = None,
) -> Dict:
    """Create a follow-up task for a patient."""
    from datetime import date
    ft = FollowUpTask(
        patient_id=UUID(patient_id),
        document_id=UUID(document_id) if document_id else None,
        task=task,
        task_type=task_type,
        due_date=date.fromisoformat(due_date) if due_date else None,
        priority=priority,
        status="pending",
        responsible_role=responsible_role,
        source_text=source_text,
    )
    db.add(ft)

    # Add timeline event
    event = PatientTimelineEvent(
        patient_id=UUID(patient_id),
        event_date=date.today(),
        event_type="follow_up",
        title=f"Follow-up: {task}",
        description=f"Priority: {priority}",
        entity_type="follow_up_task",
        entity_id=ft.id,
        document_id=UUID(document_id) if document_id else None,
        source="AI Agent",
    )
    db.add(event)
    db.commit()
    return {"id": str(ft.id), "task": task, "status": "created"}


def flag_for_clinician_review(
    patient_id: str,
    agent_name: str,
    flag_type: str,
    title: str,
    description: str,
    evidence: List[Dict],
    severity: str,
    confidence: float,
    db: Session,
    run_id: Optional[str] = None,
) -> Dict:
    """Create an AI flag requiring clinician review."""
    flag = AIFlag(
        patient_id=UUID(patient_id),
        agent_name=agent_name,
        flag_type=flag_type,
        title=title,
        description=description,
        evidence=evidence,
        severity=severity,
        confidence=confidence,
        status="pending",
        requires_human_review=True,
    )
    db.add(flag)

    # Notify patient's clinicians (simplified: notify all clinicians for now)
    from app.models.clinician import PatientClinicianAccess
    from app.models.clinician import Clinician
    from app.models.user import User
    accesses = (
        db.query(PatientClinicianAccess)
        .filter(PatientClinicianAccess.patient_id == UUID(patient_id))
        .filter(PatientClinicianAccess.is_active == True)
        .all()
    )
    for access in accesses:
        clinician = db.query(Clinician).filter(Clinician.id == access.clinician_id).first()
        if clinician:
            notif = Notification(
                user_id=clinician.user_id,
                title=f"AI Flag: {title}",
                message=f"Severity: {severity.upper()} — {description[:100]}",
                notification_type="review_required",
                related_entity_type="ai_flag",
                related_entity_id=flag.id,
            )
            db.add(notif)

    # Audit log
    log = AuditLog(
        patient_id=UUID(patient_id),
        run_id=UUID(run_id) if run_id else None,
        agent=agent_name,
        action="flag_created",
        resource_type="ai_flag",
        resource_id=flag.id,
        output_summary=f"{flag_type}: {title}",
        confidence=confidence,
        human_decision="pending",
    )
    db.add(log)
    db.commit()
    return {"flag_id": str(flag.id), "status": "created", "requires_review": True}


def add_timeline_event(
    patient_id: str,
    event_date: str,
    event_type: str,
    title: str,
    db: Session,
    description: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    document_id: Optional[str] = None,
    source: Optional[str] = None,
) -> Dict:
    """Add an event to the patient timeline."""
    from datetime import date
    event = PatientTimelineEvent(
        patient_id=UUID(patient_id),
        event_date=date.fromisoformat(event_date),
        event_type=event_type,
        title=title,
        description=description,
        entity_type=entity_type,
        entity_id=UUID(entity_id) if entity_id else None,
        document_id=UUID(document_id) if document_id else None,
        source=source,
    )
    db.add(event)
    db.commit()
    return {"id": str(event.id), "status": "created"}


def save_medication(patient_id: str, db: Session, document_id: Optional[str] = None, **kwargs) -> Dict:
    """Persist an extracted medication."""
    from datetime import date
    med = Medication(
        patient_id=UUID(patient_id),
        document_id=UUID(document_id) if document_id else None,
        **kwargs,
    )
    db.add(med)
    db.commit()
    return {"id": str(med.id), "name": med.name}


def save_diagnosis(patient_id: str, db: Session, document_id: Optional[str] = None, **kwargs) -> Dict:
    """Persist an extracted diagnosis."""
    diag = Diagnosis(
        patient_id=UUID(patient_id),
        document_id=UUID(document_id) if document_id else None,
        **kwargs,
    )
    db.add(diag)
    db.commit()
    return {"id": str(diag.id), "name": diag.name}


def save_lab_result(patient_id: str, db: Session, document_id: Optional[str] = None, **kwargs) -> Dict:
    """Persist an extracted lab result."""
    lab = LabResult(
        patient_id=UUID(patient_id),
        document_id=UUID(document_id) if document_id else None,
        **kwargs,
    )
    db.add(lab)
    db.commit()
    return {"id": str(lab.id), "test_name": lab.test_name}


def log_agent_message(run_id: str, agent_name: str, message_type: str, content: str,
                      db: Session, metadata: Optional[Dict] = None) -> None:
    """Log an agent status message (shown in the Activity Panel)."""
    msg = AgentMessage(
        run_id=UUID(run_id),
        agent_name=agent_name,
        message_type=message_type,
        content=content,
        metadata=metadata,
    )
    db.add(msg)
    db.commit()
