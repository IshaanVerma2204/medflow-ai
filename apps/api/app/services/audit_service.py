from sqlalchemy.orm import Session
from uuid import UUID
from app.models.ai import AuditLog

class AuditService:
    def log(self, db: Session, user_id: UUID = None, patient_id: UUID = None, agent: str = None, action: str = None, **kwargs) -> AuditLog:
        audit_log = AuditLog(
            user_id=user_id,
            patient_id=patient_id,
            agent=agent,
            action=action,
            **kwargs
        )
        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)
        return audit_log

audit_service = AuditService()
