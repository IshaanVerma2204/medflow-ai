"""
MedFlow AI — Medication Reconciliation Agent
Compares medication lists across documents and detects discrepancies.
"""
from typing import Any, Dict, List, Optional
import json
import logging

from app.config import settings

logger = logging.getLogger(__name__)

RECONCILIATION_SYSTEM_PROMPT = """You are a clinical pharmacist assistant performing medication reconciliation.
Compare the provided medication lists from different documents and identify any discrepancies.

IMPORTANT RULES:
- NEVER tell patients to change their medication
- NEVER make clinical decisions
- Your role is to DETECT discrepancies only and flag them for clinician review
- Use conservative, factual language
- Every finding must have source evidence

For each discrepancy found, return:
{
  "medication": str,
  "change_type": "new_medication"|"discontinued"|"dose_change"|"frequency_change"|"duplicate"|"conflicting_instructions"|"missing_information",
  "previous_value": str|null,
  "current_value": str|null,
  "confidence": 0.0-1.0,
  "source_documents": [str],
  "description": str,
  "requires_human_review": true,
  "severity": "high"|"medium"|"low"
}

Return JSON: {"reconciliation_findings": [...], "summary": str, "total_discrepancies": int}"""


def _mock_reconciliation(medications: List[Dict]) -> Dict:
    """Return realistic mock reconciliation findings."""
    if len(medications) < 2:
        return {"reconciliation_findings": [], "summary": "Only one medication source available.", "total_discrepancies": 0}
    return {
        "reconciliation_findings": [
            {
                "medication": "Metformin",
                "change_type": "frequency_change",
                "previous_value": "once daily (500mg)",
                "current_value": "twice daily (500mg)",
                "confidence": 0.87,
                "source_documents": ["Previous Prescription", "Discharge Summary"],
                "description": "Medication frequency for Metformin differs between two documents. Previous prescription records once daily dosing; discharge summary specifies twice daily. This discrepancy requires clinical review.",
                "requires_human_review": True,
                "severity": "high",
            }
        ],
        "summary": "One medication discrepancy detected: Metformin dosing frequency differs between documents.",
        "total_discrepancies": 1,
    }


class MedicationReconciliationAgent:
    """
    Compares medication lists across documents.
    Flags discrepancies for clinician review.
    Never instructs medication changes.
    """

    def __init__(self):
        self.agent_name = "MedicationReconciliationAgent"

    def reconcile(self, medications_by_document: Dict[str, List[Dict]]) -> Dict:
        """
        medications_by_document: {document_name: [medication_dicts]}
        Returns reconciliation findings with evidence.
        """
        all_medications = []
        for doc_name, meds in medications_by_document.items():
            for m in meds:
                all_medications.append({**m, "_source_doc": doc_name})

        if settings.is_mock_ai:
            logger.info(f"[{self.agent_name}] Mock reconciliation")
            return _mock_reconciliation(all_medications)

        try:
            from openai import OpenAI
            client = OpenAI(api_key=settings.OPENAI_API_KEY)

            medications_json = json.dumps(medications_by_document, indent=2)
            response = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": RECONCILIATION_SYSTEM_PROMPT},
                    {"role": "user", "content": f"Perform medication reconciliation on these medication lists:\n\n{medications_json}"},
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"[{self.agent_name}] Reconciliation failed: {e}")
            return {"reconciliation_findings": [], "summary": f"Error: {str(e)}", "total_discrepancies": 0}


medication_reconciliation_agent = MedicationReconciliationAgent()
