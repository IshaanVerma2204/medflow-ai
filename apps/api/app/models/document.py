import uuid
from datetime import datetime, date
from enum import Enum
from sqlalchemy import Column, String, Integer, Date, DateTime, ForeignKey, Enum as SAEnum, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.database import Base

class DocumentStatus(str, Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"

class DocumentType(str, Enum):
    PDF = "pdf"
    DOCX = "docx"
    IMAGE = "image"
    TXT = "txt"
    OTHER = "other"

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(PGUUID(as_uuid=True), ForeignKey("patient_profiles.id"), nullable=False)
    uploaded_by = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    document_type = Column(SAEnum(DocumentType), nullable=False)
    storage_key = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    status = Column(SAEnum(DocumentStatus), default=DocumentStatus.UPLOADED)
    document_date = Column(Date, nullable=True)
    document_title = Column(String, nullable=True)
    description = Column(String, nullable=True)
    page_count = Column(Integer, nullable=True)
    processing_error = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    pages = relationship("DocumentPage", back_populates="document")
    chunks = relationship("DocumentChunk", back_populates="document")

class DocumentPage(Base):
    __tablename__ = "document_pages"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(PGUUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    page_number = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    document = relationship("Document", back_populates="pages")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(PGUUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    patient_id = Column(PGUUID(as_uuid=True), ForeignKey("patient_profiles.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    page_number = Column(Integer, nullable=True)
    section = Column(String, nullable=True)
    embedding = Column(Vector(1536), nullable=True)
    token_count = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    document = relationship("Document", back_populates="chunks")
