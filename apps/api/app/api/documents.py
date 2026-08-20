from typing import List
from uuid import UUID
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.document import Document, DocumentStatus, DocumentType, DocumentPage
from app.schemas.document import DocumentResponse, DocumentPageResponse
from app.security.auth import get_current_active_user
from app.security.rbac import require_patient_access

router = APIRouter(tags=["documents"])

@router.post("/patients/{patient_id}/documents", response_model=DocumentResponse)
async def upload_document(
    patient_id: UUID,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    document_title: str = Form(None),
    description: str = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    require_patient_access(patient_id, current_user, db)
    
    content = await file.read()
    file_size = len(content)
    
    ext = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
    doc_type = DocumentType.OTHER
    if ext == 'pdf': doc_type = DocumentType.PDF
    elif ext in ['doc', 'docx']: doc_type = DocumentType.DOCX
    elif ext in ['jpg', 'jpeg', 'png']: doc_type = DocumentType.IMAGE
    elif ext == 'txt': doc_type = DocumentType.TXT

    storage_key = f"documents/{patient_id}/{uuid.uuid4()}_{file.filename}"
    
    # Upload to MinIO/S3
    try:
        from app.services.storage import storage_service
        storage_service.upload_file(content, storage_key, file.content_type or "application/octet-stream")
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Storage upload failed (continuing): {e}")
    
    document = Document(
        patient_id=patient_id,
        uploaded_by=current_user.id,
        filename=file.filename,
        original_filename=file.filename,
        document_type=doc_type,
        storage_key=storage_key,
        file_size=file_size,
        status=DocumentStatus.UPLOADED,
        document_title=document_title,
        description=description
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    
    # Trigger background text extraction
    try:
        from app.workers.tasks import process_document_task
        process_document_task.delay(str(document.id))
    except Exception:
        # Inline processing if Celery not available
        import threading
        from app.services.document_processor import document_processor
        from app.models.document import DocumentPage
        def process_inline():
            from app.database import SessionLocal
            db2 = SessionLocal()
            try:
                doc2 = db2.query(Document).filter(Document.id == document.id).first()
                if doc2:
                    doc2.status = DocumentStatus.PROCESSING
                    db2.commit()
                    if doc_type == DocumentType.PDF:
                        pages = document_processor.extract_text_from_pdf(content)
                    elif doc_type == DocumentType.DOCX:
                        pages = document_processor.extract_text_from_docx(content)
                    elif doc_type == DocumentType.TXT:
                        pages = document_processor.extract_text_from_txt(content)
                    else:
                        pages = document_processor.extract_text_from_image(content)
                    for p in pages:
                        db2.add(DocumentPage(document_id=doc2.id, page_number=p["page_number"], content=p["content"]))
                    doc2.page_count = len(pages)
                    doc2.status = DocumentStatus.PROCESSED
                    db2.commit()
            except Exception as ex:
                import logging
                logging.getLogger(__name__).error(f"Inline processing failed: {ex}")
            finally:
                db2.close()
        threading.Thread(target=process_inline, daemon=True).start()
    
    return document

@router.get("/patients/{patient_id}/documents", response_model=List[DocumentResponse])
def list_patient_documents(patient_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    require_patient_access(patient_id, current_user, db)
    return db.query(Document).filter(Document.patient_id == patient_id).all()

@router.get("/documents/{doc_id}", response_model=DocumentResponse)
def get_document(doc_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    document = db.query(Document).filter(Document.id == doc_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    require_patient_access(document.patient_id, current_user, db)
    return document

@router.get("/documents/{doc_id}/pages", response_model=List[DocumentPageResponse])
def get_document_pages(doc_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    document = db.query(Document).filter(Document.id == doc_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    require_patient_access(document.patient_id, current_user, db)
    return db.query(DocumentPage).filter(DocumentPage.document_id == doc_id).order_by(DocumentPage.page_number).all()

@router.delete("/documents/{doc_id}")
def delete_document(doc_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    document = db.query(Document).filter(Document.id == doc_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    require_patient_access(document.patient_id, current_user, db)
    db.delete(document)
    db.commit()
    return {"message": "Document deleted"}
