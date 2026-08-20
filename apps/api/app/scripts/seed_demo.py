"""
MedFlow AI — Demo Seed Script
Creates synthetic patient data for demonstration purposes.
All data is fictional and de-identified.
"""
import uuid
from datetime import date, datetime, timedelta
import sys
import os

# Add app to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.database import SessionLocal, init_db
from app.models.user import User, UserRole
from app.models.patient import PatientProfile
from app.models.clinician import Clinician, PatientClinicianAccess
from app.models.document import Document, DocumentPage, DocumentStatus, DocumentType, DocumentChunk
from app.models.medical import Medication, Diagnosis, LabResult, FollowUpTask, Appointment
from app.models.timeline import PatientTimelineEvent
from app.models.ai import AIFlag, AgentRun, AgentMessage, AuditLog, Notification
from app.security.auth import get_password_hash

DEMO_PASSWORD = "Demo1234!"


def seed_demo():
    print("🌱 Starting MedFlow AI demo data seed...")
    init_db()
    db = SessionLocal()

    try:
        # ─── Check if already seeded ─────────────────────────────────────────
        existing = db.query(User).filter(User.email == "patient@demo.com").first()
        if existing:
            print("✓ Demo data already exists. Skipping seed.")
            return

        # ─── Users ────────────────────────────────────────────────────────────
        print("Creating demo users...")
        patient_user = User(
            email="patient@demo.com",
            hashed_password=get_password_hash(DEMO_PASSWORD),
            full_name="Alex Thompson",
            role=UserRole.PATIENT,
            is_active=True,
            is_verified=True,
        )
        db.add(patient_user)

        clinician_user = User(
            email="dr.smith@demo.com",
            hashed_password=get_password_hash(DEMO_PASSWORD),
            full_name="Dr. Sarah Johnson",
            role=UserRole.CLINICIAN,
            is_active=True,
            is_verified=True,
        )
        db.add(clinician_user)

        admin_user = User(
            email="admin@demo.com",
            hashed_password=get_password_hash(DEMO_PASSWORD),
            full_name="System Admin",
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True,
        )
        db.add(admin_user)
        db.flush()

        # ─── Patient Profile ──────────────────────────────────────────────────
        print("Creating patient profile...")
        patient_profile = PatientProfile(
            user_id=patient_user.id,
            date_of_birth=date(1978, 6, 15),
            gender="Male",
            blood_type="O+",
            allergies_summary="Penicillin — causes rash and hives (documented)",
            health_summary="Alex Thompson is a 47-year-old male being managed for Type 2 Diabetes Mellitus and Essential Hypertension. Current medications include Metformin and Lisinopril. Most recent HbA1c (January 2026) was 7.2%, above target. A medication frequency discrepancy has been flagged for clinician review.",
        )
        db.add(patient_profile)

        # ─── Clinician Profile ────────────────────────────────────────────────
        print("Creating clinician profile...")
        clinician = Clinician(
            user_id=clinician_user.id,
            specialty="Internal Medicine",
            license_number="LIC-2024-98765",
            institution="City Medical Center",
        )
        db.add(clinician)
        db.flush()

        # Clinician-Patient Access
        access = PatientClinicianAccess(
            patient_id=patient_profile.id,
            clinician_id=clinician.id,
            granted_by=admin_user.id,
            is_active=True,
        )
        db.add(access)
        db.flush()

        # ─── Synthetic Documents ──────────────────────────────────────────────
        print("Creating synthetic documents...")

        # Document 1: Clinic Visit Note
        doc1 = Document(
            patient_id=patient_profile.id,
            uploaded_by=patient_user.id,
            filename=f"clinic_visit_jan2026_{uuid.uuid4().hex[:8]}.pdf",
            original_filename="Clinic Visit Note - Jan 2026.pdf",
            document_type=DocumentType.PDF,
            storage_key="demo/clinic_visit_jan2026.pdf",
            file_size=145000,
            status=DocumentStatus.PROCESSED,
            document_date=date(2026, 1, 10),
            document_title="Clinic Visit Note - January 2026",
            description="Regular diabetes and hypertension follow-up",
            page_count=3,
        )
        db.add(doc1)
        db.flush()

        doc1_content = """CLINIC VISIT NOTE
Date: January 10, 2026
Patient: Alex Thompson | DOB: June 15, 1978
Physician: Dr. Sarah Johnson, MD - Internal Medicine
Facility: City Medical Center

CHIEF COMPLAINT: Routine follow-up for diabetes and hypertension management.

ACTIVE DIAGNOSES:
1. Type 2 Diabetes Mellitus (E11) — diagnosed March 2024. Moderate severity. Currently managed with Metformin.
2. Essential Hypertension (I10) — diagnosed September 2023. Controlled. Managed with Lisinopril.

ALLERGIES: Penicillin — causes rash and hives.

CURRENT MEDICATIONS:
- Metformin 500mg twice daily (oral) — for blood sugar management. Started March 20, 2024.
- Lisinopril 10mg once daily (oral) — for blood pressure. Started September 15, 2023.

VITAL SIGNS:
- Blood Pressure: 138/88 mmHg (target <130/80 mmHg)
- Weight: 82 kg
- Pulse: 76 bpm
- Temperature: 98.6°F

LABORATORY RESULTS:
- HbA1c: 7.2% (reference <7.0%) — above target
- Fasting Blood Glucose: 142 mg/dL (reference 70-99 mg/dL) — elevated
- Serum Creatinine: 0.9 mg/dL (reference 0.7-1.2 mg/dL) — normal
- eGFR: 88 mL/min — normal

ASSESSMENT & PLAN:
Patient's HbA1c remains above target at 7.2%. Blood pressure is mildly elevated at 138/88 mmHg.
Continue current medication regimen. Patient counseled on diet and exercise.

FOLLOW-UP INSTRUCTIONS:
1. Repeat HbA1c in 3 months to reassess glycemic control.
2. Referral to endocrinology for diabetes management optimization if HbA1c does not improve.
3. Next appointment scheduled: April 15, 2026 with Dr. Johnson.

Signed: Dr. Sarah Johnson, MD
License: LIC-2024-98765"""

        # Document pages
        for i, (page_num, content) in enumerate([
            (1, doc1_content[:1500]),
            (2, doc1_content[1500:3000]),
            (3, doc1_content[3000:]),
        ]):
            page = DocumentPage(document_id=doc1.id, page_number=page_num, content=content)
            db.add(page)

        # Chunks for RAG
        for chunk_idx, chunk_content in enumerate([doc1_content[i:i+600] for i in range(0, len(doc1_content), 500)]):
            chunk = DocumentChunk(
                document_id=doc1.id,
                patient_id=patient_profile.id,
                chunk_index=chunk_idx,
                content=chunk_content,
                page_number=1,
                section="clinical_notes",
            )
            db.add(chunk)

        # Document 2: Previous Prescription (older)
        doc2 = Document(
            patient_id=patient_profile.id,
            uploaded_by=patient_user.id,
            filename=f"prescription_mar2025_{uuid.uuid4().hex[:8]}.pdf",
            original_filename="Prescription - March 2025.pdf",
            document_type=DocumentType.PDF,
            storage_key="demo/prescription_mar2025.pdf",
            file_size=45000,
            status=DocumentStatus.PROCESSED,
            document_date=date(2025, 3, 1),
            document_title="Prescription - March 2025",
            description="Diabetes medication prescription",
            page_count=1,
        )
        db.add(doc2)
        db.flush()

        doc2_content = """PRESCRIPTION
Date: March 1, 2025
Patient: Alex Thompson
Prescriber: Dr. Sarah Johnson, MD

Rx:
1. Metformin 500mg — once daily with meals
   Quantity: 30 tablets | Refills: 3

2. Lisinopril 10mg — once daily
   Quantity: 30 tablets | Refills: 3

Note: Monitor blood pressure weekly. Return in 3 months for follow-up.

Signed: Dr. Sarah Johnson, MD"""

        page2 = DocumentPage(document_id=doc2.id, page_number=1, content=doc2_content)
        db.add(page2)

        chunk2 = DocumentChunk(
            document_id=doc2.id,
            patient_id=patient_profile.id,
            chunk_index=0,
            content=doc2_content,
            page_number=1,
            section="medications",
        )
        db.add(chunk2)

        # Document 3: Hospital Discharge Summary
        doc3 = Document(
            patient_id=patient_profile.id,
            uploaded_by=patient_user.id,
            filename=f"discharge_summary_nov2025_{uuid.uuid4().hex[:8]}.pdf",
            original_filename="Hospital Discharge Summary - Nov 2025.pdf",
            document_type=DocumentType.PDF,
            storage_key="demo/discharge_summary_nov2025.pdf",
            file_size=210000,
            status=DocumentStatus.PROCESSED,
            document_date=date(2025, 11, 20),
            document_title="Hospital Discharge Summary - November 2025",
            description="Inpatient admission for hyperglycemia management",
            page_count=4,
        )
        db.add(doc3)
        db.flush()

        doc3_content = """DISCHARGE SUMMARY
Admission Date: November 15, 2025
Discharge Date: November 20, 2025
Patient: Alex Thompson | MRN: 78654321
Admitting Physician: Dr. Sarah Johnson, MD
Facility: City Medical Center, Internal Medicine Unit

REASON FOR ADMISSION: Hyperglycemia — blood glucose 320 mg/dL on presentation.

DIAGNOSES AT DISCHARGE:
1. Type 2 Diabetes Mellitus, uncontrolled — admitted for glucose management
2. Essential Hypertension

MEDICATIONS AT DISCHARGE:
- Metformin 500mg TWICE DAILY (oral) — dosage frequency increased from once daily
- Lisinopril 10mg once daily (oral) — no change

DISCHARGE INSTRUCTIONS:
1. Take Metformin 500mg twice daily with meals (morning and evening)
2. Monitor blood glucose at home daily
3. Follow low-carbohydrate diet
4. Follow up with Dr. Johnson within 2 weeks
5. Repeat HbA1c in 3 months
6. If blood glucose exceeds 300 mg/dL, go to emergency department

FOLLOW-UP:
- Primary Care (Dr. Johnson): 2 weeks post-discharge
- Endocrinology referral placed

Signed: Dr. Sarah Johnson, MD"""

        for i, (page_num, content) in enumerate([
            (1, doc3_content[:1200]),
            (2, doc3_content[1200:2400]),
            (3, doc3_content[2400:]),
        ]):
            page = DocumentPage(document_id=doc3.id, page_number=page_num, content=content)
            db.add(page)

        for chunk_idx, chunk_content in enumerate([doc3_content[i:i+600] for i in range(0, len(doc3_content), 500)]):
            chunk = DocumentChunk(
                document_id=doc3.id,
                patient_id=patient_profile.id,
                chunk_index=chunk_idx,
                content=chunk_content,
                page_number=1,
                section="discharge_instructions",
            )
            db.add(chunk)

        db.commit()

        # ─── Medications ──────────────────────────────────────────────────────
        print("Creating medications...")
        med1 = Medication(
            patient_id=patient_profile.id,
            document_id=doc1.id,
            name="Metformin",
            dosage="500mg",
            frequency="twice daily",
            route="oral",
            start_date=date(2024, 3, 20),
            prescriber="Dr. Sarah Johnson",
            status="active",
            is_current=True,
            source_text="Metformin 500mg twice daily (oral) — for blood sugar management. Started March 20, 2024.",
            confidence=0.97,
        )
        db.add(med1)

        med1_old = Medication(
            patient_id=patient_profile.id,
            document_id=doc2.id,
            name="Metformin",
            dosage="500mg",
            frequency="once daily",
            route="oral",
            start_date=date(2024, 3, 20),
            prescriber="Dr. Sarah Johnson",
            status="active",
            is_current=False,
            source_text="Metformin 500mg — once daily with meals",
            confidence=0.95,
        )
        db.add(med1_old)

        med2 = Medication(
            patient_id=patient_profile.id,
            document_id=doc1.id,
            name="Lisinopril",
            dosage="10mg",
            frequency="once daily",
            route="oral",
            start_date=date(2023, 9, 15),
            prescriber="Dr. Sarah Johnson",
            status="active",
            is_current=True,
            source_text="Lisinopril 10mg once daily (oral) — for blood pressure. Started September 15, 2023.",
            confidence=0.94,
        )
        db.add(med2)

        # ─── Diagnoses ────────────────────────────────────────────────────────
        print("Creating diagnoses...")
        diag1 = Diagnosis(
            patient_id=patient_profile.id,
            document_id=doc1.id,
            name="Type 2 Diabetes Mellitus",
            icd_code="E11",
            diagnosed_date=date(2024, 3, 15),
            status="active",
            severity="moderate",
            diagnosing_doctor="Dr. Sarah Johnson",
            source_text="Type 2 Diabetes Mellitus (E11) — diagnosed March 2024. Moderate severity.",
            confidence=0.95,
        )
        db.add(diag1)

        diag2 = Diagnosis(
            patient_id=patient_profile.id,
            document_id=doc1.id,
            name="Essential Hypertension",
            icd_code="I10",
            diagnosed_date=date(2023, 9, 1),
            status="active",
            severity="mild",
            diagnosing_doctor="Dr. Sarah Johnson",
            source_text="Essential Hypertension (I10) — diagnosed September 2023. Controlled.",
            confidence=0.92,
        )
        db.add(diag2)

        # ─── Lab Results ──────────────────────────────────────────────────────
        print("Creating lab results...")
        labs = [
            LabResult(patient_id=patient_profile.id, document_id=doc1.id, test_name="HbA1c",
                      value="7.2", unit="%", reference_range="<7.0", is_abnormal=True,
                      test_date=date(2026, 1, 10), ordering_doctor="Dr. Sarah Johnson",
                      source_text="HbA1c: 7.2% (reference <7.0%) — above target", confidence=0.99),
            LabResult(patient_id=patient_profile.id, document_id=doc1.id, test_name="HbA1c",
                      value="7.8", unit="%", reference_range="<7.0", is_abnormal=True,
                      test_date=date(2025, 6, 15), ordering_doctor="Dr. Sarah Johnson",
                      source_text="Previous HbA1c: 7.8%", confidence=0.98),
            LabResult(patient_id=patient_profile.id, document_id=doc1.id, test_name="Fasting Blood Glucose",
                      value="142", unit="mg/dL", reference_range="70-99", is_abnormal=True,
                      test_date=date(2026, 1, 10), ordering_doctor="Dr. Sarah Johnson",
                      source_text="Fasting glucose: 142 mg/dL (normal 70-99 mg/dL)", confidence=0.98),
            LabResult(patient_id=patient_profile.id, document_id=doc3.id, test_name="Fasting Blood Glucose",
                      value="320", unit="mg/dL", reference_range="70-99", is_abnormal=True,
                      test_date=date(2025, 11, 15), ordering_doctor="Dr. Sarah Johnson",
                      source_text="Blood glucose 320 mg/dL on presentation", confidence=0.99),
            LabResult(patient_id=patient_profile.id, document_id=doc1.id, test_name="Blood Pressure",
                      value="138/88", unit="mmHg", reference_range="<130/80", is_abnormal=True,
                      test_date=date(2026, 1, 10), ordering_doctor="Dr. Sarah Johnson",
                      source_text="BP: 138/88 mmHg — above target for diabetic patient", confidence=0.96),
            LabResult(patient_id=patient_profile.id, document_id=doc1.id, test_name="Serum Creatinine",
                      value="0.9", unit="mg/dL", reference_range="0.7-1.2", is_abnormal=False,
                      test_date=date(2026, 1, 10), ordering_doctor="Dr. Sarah Johnson",
                      source_text="Serum Creatinine: 0.9 mg/dL — normal", confidence=0.99),
        ]
        for lab in labs:
            db.add(lab)

        # ─── Follow-up Tasks ──────────────────────────────────────────────────
        print("Creating follow-up tasks...")
        tasks = [
            FollowUpTask(patient_id=patient_profile.id, document_id=doc1.id,
                         task="Repeat HbA1c blood test", task_type="lab_test",
                         priority="high", status="pending", responsible_role="clinician",
                         source_text="Repeat HbA1c in 3 months to reassess glycemic control.",
                         notes="Due approximately April 2026"),
            FollowUpTask(patient_id=patient_profile.id, document_id=doc1.id,
                         task="Referral to endocrinology for diabetes management optimization",
                         task_type="specialist_consultation",
                         priority="medium", status="pending", responsible_role="clinician",
                         source_text="Referral to endocrinology for diabetes management optimization."),
            FollowUpTask(patient_id=patient_profile.id, document_id=doc1.id,
                         task="Follow-up appointment with Dr. Sarah Johnson",
                         task_type="appointment", due_date=date(2026, 4, 15),
                         priority="medium", status="pending", responsible_role="patient",
                         source_text="Next appointment scheduled: April 15, 2026 with Dr. Johnson."),
            FollowUpTask(patient_id=patient_profile.id, document_id=doc3.id,
                         task="Monitor blood glucose at home daily",
                         task_type="other",
                         priority="high", status="pending", responsible_role="patient",
                         source_text="Monitor blood glucose at home daily"),
        ]
        for task in tasks:
            db.add(task)

        # ─── Timeline Events ──────────────────────────────────────────────────
        print("Creating timeline events...")
        timeline_events = [
            PatientTimelineEvent(patient_id=patient_profile.id, event_date=date(2023, 9, 1),
                                 event_type="diagnosis", title="Diagnosis: Essential Hypertension",
                                 description="Diagnosed by Dr. Sarah Johnson. Lisinopril started.",
                                 document_id=doc1.id, source="Clinic records"),
            PatientTimelineEvent(patient_id=patient_profile.id, event_date=date(2023, 9, 15),
                                 event_type="medication_start", title="Medication started: Lisinopril 10mg",
                                 description="Started for hypertension management.",
                                 document_id=doc2.id, source="Prescription"),
            PatientTimelineEvent(patient_id=patient_profile.id, event_date=date(2024, 3, 15),
                                 event_type="diagnosis", title="Diagnosis: Type 2 Diabetes Mellitus",
                                 description="New diagnosis by Dr. Sarah Johnson. Metformin initiated.",
                                 document_id=doc1.id, source="Clinic records"),
            PatientTimelineEvent(patient_id=patient_profile.id, event_date=date(2024, 3, 20),
                                 event_type="medication_start", title="Medication started: Metformin 500mg",
                                 description="Started once daily for blood sugar management.",
                                 document_id=doc2.id, source="Prescription"),
            PatientTimelineEvent(patient_id=patient_profile.id, event_date=date(2025, 6, 15),
                                 event_type="lab_result", title="Lab: HbA1c = 7.8%",
                                 description="Above target range <7.0%. Continued management.",
                                 document_id=doc1.id, source="Lab Report"),
            PatientTimelineEvent(patient_id=patient_profile.id, event_date=date(2025, 11, 15),
                                 event_type="appointment", title="Hospital Admission: Hyperglycemia",
                                 description="Admitted with blood glucose 320 mg/dL. Managed over 5 days.",
                                 document_id=doc3.id, source="Discharge Summary"),
            PatientTimelineEvent(patient_id=patient_profile.id, event_date=date(2025, 11, 20),
                                 event_type="medication_change", title="Medication change: Metformin frequency increased",
                                 description="Changed from once daily to twice daily at discharge.",
                                 document_id=doc3.id, source="Discharge Summary"),
            PatientTimelineEvent(patient_id=patient_profile.id, event_date=date(2026, 1, 10),
                                 event_type="lab_result", title="Lab: HbA1c = 7.2% | Glucose = 142 mg/dL",
                                 description="HbA1c improved from 7.8% but still above target <7.0%.",
                                 document_id=doc1.id, source="Clinic Visit Note"),
            PatientTimelineEvent(patient_id=patient_profile.id, event_date=date(2026, 1, 10),
                                 event_type="appointment", title="Clinic visit: Diabetes & Hypertension follow-up",
                                 description="Regular follow-up with Dr. Sarah Johnson, City Medical Center.",
                                 document_id=doc1.id, source="Clinic Visit Note"),
            PatientTimelineEvent(patient_id=patient_profile.id, event_date=date(2026, 4, 15),
                                 event_type="follow_up", title="Scheduled: Follow-up with Dr. Johnson",
                                 description="Upcoming appointment — April 15, 2026.",
                                 document_id=doc1.id, source="Clinic Visit Note"),
        ]
        for event in timeline_events:
            db.add(event)

        # ─── AI Flags ─────────────────────────────────────────────────────────
        print("Creating AI flags...")
        flag1 = AIFlag(
            patient_id=patient_profile.id,
            agent_name="MedicationReconciliationAgent",
            flag_type="medication_conflict",
            title="Metformin dosing frequency discrepancy",
            description="The frequency of Metformin administration differs between two uploaded documents. The prescription (March 2025) records once-daily dosing, while the discharge summary (November 2025) records twice-daily dosing. This discrepancy requires clinical confirmation.",
            evidence=[
                {"source_document": "Prescription - March 2025", "page": 1,
                 "text": "Metformin 500mg — once daily with meals"},
                {"source_document": "Hospital Discharge Summary - Nov 2025", "page": 2,
                 "text": "Metformin 500mg TWICE DAILY (oral) — dosage frequency increased from once daily"},
            ],
            severity="high",
            confidence=0.87,
            status="pending",
            requires_human_review=True,
        )
        db.add(flag1)

        flag2 = AIFlag(
            patient_id=patient_profile.id,
            agent_name="RiskConsistencyAgent",
            flag_type="abnormal_value",
            title="HbA1c above documented reference range",
            description="The most recent HbA1c result of 7.2% is above the reference range of <7.0% noted in the lab report. This is documented in the medical record and may warrant attention at the next clinical review. HbA1c was also elevated at 7.8% in June 2025.",
            evidence=[
                {"source_document": "Clinic Visit Note - Jan 2026", "page": 1,
                 "text": "HbA1c: 7.2% (reference <7.0%) — above target"},
                {"source_document": "Lab Report - Jun 2025", "page": 1,
                 "text": "HbA1c: 7.8% — elevated"},
            ],
            severity="medium",
            confidence=0.95,
            status="pending",
            requires_human_review=True,
        )
        db.add(flag2)

        # ─── Agent Runs (Demo) ────────────────────────────────────────────────
        print("Creating demo agent runs...")
        run1 = AgentRun(
            patient_id=patient_profile.id,
            document_id=doc1.id,
            triggered_by=patient_user.id,
            workflow_type="document_processing",
            status="human_review",
            started_at=datetime(2026, 1, 10, 14, 30),
            completed_at=datetime(2026, 1, 10, 14, 32),
            output_data={"extracted": {"diagnoses": 2, "medications": 2, "labs": 5}, "flags": 2},
        )
        db.add(run1)
        db.flush()

        messages = [
            ("Orchestrator", "info", "📄 Document received — verifying content"),
            ("Orchestrator", "info", "✓ Document ready — 3 pages, 3245 characters"),
            ("ExtractionAgent", "info", "🔍 Extracting medical entities..."),
            ("ExtractionAgent", "info", "✓ Extracted: 2 diagnoses, 2 medications, 5 lab results, 2 follow-ups"),
            ("RAGAgent", "info", "📚 Creating document chunks for search..."),
            ("RAGAgent", "info", "✓ Created 8 searchable chunks"),
            ("TimelineAgent", "info", "📅 Updating patient timeline..."),
            ("TimelineAgent", "info", "✓ Patient timeline updated"),
            ("MedicationReconciliationAgent", "info", "💊 Comparing medication lists across documents..."),
            ("MedicationReconciliationAgent", "warning", "⚠️ Flag created: Metformin discrepancy"),
            ("RiskConsistencyAgent", "info", "🔎 Analyzing records for inconsistencies..."),
            ("RiskConsistencyAgent", "warning", "⚠️ 2 risk flag(s) generated — awaiting clinician review"),
        ]
        for agent, msg_type, content in messages:
            db.add(AgentMessage(run_id=run1.id, agent_name=agent, message_type=msg_type, content=content))

        # ─── Audit Logs ───────────────────────────────────────────────────────
        print("Creating audit logs...")
        audits = [
            AuditLog(user_id=patient_user.id, patient_id=patient_profile.id, run_id=run1.id,
                     agent="ExtractionAgent", action="document_extracted",
                     resource_type="document", confidence=0.95,
                     output_summary="2 diagnoses, 2 medications, 5 lab results extracted",
                     human_decision="not_required"),
            AuditLog(user_id=patient_user.id, patient_id=patient_profile.id, run_id=run1.id,
                     agent="MedicationReconciliationAgent", action="medication_conflict_detected",
                     resource_type="ai_flag", confidence=0.87,
                     output_summary="Metformin frequency discrepancy detected",
                     human_decision="pending"),
            AuditLog(user_id=patient_user.id, patient_id=patient_profile.id, run_id=run1.id,
                     agent="RiskConsistencyAgent", action="abnormal_value_flagged",
                     resource_type="ai_flag", confidence=0.95,
                     output_summary="HbA1c above reference range flagged",
                     human_decision="pending"),
        ]
        for audit in audits:
            db.add(audit)

        # ─── Notifications ────────────────────────────────────────────────────
        print("Creating notifications...")
        notifs = [
            Notification(user_id=clinician_user.id, title="AI Flag: Metformin dosing frequency discrepancy",
                         message="Severity: HIGH — Medication frequency differs between two documents. Review required.",
                         notification_type="review_required", related_entity_type="ai_flag",
                         related_entity_id=flag1.id),
            Notification(user_id=clinician_user.id, title="AI Flag: HbA1c above reference range",
                         message="Severity: MEDIUM — Lab value above documented reference. Note for clinical review.",
                         notification_type="review_required", related_entity_type="ai_flag",
                         related_entity_id=flag2.id),
            Notification(user_id=patient_user.id, title="Document analysis complete",
                         message="Your document 'Clinic Visit Note - Jan 2026.pdf' has been analyzed. 2 diagnoses, 2 medications, and 5 lab results were extracted.",
                         notification_type="document_processed", related_entity_type="document",
                         related_entity_id=doc1.id),
        ]
        for notif in notifs:
            db.add(notif)

        db.commit()
        print("\n✅ Demo seed complete!")
        print("\n📋 Demo Credentials:")
        print(f"   Patient:    patient@demo.com / {DEMO_PASSWORD}")
        print(f"   Clinician:  dr.smith@demo.com / {DEMO_PASSWORD}")
        print(f"   Admin:      admin@demo.com / {DEMO_PASSWORD}")
        print("\n🔗 Access at: http://localhost:3000")

    except Exception as e:
        print(f"\n❌ Seed failed: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo()
