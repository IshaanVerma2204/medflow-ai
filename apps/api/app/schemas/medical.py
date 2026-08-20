from typing import Optional, Any, Dict
from uuid import UUID
from datetime import date, datetime
from pydantic import BaseModel

class Medication(BaseModel):
    id: UUID
    patient_id: UUID
    document_id: Optional[UUID] = None
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    route: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    prescriber: Optional[str] = None
    status: str
    source_text: Optional[str] = None
    confidence: Optional[float] = None
    is_current: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Diagnosis(BaseModel):
    id: UUID
    patient_id: UUID
    document_id: Optional[UUID] = None
    name: str
    icd_code: Optional[str] = None
    diagnosed_date: Optional[date] = None
    status: str
    severity: Optional[str] = None
    diagnosing_doctor: Optional[str] = None
    source_text: Optional[str] = None
    confidence: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LabResult(BaseModel):
    id: UUID
    patient_id: UUID
    document_id: Optional[UUID] = None
    test_name: str
    value: str
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    is_abnormal: Optional[bool] = None
    test_date: Optional[date] = None
    ordering_doctor: Optional[str] = None
    source_text: Optional[str] = None
    confidence: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True

class Appointment(BaseModel):
    id: UUID
    patient_id: UUID
    document_id: Optional[UUID] = None
    appointment_date: Optional[datetime] = None
    doctor_name: Optional[str] = None
    specialty: Optional[str] = None
    location: Optional[str] = None
    purpose: Optional[str] = None
    status: str
    source_text: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FollowUpTask(BaseModel):
    id: UUID
    patient_id: UUID
    document_id: Optional[UUID] = None
    task: str
    task_type: str
    due_date: Optional[date] = None
    priority: str
    status: str
    responsible_role: str
    source_text: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ExtractedEntity(BaseModel):
    id: UUID
    patient_id: UUID
    document_id: UUID
    page_number: Optional[int] = None
    entity_type: str
    entity_value: str
    entity_details: Optional[Dict[str, Any]] = None
    confidence: Optional[float] = None
    is_uncertain: bool
    source_text: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
