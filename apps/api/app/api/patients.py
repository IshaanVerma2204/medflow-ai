from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.patient import PatientProfile
from app.models.medical import Medication, LabResult, Diagnosis, FollowUpTask
from app.models.timeline import PatientTimelineEvent
from app.models.ai import AIFlag
from app.models.document import Document
from app.schemas.patient import PatientProfileResponse, PatientProfileUpdate
from app.schemas.medical import Medication as MedicationSchema, LabResult as LabResultSchema, Diagnosis as DiagnosisSchema, FollowUpTask as FollowUpTaskSchema
from app.schemas.ai import AIFlagResponse
from app.schemas.document import DocumentResponse
from app.security.auth import get_current_active_user, require_role
from app.security.rbac import require_patient_access

router = APIRouter(prefix="/patients", tags=["patients"])

@router.get("", response_model=List[PatientProfileResponse])
def list_patients(db: Session = Depends(get_db), current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.CLINICIAN))):
    if current_user.role == UserRole.ADMIN:
        return db.query(PatientProfile).all()
    # If clinician, only return accessible patients
    # Simplified for now
    return db.query(PatientProfile).all()

@router.get("/{patient_id}", response_model=PatientProfileResponse)
def get_patient(patient_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    require_patient_access(patient_id, current_user, db)
    patient = db.query(PatientProfile).filter(PatientProfile.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.patch("/{patient_id}", response_model=PatientProfileResponse)
def update_patient(patient_id: UUID, profile_in: PatientProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    require_patient_access(patient_id, current_user, db)
    patient = db.query(PatientProfile).filter(PatientProfile.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    update_data = profile_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(patient, key, value)
        
    db.commit()
    db.refresh(patient)
    return patient

@router.get("/{patient_id}/timeline")
def get_timeline(patient_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    require_patient_access(patient_id, current_user, db)
    events = db.query(PatientTimelineEvent).filter(PatientTimelineEvent.patient_id == patient_id).order_by(PatientTimelineEvent.event_date.desc()).all()
    return events

@router.get("/{patient_id}/medications", response_model=List[MedicationSchema])
def get_medications(patient_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    require_patient_access(patient_id, current_user, db)
    return db.query(Medication).filter(Medication.patient_id == patient_id).all()

@router.get("/{patient_id}/lab-results", response_model=List[LabResultSchema])
def get_lab_results(patient_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    require_patient_access(patient_id, current_user, db)
    return db.query(LabResult).filter(LabResult.patient_id == patient_id).all()

@router.get("/{patient_id}/diagnoses", response_model=List[DiagnosisSchema])
def get_diagnoses(patient_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    require_patient_access(patient_id, current_user, db)
    return db.query(Diagnosis).filter(Diagnosis.patient_id == patient_id).all()

@router.get("/{patient_id}/follow-ups", response_model=List[FollowUpTaskSchema])
def get_follow_ups(patient_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    require_patient_access(patient_id, current_user, db)
    return db.query(FollowUpTask).filter(FollowUpTask.patient_id == patient_id).all()

@router.get("/{patient_id}/flags", response_model=List[AIFlagResponse])
def get_flags(patient_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    require_patient_access(patient_id, current_user, db)
    return db.query(AIFlag).filter(AIFlag.patient_id == patient_id).all()

@router.get("/{patient_id}/documents", response_model=List[DocumentResponse])
def get_documents(patient_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    require_patient_access(patient_id, current_user, db)
    return db.query(Document).filter(Document.patient_id == patient_id).all()
