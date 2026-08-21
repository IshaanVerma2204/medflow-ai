"""
MedFlow AI — RAG Agent
Patient-specific retrieval-augmented generation for the AI chat interface.
Enforces strict patient data isolation.
"""
from typing import Any, Dict, List, Optional, Tuple
import json
import logging
import math

from app.config import settings

logger = logging.getLogger(__name__)

RAG_SYSTEM_PROMPT = """You are MedFlow AI, a medical records assistant.
You help patients and healthcare professionals understand information from uploaded medical documents.

STRICT RULES:
1. ONLY answer based on the provided context from the patient's documents
2. NEVER invent medical information not present in the context
3. NEVER diagnose conditions or recommend treatment changes
4. If information is not in the context, say: "I couldn't find information about that in your uploaded documents."
5. Always cite which document a fact came from
6. Clearly label: [From your records] vs [General information]
7. End clinical topics with: "Please discuss this with your healthcare provider."
8. Do not use fear-inducing language

When citing sources, use format: (Source: Document Name, Page X)"""

CHAT_DISCLAIMER = "MedFlow AI provides information and workflow assistance based on your uploaded documents. It does not replace professional medical judgment."


def _simple_chunk_similarity(query: str, chunk_text: str) -> float:
    """Simple keyword-based similarity when embeddings are not available."""
    query_words = set(query.lower().split())
    chunk_words = set(chunk_text.lower().split())
    if not query_words:
        return 0.0
    intersection = query_words & chunk_words
    return len(intersection) / len(query_words)


def retrieve_relevant_chunks(patient_id: str, query: str, db, top_k: int = 5) -> List[Dict]:
    """Retrieve relevant document chunks for a patient query."""
    from app.models.document import DocumentChunk, Document
    from uuid import UUID

    chunks = (
        db.query(DocumentChunk, Document)
        .join(Document, DocumentChunk.document_id == Document.id)
        .filter(DocumentChunk.patient_id == UUID(patient_id))
        .all()
    )

    if not chunks:
        return []

    scored = []
    for chunk, doc in chunks:
        score = _simple_chunk_similarity(query, chunk.content)
        if score > 0:
            scored.append({
                "chunk_id": str(chunk.id),
                "document_id": str(chunk.document_id),
                "document_name": doc.document_title or doc.original_filename,
                "page_number": chunk.page_number,
                "section": chunk.section,
                "content": chunk.content[:800],
                "score": score,
            })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_k]


def embed_text(text: str) -> Optional[List[float]]:
    """Generate an embedding. Returns None in mock mode."""
    if settings.is_mock_ai:
        return None
    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.embeddings.create(
            model=settings.OPENAI_EMBEDDING_MODEL,
            input=text,
        )
        return response.data[0].embedding
    except Exception as e:
        logger.error(f"Embedding failed: {e}")
        return None


def chunk_document_pages(pages: List[Dict], chunk_size: int = 600, overlap: int = 100) -> List[Dict]:
    """Split document pages into overlapping chunks for RAG."""
    chunks = []
    chunk_index = 0
    for page in pages:
        text = page.get("content", "")
        page_num = page.get("page_number", 1)
        words = text.split()
        i = 0
        while i < len(words):
            chunk_words = words[i: i + chunk_size]
            chunk_text = " ".join(chunk_words)
            if chunk_text.strip():
                chunks.append({
                    "chunk_index": chunk_index,
                    "page_number": page_num,
                    "content": chunk_text,
                    "section": _detect_section(chunk_text),
                    "token_count": len(chunk_words),
                })
                chunk_index += 1
            i += chunk_size - overlap
    return chunks


def _detect_section(text: str) -> Optional[str]:
    """Heuristic section detector for medical documents."""
    text_lower = text.lower()[:200]
    sections = {
        "medications": ["medication", "prescription", "drug", "dosage"],
        "diagnoses": ["diagnosis", "diagnoses", "condition", "assessment"],
        "lab_results": ["laboratory", "lab result", "blood test", "hba1c", "glucose"],
        "vital_signs": ["vital", "blood pressure", "weight", "temperature", "pulse"],
        "follow_up": ["follow-up", "follow up", "next appointment", "return"],
        "allergies": ["allergy", "allergies", "allergic"],
        "history": ["history", "past medical", "previous"],
    }
    for section, keywords in sections.items():
        if any(kw in text_lower for kw in keywords):
            return section
    return None


def _build_mock_response(query: str, patient_id: str, db) -> Dict:
    """
    Build a dynamic, personalized response from real database data.
    Used in Mock AI mode (no OpenAI key) so responses are accurate
    and patient-specific rather than hardcoded generic replies.
    """
    from app.models.medical import Medication, Diagnosis, LabResult, FollowUpTask
    from app.models.patient import PatientProfile
    from app.models.document import Document
    from uuid import UUID

    pid = UUID(patient_id)
    q = query.lower()

    # Load real patient data
    profile = db.query(PatientProfile).filter(PatientProfile.id == pid).first()
    medications = db.query(Medication).filter(Medication.patient_id == pid).all()
    diagnoses = db.query(Diagnosis).filter(Diagnosis.patient_id == pid).all()
    lab_results = db.query(LabResult).filter(LabResult.patient_id == pid).order_by(LabResult.test_date.desc()).all()
    follow_ups = db.query(FollowUpTask).filter(FollowUpTask.patient_id == pid).all()
    documents = db.query(Document).filter(Document.patient_id == pid).all()

    # ── Medications ──────────────────────────────────────────────
    if any(w in q for w in ["medication", "medicine", "drug", "prescri", "taking", "pills", "tablet"]):
        if not medications:
            return {
                "response": "I couldn't find any medications recorded in your uploaded documents. Upload a prescription or discharge summary and I'll be able to answer this question.",
                "sources": [],
            }
        lines = []
        for m in medications:
            detail = f"• **{m.name}**"
            if m.dosage:
                detail += f" {m.dosage}"
            if m.frequency:
                detail += f" — {m.frequency}"
            if m.route:
                detail += f" ({m.route})"
            if m.prescriber:
                detail += f", prescribed by {m.prescriber}"
            if m.status and m.status != "active":
                detail += f" *(Status: {m.status})*"
            lines.append(detail)
        response = "Based on your uploaded records, here are your current medications:\n\n" + "\n".join(lines)
        response += "\n\n[From your records]\n\nPlease discuss any questions about dosage or changes with your healthcare provider."
        return {"response": response, "sources": []}

    # ── Diagnoses / Conditions ───────────────────────────────────
    if any(w in q for w in ["diagnos", "condition", "disease", "illness", "disorder", "what do i have", "sick", "problem", "have"]):
        if not diagnoses:
            return {
                "response": "No diagnoses were found in your uploaded documents. Upload clinic notes or discharge summaries and I'll be able to answer this.",
                "sources": [],
            }
        lines = []
        for d in diagnoses:
            detail = f"• **{d.name}**"
            if d.icd_code:
                detail += f" (ICD: {d.icd_code})"
            if d.diagnosed_date:
                detail += f" — diagnosed {d.diagnosed_date}"
            if d.status:
                detail += f" *(Status: {d.status})*"
            if d.diagnosing_doctor:
                detail += f", by Dr. {d.diagnosing_doctor}"
            lines.append(detail)
        response = "Based on your records, the following diagnoses are documented:\n\n" + "\n".join(lines)
        response += "\n\n[From your records]\n\nPlease discuss your conditions in detail with your healthcare provider."
        return {"response": response, "sources": []}

    # ── Lab Results ──────────────────────────────────────────────
    if any(w in q for w in ["lab", "test", "result", "blood", "hba1c", "glucose", "cholesterol", "level", "report"]):
        if not lab_results:
            return {
                "response": "No lab results were found in your uploaded documents. Upload a lab report and I'll be able to answer this.",
                "sources": [],
            }
        lines = []
        for lr in lab_results[:8]:
            detail = f"• **{lr.test_name}**: {lr.value}"
            if lr.unit:
                detail += f" {lr.unit}"
            if lr.reference_range:
                detail += f" (Reference: {lr.reference_range})"
            if lr.is_abnormal:
                detail += " ⚠️ *Abnormal*"
            if lr.test_date:
                detail += f" — tested on {lr.test_date}"
            lines.append(detail)
        response = "Here are your lab results from your records:\n\n" + "\n".join(lines)
        response += "\n\n[From your records]\n\nPlease discuss any abnormal results with your healthcare provider."
        return {"response": response, "sources": []}

    # ── Allergies ────────────────────────────────────────────────
    if any(w in q for w in ["allerg", "reaction", "intoleran"]):
        allergy_summary = profile.allergies_summary if profile else None
        if allergy_summary:
            response = f"According to your records:\n\n{allergy_summary}\n\n[From your records]\n\nAlways inform your healthcare providers and pharmacists about your allergies."
        else:
            response = "No specific allergies were found documented in your uploaded records. If you have allergies, ask your doctor to update your medical records."
        return {"response": response, "sources": []}

    # ── Follow-ups / Next Steps ──────────────────────────────────
    if any(w in q for w in ["follow", "appointment", "next", "upcoming", "schedule", "task", "todo", "reminder"]):
        pending = [f for f in follow_ups if f.status == "pending"]
        if not pending:
            response = "No pending follow-up tasks are recorded in your documents."
        else:
            lines = []
            for fu in pending:
                detail = f"• **{fu.task}**"
                if fu.priority:
                    detail += f" *(Priority: {fu.priority})*"
                if fu.due_date:
                    detail += f" — due {fu.due_date}"
                lines.append(detail)
            response = "Here are your pending follow-up tasks from your records:\n\n" + "\n".join(lines)
            response += "\n\n[From your records]\n\nPlease confirm appointment details directly with your healthcare provider's office."
        return {"response": response, "sources": []}

    # ── Doctor / Provider ────────────────────────────────────────
    if any(w in q for w in ["doctor", "physician", "dr.", "provider", "specialist", "seeing", "who is"]):
        doctors = set()
        for m in medications:
            if m.prescriber:
                doctors.add(m.prescriber)
        for d in diagnoses:
            if d.diagnosing_doctor:
                doctors.add(d.diagnosing_doctor)
        for lr in lab_results:
            if lr.ordering_doctor:
                doctors.add(lr.ordering_doctor)

        if doctors:
            response = "Based on your documents, the following healthcare providers appear in your records:\n\n"
            response += "\n".join(f"• **{doc}**" for doc in sorted(doctors))
            response += "\n\n[From your records]\n\nFor appointment scheduling, please contact their offices directly."
        else:
            response = "I couldn't find specific doctor names in your uploaded documents. Upload clinic notes or referral letters and I'll be able to answer this."
        return {"response": response, "sources": []}

    # ── Health Summary / Last Visit ──────────────────────────────
    if any(w in q for w in ["summary", "last visit", "overview", "overall", "health", "general", "summarize"]):
        if profile and profile.health_summary:
            response = f"**Health Summary from your records:**\n\n{profile.health_summary}\n\n[From your records]\n\nThis is an AI-generated summary. Please consult your healthcare provider for a complete picture."
        else:
            parts = []
            if diagnoses:
                parts.append(f"**Diagnoses ({len(diagnoses)}):** " + ", ".join(d.name for d in diagnoses[:3]))
            if medications:
                parts.append(f"**Medications ({len(medications)}):** " + ", ".join(m.name for m in medications[:3]))
            if lab_results:
                parts.append(f"**Recent Lab Tests ({len(lab_results)}):** " + ", ".join(lr.test_name for lr in lab_results[:3]))
            if parts:
                response = "Here is a summary based on your uploaded records:\n\n" + "\n".join(parts)
                response += "\n\n[From your records]\n\nPlease discuss your complete health picture with your healthcare provider."
            else:
                response = "No documents have been uploaded yet. Upload your medical records and I can provide a detailed health summary."
        return {"response": response, "sources": []}

    # ── Documents ────────────────────────────────────────────────
    if any(w in q for w in ["document", "file", "upload", "record"]):
        if not documents:
            response = "No documents have been uploaded yet. Use the Documents section to upload your medical files."
        else:
            lines = [f"• **{doc.document_title or doc.original_filename}** (Status: {doc.status})" for doc in documents]
            response = f"You have {len(documents)} document(s) on file:\n\n" + "\n".join(lines)
            response += "\n\n[From your records]"
        return {"response": response, "sources": []}

    # ── Name / Profile ───────────────────────────────────────────
    if any(w in q for w in ["my name", "who am i", "name"]):
        from app.models.user import User
        user = db.query(User).filter(User.id == profile.user_id).first() if profile else None
        if user:
            response = f"Your name on file is **{user.full_name}**."
        else:
            response = "I couldn't find your profile information."
        return {"response": response, "sources": []}

    # ── Default fallback — list what IS available ────────────────
    topics = []
    if medications:
        topics.append(f"{len(medications)} medication(s)")
    if diagnoses:
        topics.append(f"{len(diagnoses)} diagnosis/diagnoses")
    if lab_results:
        topics.append(f"{len(lab_results)} lab result(s)")
    if follow_ups:
        topics.append(f"{len(follow_ups)} follow-up task(s)")

    if topics:
        response = (
            f"I can see your records contain: {', '.join(topics)}.\n\n"
            "You can ask me things like:\n"
            "• What medications am I taking?\n"
            "• What are my diagnoses?\n"
            "• Show my lab results\n"
            "• What are my follow-ups?\n"
            "• What are my allergies?\n"
            "• Who is my doctor?\n"
            "• Summarize my last visit\n\n"
            "[From your uploaded records]"
        )
    else:
        response = "No medical records have been uploaded yet. Head to the **Documents** section to upload your files, and I'll be able to answer questions about your health history."

    return {"response": response, "sources": []}


class RAGAgent:
    """
    Medical RAG Agent.
    Retrieves relevant patient document chunks and generates grounded responses.
    Enforces strict patient isolation.
    """

    def __init__(self):
        self.agent_name = "RAGAgent"

    def chat(self, patient_id: str, query: str, db, conversation_history: List[Dict] = None) -> Dict:
        """
        Answer a patient's question using their uploaded documents.
        Returns response with source citations.
        """
        relevant_chunks = retrieve_relevant_chunks(patient_id, query, db)

        if settings.is_mock_ai:
            result = _build_mock_response(query, patient_id, db)
            return {
                "response": result["response"],
                "sources": result.get("sources", []),
                "disclaimer": CHAT_DISCLAIMER,
                "retrieved_chunks": len(relevant_chunks),
                "is_mock": True,
            }

        # Build context from retrieved chunks
        context_parts = []
        for i, chunk in enumerate(relevant_chunks):
            context_parts.append(
                f"[Document: {chunk['document_name']}, Page {chunk.get('page_number', '?')}]\n{chunk['content']}"
            )
        context = "\n\n---\n\n".join(context_parts) if context_parts else "No relevant documents found."

        messages = [{"role": "system", "content": RAG_SYSTEM_PROMPT}]
        if conversation_history:
            messages.extend(conversation_history[-6:])
        messages.append({
            "role": "user",
            "content": f"Context from patient's documents:\n\n{context}\n\nPatient question: {query}"
        })

        try:
            from openai import OpenAI
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            response = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                temperature=0.2,
                max_tokens=1000,
            )
            answer = response.choices[0].message.content

            return {
                "response": answer,
                "sources": [
                    {
                        "document_name": c["document_name"],
                        "page": c.get("page_number"),
                        "section": c.get("section"),
                        "excerpt": c["content"][:200],
                    }
                    for c in relevant_chunks
                ],
                "disclaimer": CHAT_DISCLAIMER,
                "retrieved_chunks": len(relevant_chunks),
                "is_mock": False,
            }
        except Exception as e:
            logger.error(f"[{self.agent_name}] Chat failed: {e}")
            return {
                "response": "I'm sorry, I encountered an error. Please try again.",
                "sources": [],
                "disclaimer": CHAT_DISCLAIMER,
                "error": str(e),
            }


rag_agent = RAGAgent()
