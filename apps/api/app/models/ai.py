import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Float, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.database import Base

class AIFlag(Base):
    __tablename__ = "ai_flags"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(PGUUID(as_uuid=True), ForeignKey("patient_profiles.id"), nullable=False)
    agent_name = Column(String, nullable=False)
    flag_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    evidence = Column(JSON, nullable=False)
    severity = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    status = Column(String, default="pending")
    requires_human_review = Column(Boolean, default=True)
    reviewed_by = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AgentRun(Base):
    __tablename__ = "agent_runs"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(PGUUID(as_uuid=True), ForeignKey("patient_profiles.id"), nullable=True)
    document_id = Column(PGUUID(as_uuid=True), ForeignKey("documents.id"), nullable=True)
    triggered_by = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    workflow_type = Column(String, nullable=False)
    status = Column(String, nullable=False)
    input_data = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
    error_message = Column(String, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class AgentMessage(Base):
    __tablename__ = "agent_messages"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id = Column(PGUUID(as_uuid=True), ForeignKey("agent_runs.id"), nullable=False)
    agent_name = Column(String, nullable=False)
    message_type = Column(String, nullable=False)
    content = Column(String, nullable=False)
    message_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ToolCall(Base):
    __tablename__ = "tool_calls"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id = Column(PGUUID(as_uuid=True), ForeignKey("agent_runs.id"), nullable=False)
    agent_name = Column(String, nullable=False)
    tool_name = Column(String, nullable=False)
    input_data = Column(JSON, nullable=False)
    output_data = Column(JSON, nullable=True)
    error = Column(String, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    patient_id = Column(PGUUID(as_uuid=True), ForeignKey("patient_profiles.id"), nullable=True)
    run_id = Column(PGUUID(as_uuid=True), ForeignKey("agent_runs.id"), nullable=True)
    agent = Column(String, nullable=True)
    action = Column(String, nullable=False)
    resource_type = Column(String, nullable=True)
    resource_id = Column(PGUUID(as_uuid=True), nullable=True)
    input_summary = Column(String, nullable=True)
    output_summary = Column(String, nullable=True)
    tool_used = Column(String, nullable=True)
    retrieved_sources = Column(JSON, nullable=True)
    confidence = Column(Float, nullable=True)
    human_decision = Column(String, nullable=True)
    final_action = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    notification_type = Column(String, nullable=False)
    related_entity_type = Column(String, nullable=True)
    related_entity_id = Column(PGUUID(as_uuid=True), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
