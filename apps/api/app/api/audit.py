from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.ai import AuditLog, Notification
from app.schemas.ai import AuditLog as AuditLogSchema, Notification as NotificationSchema
from app.security.auth import get_current_active_user, require_role

router = APIRouter(tags=["audit"])

@router.get("/audit-logs", response_model=List[AuditLogSchema])
def get_audit_logs(db: Session = Depends(get_db), current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.CLINICIAN))):
    return db.query(AuditLog).all()

@router.get("/notifications", response_model=List[NotificationSchema])
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).all()

@router.post("/notifications/{notif_id}/read")
def read_notification(notif_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    notification = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == current_user.id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}
