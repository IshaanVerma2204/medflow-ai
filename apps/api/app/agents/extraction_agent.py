"""
MedFlow AI — Medical Entity Extraction Agent
Extracts structured medical entities from document text.
Uses OpenAI structured outputs or mock mode.
"""
from typing import Any, Dict, List, Optional
import json
import logging
from datetime import datetime

from app.config import settings

logger = logging.getLogger(__name__)

EXTRACTION_SYSTEM_PROMPT = """You are a medical document analysis assistant. 
Extract structured medical information from the provided document text.

IMPORTANT RULES:
- NEVER invent information not present in the text
- Mark uncertain information with is_uncertain: true
- Preserve exact quotes in source_text
- If information is not present, return empty lists
- Do NOT make diagnoses or clinical interpretations
- You are extracting and structuring existing information only

Return a JSON object with this exact structure:
{
  "diagnoses": [{"name": str, "icd_code": str|null, "diagnosed_date": "YYYY-MM-DD"|null, "status": "active"|"resolved"|"unknown", "severity": str|null, "diagnosing_doctor": str|null, "source_text": str, "confidence": 0.0-1.0, "is_uncertain": bool}],
  "medications": [{"name": str, "dosage": str|null, "frequency": str|null, "route": str|null, "start_date": "YYYY-MM-DD"|null, "end_date": "YYYY-MM-DD"|null, "prescriber": str|null, "status": "active"|"discontinued"|"unknown", "source_text": str, "confidence": 0.0-1.0, "is_uncertain": bool}],
  "lab_results": [{"test_name": str, "value": str, "unit": str|null, "reference_range": str|null, "is_abnormal": bool|null, "test_date": "YYYY-MM-DD"|null, "ordering_doctor": str|null, "source_text": str, "confidence": 0.0-1.0}],
  "allergies": [{"substance": str, "reaction": str|null, "severity": str|null, "source_text": str, "confidence": 0.0-1.0}],
  "follow_up_instructions": [{"task": str, "task_type": "appointment"|"lab_test"|"medication_review"|"specialist_consultation"|"other", "due_date": "YYYY-MM-DD"|null, "priority": "high"|"medium"|"low", "responsible_role": "patient"|"clinician"|"both", "source_text": str}],
  "appointments": [{"appointment_date": "YYYY-MM-DD"|null, "doctor_name": str|null, "specialty": str|null, "location": str|null, "purpose": str|null, "status": "scheduled"|"completed"|"unknown", "source_text": str}],
  "vital_signs": [{"measurement": str, "value": str, "unit": str|null, "date": "YYYY-MM-DD"|null, "source_text": str}],
  "procedures": [{"name": str, "date": "YYYY-MM-DD"|null, "performing_doctor": str|null, "source_text": str}],
  "doctors": [{"name": str, "specialty": str|null, "role": str|null}],
  "document_date": "YYYY-MM-DD"|null,
  "document_type_detected": str,
  "summary_one_line": str
}"""


MOCK_EXTRACTION_RESPONSE = {
    "diagnoses": [
        {
            "name": "Type 2 Diabetes Mellitus",
            "icd_code": "E11",
            "diagnosed_date": "2024-03-15",
            "status": "active",
            "severity": "moderate",
            "diagnosing_doctor": "Dr. Sarah Johnson",
            "source_text": "Patient presents with Type 2 Diabetes Mellitus, diagnosed March 2024.",
            "confidence": 0.95,
            "is_uncertain": False,
        },
        {
            "name": "Hypertension",
            "icd_code": "I10",
            "diagnosed_date": "2023-09-01",
            "status": "active",
            "severity": "mild",
            "diagnosing_doctor": "Dr. Sarah Johnson",
            "source_text": "Essential hypertension, controlled with medication.",
            "confidence": 0.92,
            "is_uncertain": False,
        },
    ],
    "medications": [
        {
            "name": "Metformin",
            "dosage": "500mg",
            "frequency": "twice daily",
            "route": "oral",
            "start_date": "2024-03-20",
            "end_date": None,
            "prescriber": "Dr. Sarah Johnson",
            "status": "active",
            "source_text": "Metformin 500mg twice daily — continue as prescribed.",
            "confidence": 0.97,
            "is_uncertain": False,
        },
        {
            "name": "Lisinopril",
            "dosage": "10mg",
            "frequency": "once daily",
            "route": "oral",
            "start_date": "2023-09-15",
            "end_date": None,
            "prescriber": "Dr. Sarah Johnson",
            "status": "active",
            "source_text": "Lisinopril 10mg daily for blood pressure management.",
            "confidence": 0.94,
            "is_uncertain": False,
        },
    ],
    "lab_results": [
        {
            "test_name": "HbA1c",
            "value": "7.2",
            "unit": "%",
            "reference_range": "<7.0",
            "is_abnormal": True,
            "test_date": "2026-01-10",
            "ordering_doctor": "Dr. Sarah Johnson",
            "source_text": "HbA1c: 7.2% (reference <7.0%) — above target",
            "confidence": 0.99,
        },
        {
            "test_name": "Fasting Blood Glucose",
            "value": "142",
            "unit": "mg/dL",
            "reference_range": "70-99",
            "is_abnormal": True,
            "test_date": "2026-01-10",
            "ordering_doctor": "Dr. Sarah Johnson",
            "source_text": "Fasting glucose: 142 mg/dL (normal 70-99 mg/dL)",
            "confidence": 0.98,
        },
        {
            "test_name": "Blood Pressure",
            "value": "138/88",
            "unit": "mmHg",
            "reference_range": "<130/80",
            "is_abnormal": True,
            "test_date": "2026-01-10",
            "ordering_doctor": "Dr. Sarah Johnson",
            "source_text": "BP: 138/88 mmHg — above target for diabetic patient",
            "confidence": 0.96,
        },
    ],
    "allergies": [
        {
            "substance": "Penicillin",
            "reaction": "Rash, hives",
            "severity": "moderate",
            "source_text": "Allergy: Penicillin — causes rash and hives",
            "confidence": 0.98,
        }
    ],
    "follow_up_instructions": [
        {
            "task": "Repeat HbA1c in 3 months",
            "task_type": "lab_test",
            "due_date": None,
            "priority": "high",
            "responsible_role": "clinician",
            "source_text": "Repeat HbA1c testing in 3 months to reassess glycemic control.",
        },
        {
            "task": "Follow-up appointment with endocrinologist",
            "task_type": "specialist_consultation",
            "due_date": None,
            "priority": "medium",
            "responsible_role": "patient",
            "source_text": "Referral to endocrinology for diabetes management optimization.",
        },
    ],
    "appointments": [
        {
            "appointment_date": "2026-04-15",
            "doctor_name": "Dr. Sarah Johnson",
            "specialty": "Internal Medicine",
            "location": "City Medical Center",
            "purpose": "Diabetes follow-up",
            "status": "scheduled",
            "source_text": "Next appointment scheduled April 15, 2026 with Dr. Johnson.",
        }
    ],
    "vital_signs": [
        {
            "measurement": "Weight",
            "value": "82",
            "unit": "kg",
            "date": "2026-01-10",
            "source_text": "Weight: 82 kg",
        },
        {
            "measurement": "Blood Pressure",
            "value": "138/88",
            "unit": "mmHg",
            "date": "2026-01-10",
            "source_text": "BP 138/88 mmHg",
        },
    ],
    "procedures": [],
    "doctors": [
        {"name": "Dr. Sarah Johnson", "specialty": "Internal Medicine", "role": "Primary Care Physician"}
    ],
    "document_date": "2026-01-10",
    "document_type_detected": "clinic_visit_note",
    "summary_one_line": "Clinic visit for Type 2 Diabetes and Hypertension management — HbA1c elevated, medication adjustments discussed.",
}


class ExtractionAgent:
    """
    Medical Record Extraction Agent.
    Parses document text and returns strictly structured medical entities.
    """

    def __init__(self):
        self.agent_name = "ExtractionAgent"

    def extract(self, document_text: str, document_id: Optional[str] = None) -> Dict:
        """
        Extract medical entities from document text.
        Returns structured JSON with all entities and provenance.
        """
        if settings.is_mock_ai:
            logger.info(f"[{self.agent_name}] Mock mode — returning synthetic extraction")
            return MOCK_EXTRACTION_RESPONSE

        try:
            from openai import OpenAI
            client = OpenAI(api_key=settings.OPENAI_API_KEY)

            # Truncate very long documents to fit context
            max_chars = 12000
            if len(document_text) > max_chars:
                document_text = document_text[:max_chars] + "\n...[truncated for length]"

            response = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
                    {"role": "user", "content": f"Extract medical information from this document:\n\n{document_text}"},
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
            )
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            logger.error(f"[{self.agent_name}] Extraction failed: {e}")
            return {"error": str(e), "diagnoses": [], "medications": [], "lab_results": [],
                    "allergies": [], "follow_up_instructions": [], "appointments": [],
                    "vital_signs": [], "procedures": [], "doctors": []}


extraction_agent = ExtractionAgent()
