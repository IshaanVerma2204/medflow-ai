from typing import Optional, List
from uuid import UUID
from datetime import date, datetime
from pydantic import BaseModel
from app.models.document import DocumentType, DocumentStatus

class DocumentBase(BaseModel):
    document_date: Optional[date] = None
    document_title: Optional[str] = None
    description: Optional[str] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    id: UUID
    patient_id: UUID
    uploaded_by: UUID
    filename: str
    original_filename: str
    document_type: DocumentType
    storage_key: str
    file_size: int
    status: DocumentStatus
    page_count: Optional[int] = None
    processing_error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DocumentPageResponse(BaseModel):
    id: UUID
    document_id: UUID
    page_number: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentChunkResponse(BaseModel):
    id: UUID
    document_id: UUID
    patient_id: UUID
    chunk_index: int
    content: str
    page_number: Optional[int] = None
    section: Optional[str] = None
    token_count: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
