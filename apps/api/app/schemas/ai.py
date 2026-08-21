from typing import Optional, Any, Dict, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

class AIFlagResponse(BaseModel):
    id: UUID
    patient_id: UUID
    agent_name: str
    flag_type: str
    title: str
    description: str
    evidence: Any
    severity: str
    confidence: float
    status: str
    requires_human_review: bool
    reviewed_by: Optional[UUID] = None
    reviewed_at: Optional[datetime] = None
    review_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AgentRun(BaseModel):
    id: UUID
    patient_id: Optional[UUID] = None
    document_id: Optional[UUID] = None
    triggered_by: Optional[UUID] = None
    workflow_type: str
    status: str
    input_data: Optional[Dict[str, Any]] = None
    output_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AgentMessage(BaseModel):
    id: UUID
    run_id: UUID
    agent_name: str
    message_type: str
    content: str
    message_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AuditLog(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    patient_id: Optional[UUID] = None
    run_id: Optional[UUID] = None
    agent: Optional[str] = None
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[UUID] = None
    input_summary: Optional[str] = None
    output_summary: Optional[str] = None
    tool_used: Optional[str] = None
    retrieved_sources: Optional[Dict[str, Any]] = None
    confidence: Optional[float] = None
    human_decision: Optional[str] = None
    final_action: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class Notification(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    message: str
    notification_type: str
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[UUID] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ApprovalRequest(BaseModel):
    notes: Optional[str] = None
