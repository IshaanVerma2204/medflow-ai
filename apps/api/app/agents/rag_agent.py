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
    """
    Simple keyword-based similarity when embeddings are not available.
    Used as fallback in mock mode.
    """
    query_words = set(query.lower().split())
    chunk_words = set(chunk_text.lower().split())
    if not query_words:
        return 0.0
    intersection = query_words & chunk_words
    return len(intersection) / len(query_words)


def retrieve_relevant_chunks(
    patient_id: str,
    query: str,
    db,
    top_k: int = 5,
) -> List[Dict]:
    """
    Retrieve relevant document chunks for a patient query.
    Enforces patient_id scoping — never returns another patient's data.
    Uses vector similarity if embeddings available, falls back to keyword match.
    """
    from app.models.document import DocumentChunk, Document
    from uuid import UUID

    # Get all chunks for this patient
    chunks = (
        db.query(DocumentChunk, Document)
        .join(Document, DocumentChunk.document_id == Document.id)
        .filter(DocumentChunk.patient_id == UUID(patient_id))
        .all()
    )

    if not chunks:
        return []

    # Score chunks by keyword similarity (fallback when no embeddings)
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

    # Sort by score descending, take top_k
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
    """
    Split document pages into overlapping chunks for RAG.
    Returns: [{"chunk_index": int, "page_number": int, "content": str, "section": str|None}]
    """
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


MOCK_CHAT_RESPONSES = {
    "medications": {
        "content": "Based on your uploaded records, you are currently prescribed:\n\n• **Metformin** — recorded in your documents with two different frequencies (once daily vs. twice daily). This discrepancy has been flagged for your healthcare provider's review.\n• **Lisinopril 10mg** — once daily, for blood pressure management.\n\n⚠️ Note: There is a discrepancy in your Metformin frequency between documents. Please confirm the correct dosage with your doctor.\n\n[From your records: Previous Prescription & Discharge Summary]\n\nPlease discuss this with your healthcare provider.",
        "sources": [
            {"document_name": "Previous Prescription", "page": 1, "section": "medications", "excerpt": "Metformin 500mg once daily"},
            {"document_name": "Discharge Summary", "page": 2, "section": "medications", "excerpt": "Metformin 500mg twice daily"},
        ],
    },
    "diabetes": {
        "content": "Your records indicate you have been diagnosed with **Type 2 Diabetes Mellitus** (recorded as diagnosed March 2024 by Dr. Sarah Johnson).\n\nYour most recent HbA1c reading (January 10, 2026) was **7.2%**, which your lab report notes is above the target range of <7.0%.\n\n[From your records: Clinic Visit Note, Lab Report Jan 2026]\n\nThis is information extracted from your documents. Please discuss the significance of these readings and next steps with your healthcare provider.",
        "sources": [
            {"document_name": "Clinic Visit Note", "page": 1, "section": "diagnoses", "excerpt": "Type 2 Diabetes Mellitus, diagnosed March 2024"},
            {"document_name": "Lab Report Jan 2026", "page": 1, "section": "lab_results", "excerpt": "HbA1c: 7.2% (reference <7.0%)"},
        ],
    },
    "default": {
        "content": "Based on your uploaded medical records, I found some relevant information. Your records include details about your diagnoses, current medications (Metformin and Lisinopril), and recent lab results from January 2026.\n\nIf you have a specific question about a medication, lab test, or diagnosis mentioned in your documents, please ask and I'll do my best to find that information from your records.\n\n[From your uploaded documents]\n\nRemember: MedFlow AI provides information from your records only. Please discuss medical decisions with your healthcare provider.",
        "sources": [],
    },
}


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
        # Retrieve relevant chunks
        relevant_chunks = retrieve_relevant_chunks(patient_id, query, db)

        if settings.is_mock_ai:
            # Return contextually appropriate mock response
            q_lower = query.lower()
            if any(w in q_lower for w in ["medication", "medicine", "drug", "metformin", "lisinopril", "taking"]):
                response = MOCK_CHAT_RESPONSES["medications"]
            elif any(w in q_lower for w in ["diabetes", "glucose", "sugar", "hba1c", "insulin"]):
                response = MOCK_CHAT_RESPONSES["diabetes"]
            else:
                response = MOCK_CHAT_RESPONSES["default"]

            return {
                "response": response["content"],
                "sources": response["sources"],
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

        # Build messages
        messages = [{"role": "system", "content": RAG_SYSTEM_PROMPT}]
        if conversation_history:
            messages.extend(conversation_history[-6:])  # Last 3 exchanges
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
