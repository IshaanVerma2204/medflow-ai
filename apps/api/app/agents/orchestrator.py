"""
MedFlow AI — AI Orchestrator
Coordinates all specialized agents for document analysis workflows.
Uses a state machine pattern for reproducible, resumable workflows.
"""
import uuid
import logging
from datetime import datetime, date
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.models.ai import AgentRun, AgentMessage, AuditLog
from app.models.document import Document, DocumentStatus, DocumentChunk
from app.models.medical import Medication, Diagnosis, LabResult, FollowUpTask, Appointment
from app.models.timeline import PatientTimelineEvent
from app.models.ai import AIFlag, Notification
from app.models.patient import PatientProfile
from app.agents.extraction_agent import extraction_agent
from app.agents.medication_agent import medication_reconciliation_agent
from app.agents.risk_agent import risk_consistency_agent
from app.agents.summary_agent import summary_agent
from app.agents.rag_agent import chunk_document_pages, embed_text
from app.tools.medical_tools import (
    flag_for_clinician_review,
    log_agent_message,
    add_timeline_event,
)

logger = logging.getLogger(__name__)


class WorkflowStatus:
    RECEIVED = "received"
    DOCUMENT_PROCESSING = "document_processing"
    EXTRACTION = "extraction"
    VALIDATION = "validation"
    ANALYSIS = "analysis"
    HUMAN_REVIEW = "human_review"
    COMPLETED = "completed"
    FAILED = "failed"


def _update_run_status(db: Session, run: AgentRun, status: str, message: str = None):
    run.status = status
    if status in (WorkflowStatus.COMPLETED, WorkflowStatus.FAILED):
        run.completed_at = datetime.utcnow()
    db.commit()
    if message:
        msg = AgentMessage(
            run_id=run.id,
            agent_name="Orchestrator",
            message_type="info",
            content=message,
        )
        db.add(msg)
        db.commit()


def _save_message(db: Session, run_id, agent_name: str, content: str, msg_type: str = "info"):
    msg = AgentMessage(
        run_id=run_id,
        agent_name=agent_name,
        message_type=msg_type,
        content=content,
    )
    db.add(msg)
    db.commit()


def process_document_workflow(document_id: str, run_id: str):
    """
    Full document analysis workflow:
    1. Extract text → 2. Extract entities → 3. RAG chunks → 
    4. Medication reconciliation → 5. Risk analysis → 
    6. Timeline update → 7. Generate flags → 8. Complete
    """
    db = SessionLocal()
    try:
        run = db.query(AgentRun).filter(AgentRun.id == uuid.UUID(run_id)).first()
        if not run:
            logger.error(f"AgentRun {run_id} not found")
            return

        doc = db.query(Document).filter(Document.id == uuid.UUID(document_id)).first()
        if not doc:
            _update_run_status(db, run, WorkflowStatus.FAILED, "Document not found")
            return

        patient_id = str(doc.patient_id)
        run_id_str = str(run.id)

        # ── Step 1: Verify document has pages ────────────────────────────────
        _update_run_status(db, run, WorkflowStatus.DOCUMENT_PROCESSING, "Verifying document content...")
        _save_message(db, run.id, "Orchestrator", "📄 Document received — verifying content")

        if not doc.pages:
            _update_run_status(db, run, WorkflowStatus.FAILED, "Document has no extracted pages. Process document first.")
            return

        full_text = "\n\n".join(f"[Page {p.page_number}]\n{p.content}" for p in doc.pages)
        _save_message(db, run.id, "Orchestrator", f"✓ Document ready — {len(doc.pages)} page(s), {len(full_text)} characters")

        # ── Step 2: Entity Extraction ─────────────────────────────────────────
        _update_run_status(db, run, WorkflowStatus.EXTRACTION, "Running extraction agent...")
        _save_message(db, run.id, "ExtractionAgent", "🔍 Extracting medical entities...")

        extracted = extraction_agent.extract(full_text, document_id)

        # Persist diagnoses
        diag_count = 0
        for d in extracted.get("diagnoses", []):
            try:
                from datetime import date as date_type
                diag = Diagnosis(
                    patient_id=uuid.UUID(patient_id),
                    document_id=doc.id,
                    name=d["name"],
                    icd_code=d.get("icd_code"),
                    diagnosed_date=date_type.fromisoformat(d["diagnosed_date"]) if d.get("diagnosed_date") else None,
                    status=d.get("status", "unknown"),
                    severity=d.get("severity"),
                    diagnosing_doctor=d.get("diagnosing_doctor"),
                    source_text=d.get("source_text"),
                    confidence=d.get("confidence"),
                )
                db.add(diag)
                diag_count += 1
            except Exception as e:
                logger.warning(f"Could not save diagnosis: {e}")

        # Persist medications
        med_count = 0
        for m in extracted.get("medications", []):
            try:
                med = Medication(
                    patient_id=uuid.UUID(patient_id),
                    document_id=doc.id,
                    name=m["name"],
                    dosage=m.get("dosage"),
                    frequency=m.get("frequency"),
                    route=m.get("route"),
                    start_date=date.fromisoformat(m["start_date"]) if m.get("start_date") else None,
                    end_date=date.fromisoformat(m["end_date"]) if m.get("end_date") else None,
                    prescriber=m.get("prescriber"),
                    status=m.get("status", "unknown"),
                    source_text=m.get("source_text"),
                    confidence=m.get("confidence"),
                    is_current=m.get("status", "unknown") == "active",
                )
                db.add(med)
                med_count += 1
            except Exception as e:
                logger.warning(f"Could not save medication: {e}")

        # Persist lab results
        lab_count = 0
        for lr in extracted.get("lab_results", []):
            try:
                lab = LabResult(
                    patient_id=uuid.UUID(patient_id),
                    document_id=doc.id,
                    test_name=lr["test_name"],
                    value=lr["value"],
                    unit=lr.get("unit"),
                    reference_range=lr.get("reference_range"),
                    is_abnormal=lr.get("is_abnormal"),
                    test_date=date.fromisoformat(lr["test_date"]) if lr.get("test_date") else None,
                    ordering_doctor=lr.get("ordering_doctor"),
                    source_text=lr.get("source_text"),
                    confidence=lr.get("confidence"),
                )
                db.add(lab)
                lab_count += 1
            except Exception as e:
                logger.warning(f"Could not save lab result: {e}")

        # Persist follow-up tasks
        fu_count = 0
        for fu in extracted.get("follow_up_instructions", []):
            try:
                task = FollowUpTask(
                    patient_id=uuid.UUID(patient_id),
                    document_id=doc.id,
                    task=fu["task"],
                    task_type=fu.get("task_type", "other"),
                    due_date=date.fromisoformat(fu["due_date"]) if fu.get("due_date") else None,
                    priority=fu.get("priority", "medium"),
                    status="pending",
                    responsible_role=fu.get("responsible_role", "clinician"),
                    source_text=fu.get("source_text"),
                )
                db.add(task)
                fu_count += 1
            except Exception as e:
                logger.warning(f"Could not save follow-up: {e}")

        db.commit()
        _save_message(db, run.id, "ExtractionAgent",
                      f"✓ Extracted: {diag_count} diagnoses, {med_count} medications, {lab_count} lab results, {fu_count} follow-ups")

        # ── Step 3: RAG Chunking ──────────────────────────────────────────────
        _save_message(db, run.id, "RAGAgent", "📚 Creating document chunks for search...")
        pages_data = [{"page_number": p.page_number, "content": p.content} for p in doc.pages]
        chunks = chunk_document_pages(pages_data)

        for chunk_data in chunks:
            embedding = embed_text(chunk_data["content"])
            dc = DocumentChunk(
                document_id=doc.id,
                patient_id=uuid.UUID(patient_id),
                chunk_index=chunk_data["chunk_index"],
                content=chunk_data["content"],
                page_number=chunk_data.get("page_number"),
                section=chunk_data.get("section"),
                token_count=chunk_data.get("token_count"),
                embedding=embedding,
            )
            db.add(dc)
        db.commit()
        _save_message(db, run.id, "RAGAgent", f"✓ Created {len(chunks)} searchable chunks")

        # ── Step 4: Timeline Update ───────────────────────────────────────────
        _update_run_status(db, run, WorkflowStatus.ANALYSIS, "Building patient timeline...")
        _save_message(db, run.id, "TimelineAgent", "📅 Updating patient timeline...")

        # Document upload event
        add_timeline_event(
            patient_id=patient_id,
            event_date=str(doc.document_date or date.today()),
            event_type="document_upload",
            title=f"Document uploaded: {doc.document_title or doc.original_filename}",
            description=f"Medical document processed — {extracted.get('summary_one_line', '')}",
            document_id=document_id,
            entity_type="document",
            entity_id=document_id,
            source="System",
            db=db,
        )

        # Diagnosis events
        for d in extracted.get("diagnoses", []):
            if d.get("diagnosed_date"):
                add_timeline_event(
                    patient_id=patient_id,
                    event_date=d["diagnosed_date"],
                    event_type="diagnosis",
                    title=f"Diagnosis: {d['name']}",
                    description=f"Status: {d.get('status', 'unknown')} | Doctor: {d.get('diagnosing_doctor', 'Unknown')}",
                    document_id=document_id,
                    source=doc.original_filename,
                    db=db,
                )

        # Lab result events
        for lr in extracted.get("lab_results", []):
            if lr.get("test_date"):
                abnormal_note = " (above reference range)" if lr.get("is_abnormal") else ""
                add_timeline_event(
                    patient_id=patient_id,
                    event_date=lr["test_date"],
                    event_type="lab_result",
                    title=f"Lab: {lr['test_name']} = {lr['value']} {lr.get('unit', '')}",
                    description=f"Reference: {lr.get('reference_range', 'N/A')}{abnormal_note}",
                    document_id=document_id,
                    source=doc.original_filename,
                    db=db,
                )

        _save_message(db, run.id, "TimelineAgent", "✓ Patient timeline updated")

        # ── Step 5: Medication Reconciliation ────────────────────────────────
        _save_message(db, run.id, "MedicationReconciliationAgent", "💊 Comparing medication lists across documents...")

        # Group medications by source document
        from app.models.medical import Medication as MedModel
        from app.models.document import Document as DocModel
        all_meds = (
            db.query(MedModel, DocModel.original_filename)
            .join(DocModel, MedModel.document_id == DocModel.id)
            .filter(MedModel.patient_id == uuid.UUID(patient_id))
            .all()
        )

        meds_by_doc: Dict[str, List] = {}
        for med, doc_name in all_meds:
            doc_name = doc_name or "Unknown Document"
            if doc_name not in meds_by_doc:
                meds_by_doc[doc_name] = []
            meds_by_doc[doc_name].append({"name": med.name, "dosage": med.dosage, "frequency": med.frequency})

        if len(meds_by_doc) >= 1:
            reconciliation = medication_reconciliation_agent.reconcile(meds_by_doc)
            findings = reconciliation.get("reconciliation_findings", [])
            _save_message(db, run.id, "MedicationReconciliationAgent",
                          f"✓ Reconciliation complete — {len(findings)} discrepancies found")

            for finding in findings:
                if finding.get("severity") in ("high", "medium"):
                    flag_for_clinician_review(
                        patient_id=patient_id,
                        agent_name="MedicationReconciliationAgent",
                        flag_type="medication_conflict",
                        title=f"Medication discrepancy: {finding['medication']}",
                        description=finding["description"],
                        evidence=[
                            {"source_document": src, "text": f"Previous: {finding.get('previous_value')} → Current: {finding.get('current_value')}", "page": None}
                            for src in finding.get("source_documents", [])
                        ],
                        severity=finding["severity"],
                        confidence=finding["confidence"],
                        db=db,
                        run_id=run_id_str,
                    )
                    _save_message(db, run.id, "MedicationReconciliationAgent",
                                  f"⚠️ Flag created: {finding['medication']} discrepancy", "warning")

        # ── Step 6: Risk Analysis ─────────────────────────────────────────────
        _save_message(db, run.id, "RiskConsistencyAgent", "🔎 Analyzing records for inconsistencies...")

        patient_data_for_risk = {
            "medications": [{"name": m.name, "dosage": m.dosage, "frequency": m.frequency} for m, _ in all_meds],
            "diagnoses": [{"name": d["name"], "status": d.get("status")} for d in extracted.get("diagnoses", [])],
            "lab_results": extracted.get("lab_results", []),
            "follow_ups": extracted.get("follow_up_instructions", []),
        }

        risk_result = risk_consistency_agent.analyze(patient_data_for_risk)
        risk_flags = risk_result.get("flags", [])

        for flag in risk_flags:
            flag_for_clinician_review(
                patient_id=patient_id,
                agent_name="RiskConsistencyAgent",
                flag_type=flag.get("flag_type", "inconsistency"),
                title=flag["title"],
                description=flag["description"],
                evidence=flag.get("evidence", []),
                severity=flag["severity"],
                confidence=flag["confidence"],
                db=db,
                run_id=run_id_str,
            )

        if risk_flags:
            _save_message(db, run.id, "RiskConsistencyAgent",
                          f"⚠️ {len(risk_flags)} risk flag(s) generated — awaiting clinician review", "warning")
        else:
            _save_message(db, run.id, "RiskConsistencyAgent", "✓ No critical inconsistencies detected")

        # ── Step 7: Update Document Status ───────────────────────────────────
        doc.status = DocumentStatus.PROCESSED
        db.commit()

        # ── Step 8: Mark Human Review if flags exist ─────────────────────────
        total_flags = len(risk_flags) + len(extracted.get("follow_up_instructions", []))
        if total_flags > 0:
            _update_run_status(db, run, WorkflowStatus.HUMAN_REVIEW,
                               f"⏳ Analysis complete — {total_flags} items awaiting clinician review")
        else:
            _update_run_status(db, run, WorkflowStatus.COMPLETED,
                               "✅ Document analysis complete — no items require immediate review")

        # Notify the patient
        patient_profile = db.query(PatientProfile).filter(PatientProfile.id == uuid.UUID(patient_id)).first()
        if patient_profile:
            notif = Notification(
                user_id=patient_profile.user_id,
                title="Document analysis complete",
                message=f"Your document '{doc.original_filename}' has been analyzed. {diag_count} diagnoses, {med_count} medications, and {lab_count} lab results were extracted.",
                notification_type="document_processed",
                related_entity_type="document",
                related_entity_id=doc.id,
            )
            db.add(notif)
            db.commit()

        # Audit log
        audit = AuditLog(
            patient_id=uuid.UUID(patient_id),
            run_id=run.id,
            agent="Orchestrator",
            action="document_analysis_complete",
            resource_type="document",
            resource_id=doc.id,
            output_summary=f"Extracted {diag_count} diagnoses, {med_count} medications, {lab_count} labs. {total_flags} flags.",
            human_decision="pending" if total_flags > 0 else "not_required",
        )
        db.add(audit)
        db.commit()

        logger.info(f"Document analysis workflow complete for {document_id}")

    except Exception as e:
        logger.error(f"Orchestrator workflow failed: {e}", exc_info=True)
        if run:
            _update_run_status(db, run, WorkflowStatus.FAILED, f"Workflow failed: {str(e)}")
    finally:
        db.close()


orchestrator = {
    "process_document": process_document_workflow,
}
