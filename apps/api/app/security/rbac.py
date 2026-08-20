from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.clinician import PatientClinicianAccess
from app.models.patient import PatientProfile

def require_patient_access(patient_id: UUID, current_user: User, db: Session) -> bool:
    if current_user.role == UserRole.ADMIN:
        return True
        
    if current_user.role == UserRole.PATIENT:
        patient_profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
        if not patient_profile or patient_profile.id != patient_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this patient profile")
        return True
        
    if current_user.role == UserRole.CLINICIAN:
        return require_clinician_patient_access(patient_id, current_user, db)
        
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

def require_clinician_patient_access(patient_id: UUID, clinician_user: User, db: Session) -> bool:
    clinician_profile = clinician_user.clinician_profile
    if not clinician_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Clinician profile not found")
        
    access = db.query(PatientClinicianAccess).filter(
        PatientClinicianAccess.clinician_id == clinician_profile.id,
        PatientClinicianAccess.patient_id == patient_id,
        PatientClinicianAccess.is_active == True
    ).first()
    
    if not access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this patient")
    return True

def is_admin(user: User) -> bool:
    return user.role == UserRole.ADMIN
