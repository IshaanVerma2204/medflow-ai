from app.workers.celery_app import celery_app
from app.database import SessionLocal
from app.services.storage import storage_service
from app.services.document_processor import document_processor
from app.models.document import Document, DocumentStatus, DocumentPage, DocumentType
import traceback
import logging

logger = logging.getLogger(__name__)

@celery_app.task(name="app.workers.tasks.process_document_task")
def process_document_task(document_id: str):
    db = SessionLocal()
    try:
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            logger.error(f"Document {document_id} not found")
            return
            
        document.status = DocumentStatus.PROCESSING
        db.commit()
        
        file_data = storage_service.download_file(document.storage_key)
        
        pages = []
        if document.document_type == DocumentType.PDF:
            pages = document_processor.extract_text_from_pdf(file_data)
        elif document.document_type == DocumentType.DOCX:
            pages = document_processor.extract_text_from_docx(file_data)
        elif document.document_type == DocumentType.TXT:
            pages = document_processor.extract_text_from_txt(file_data)
        elif document.document_type == DocumentType.IMAGE:
            pages = document_processor.extract_text_from_image(file_data)
            
        for page_data in pages:
            doc_page = DocumentPage(
                document_id=document.id,
                page_number=page_data["page_number"],
                content=page_data["content"]
            )
            db.add(doc_page)
            
        document.page_count = len(pages)
        document.status = DocumentStatus.PROCESSED
        db.commit()
        
    except Exception as e:
        logger.error(f"Failed to process document {document_id}: {e}")
        db.rollback()
        if document:
            document.status = DocumentStatus.FAILED
            document.processing_error = str(e)
            db.commit()
    finally:
        db.close()

@celery_app.task(name="app.workers.tasks.analyze_document_task")
def analyze_document_task(document_id: str, run_id: str):
    """Run the full AI analysis workflow for a document."""
    try:
        from app.agents.orchestrator import process_document_workflow
        process_document_workflow(document_id, run_id)
    except Exception as e:
        logger.error(f"analyze_document_task failed for {document_id}: {e}", exc_info=True)
