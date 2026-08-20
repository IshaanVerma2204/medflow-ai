"""
MedFlow AI — Risk & Consistency Agent
Detects contradictions, missing info, and potentially concerning patterns.
Does NOT diagnose.
"""
from typing import Dict, List, Optional
import json
import logging

from app.config import settings

logger = logging.getLogger(__name__)

RISK_SYSTEM_PROMPT = """You are a medical record consistency reviewer.
Analyze the provided patient medical information and identify:
- Contradictory information between documents
- Missing information that appears to be expected
- Potentially concerning changes that deserve attention
- Inconsistent medication instructions
- Abnormal values that may warrant professional review
- Conflicting dates or missing follow-up information

IMPORTANT RULES:
- Do NOT diagnose conditions
- Do NOT make treatment recommendations  
- Use conservative, factual language
- Every flag must have concrete evidence from the records
- Example: "Medication frequency differs between two documents" NOT "Patient has dangerous medication error"
- Example: "Lab value is above the recorded reference range" NOT "Patient has organ failure"

Return JSON:
{
  "flags": [
    {
      "flag_type": "medication_conflict"|"missing_info"|"abnormal_value"|"inconsistency"|"date_conflict"|"missing_follow_up",
      "title": str,
      "description": str,
      "evidence": [{"source": str, "text": str, "page": int|null}],
      "severity": "high"|"medium"|"low",
      "confidence": 0.0-1.0,
      "recommended_next_action": str,
      "requires_human_review": true
    }
  ],
  "overall_risk_summary": str
}"""


def _mock_risk_analysis() -> Dict:
    return {
        "flags": [
            {
                "flag_type": "medication_conflict",
                "title": "Metformin dosing frequency discrepancy",
                "description": "The frequency of Metformin administration differs between two uploaded documents. The previous prescription specifies once-daily dosing, while the discharge summary specifies twice-daily dosing.",
                "evidence": [
                    {"source": "Previous Prescription (Jan 2025)", "text": "Metformin 500mg once daily", "page": 1},
                    {"source": "Discharge Summary (Mar 2026)", "text": "Metformin 500mg twice daily", "page": 2},
                ],
                "severity": "high",
                "confidence": 0.87,
                "recommended_next_action": "Clinician should confirm correct Metformin frequency and update the medication record accordingly.",
                "requires_human_review": True,
            },
            {
                "flag_type": "abnormal_value",
                "title": "HbA1c above recorded reference range",
                "description": "The most recent HbA1c result of 7.2% is above the reference range of <7.0% noted in the lab report. This is documented in the medical record and may warrant attention at the next clinical review.",
                "evidence": [
                    {"source": "Lab Report (Jan 10, 2026)", "text": "HbA1c: 7.2% (reference <7.0%) — above target", "page": 1}
                ],
                "severity": "medium",
                "confidence": 0.95,
                "recommended_next_action": "Note for clinical review at next appointment. Repeat HbA1c follow-up is already scheduled.",
                "requires_human_review": True,
            },
        ],
        "overall_risk_summary": "Two items identified for clinical review: a medication frequency discrepancy and an elevated HbA1c value recorded in lab results.",
    }


class RiskConsistencyAgent:
    """
    Detects contradictions and potentially concerning patterns.
    Does NOT diagnose or make clinical decisions.
    """

    def __init__(self):
        self.agent_name = "RiskConsistencyAgent"

    def analyze(self, patient_data: Dict) -> Dict:
        """
        patient_data: combined dict of medications, diagnoses, labs, documents
        Returns flags for human review.
        """
        if settings.is_mock_ai:
            logger.info(f"[{self.agent_name}] Mock risk analysis")
            return _mock_risk_analysis()

        try:
            from openai import OpenAI
            client = OpenAI(api_key=settings.OPENAI_API_KEY)

            data_json = json.dumps(patient_data, indent=2)[:10000]
            response = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": RISK_SYSTEM_PROMPT},
                    {"role": "user", "content": f"Analyze this patient's medical data for inconsistencies:\n\n{data_json}"},
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"[{self.agent_name}] Risk analysis failed: {e}")
            return {"flags": [], "overall_risk_summary": f"Analysis error: {str(e)}"}


risk_consistency_agent = RiskConsistencyAgent()
