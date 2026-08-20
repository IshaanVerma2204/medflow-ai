import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.database import Base

class KGNode(Base):
    __tablename__ = "kg_nodes"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(PGUUID(as_uuid=True), ForeignKey("patient_profiles.id"), nullable=True)
    node_type = Column(String, nullable=False)
    label = Column(String, nullable=False)
    properties = Column(JSON, nullable=True)
    entity_id = Column(PGUUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class KGEdge(Base):
    __tablename__ = "kg_edges"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    from_node_id = Column(PGUUID(as_uuid=True), ForeignKey("kg_nodes.id"), nullable=False)
    to_node_id = Column(PGUUID(as_uuid=True), ForeignKey("kg_nodes.id"), nullable=False)
    relationship = Column(String, nullable=False)
    properties = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
