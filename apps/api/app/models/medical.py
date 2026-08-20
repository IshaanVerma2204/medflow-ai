import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Boolean, Date, DateTime, ForeignKey, Float, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.database import Base

class ExtractedEntity(Base):
    __tablename__ = "extracted_entities"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(PGUUID(as_uuid=True), ForeignKey("patient_profiles.id"), nullable=False)
    document_id = Column(PGUUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    page_number = Column(Integer, nullable=True)
    entity_type = Column(String, nullable=False)
    entity_value = Column(String, nullable=False)
    entity_details = Column(JSON, nullable=True)
    confidence = Column(Float, nullable=True)
    is_uncertain = Column(Boolean, default=False)
    source_text = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Medication(Base):
    __tablename__ = "medications"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(PGUUID(as_uuid=True), ForeignKey("patient_profiles.id"), nullable=False)
    document_id = Column(PGUUID(as_uuid=True), ForeignKey("documents.id"), nullable=True)
    name = Column(String, nullable=False)
    dosage = Column(String, nullable=True)
    frequency = Column(String, nullable=True)
    route = Column(String, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    prescriber = Column(String, nullable=True)
    status = Column(String, nullable=False)
    source_text = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)
    is_current = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Diagnosis(Base):
    __tablename__ = "diagnoses"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(PGUUID(as_uuid=True), ForeignKey("patient_profiles.id"), nullable=False)
    document_id = Column(PGUUID(as_uuid=True), ForeignKey("documents.id"), nullable=True)
    name = Column(String, nullable=False)
    icd_code = Column(String, nullable=True)
    diagnosed_date = Column(Date, nullable=True)
    status = Column(String, nullable=False)
    severity = Column(String, nullable=True)
    diagnosing_doctor = Column(String, nullable=True)
    source_text = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class LabResult(Base):
    __tablename__ = "lab_results"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(PGUUID(as_uuid=True), ForeignKey("patient_profiles.id"), nullable=False)
    document_id = Column(PGUUID(as_uuid=True), ForeignKey("documents.id"), nullable=True)
    test_name = Column(String, nullable=False)
    value = Column(String, nullable=False)
    unit = Column(String, nullable=True)
    reference_range = Column(String, nullable=True)
    is_abnormal = Column(Boolean, nullable=True)
    test_date = Column(Date, nullable=True)
    ordering_doctor = Column(String, nullable=True)
    source_text = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(PGUUID(as_uuid=True), ForeignKey("patient_profiles.id"), nullable=False)
    document_id = Column(PGUUID(as_uuid=True), ForeignKey("documents.id"), nullable=True)
    appointment_date = Column(DateTime, nullable=True)
    doctor_name = Column(String, nullable=True)
    specialty = Column(String, nullable=True)
    location = Column(String, nullable=True)
    purpose = Column(String, nullable=True)
    status = Column(String, nullable=False)
    source_text = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class FollowUpTask(Base):
    __tablename__ = "follow_up_tasks"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(PGUUID(as_uuid=True), ForeignKey("patient_profiles.id"), nullable=False)
    document_id = Column(PGUUID(as_uuid=True), ForeignKey("documents.id"), nullable=True)
    task = Column(String, nullable=False)
    task_type = Column(String, nullable=False)
    due_date = Column(Date, nullable=True)
    priority = Column(String, nullable=False)
    status = Column(String, nullable=False)
    responsible_role = Column(String, nullable=False)
    source_text = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
