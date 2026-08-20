import uuid
from datetime import date, datetime
from sqlalchemy import Column, String, Date, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.database import Base

class PatientTimelineEvent(Base):
    __tablename__ = "patient_timeline_events"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(PGUUID(as_uuid=True), ForeignKey("patient_profiles.id"), nullable=False)
    event_date = Column(Date, nullable=False)
    event_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    entity_type = Column(String, nullable=True)
    entity_id = Column(PGUUID(as_uuid=True), nullable=True)
    document_id = Column(PGUUID(as_uuid=True), nullable=True)
    source = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
