import fitz
import docx
import pytesseract
from PIL import Image
import io
from typing import List, Dict
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.document import Document, DocumentPage, DocumentStatus

class DocumentProcessor:
    def extract_text_from_pdf(self, file_data: bytes) -> List[Dict]:
        doc = fitz.open(stream=file_data, filetype="pdf")
        pages = []
        for i in range(len(doc)):
            page = doc.load_page(i)
            text = page.get_text()
            pages.append({"page_number": i + 1, "content": text})
        return pages

    def extract_text_from_docx(self, file_data: bytes) -> List[Dict]:
        doc = docx.Document(io.BytesIO(file_data))
        text = "\n".join([p.text for p in doc.paragraphs])
        return [{"page_number": 1, "content": text}]

    def extract_text_from_txt(self, file_data: bytes) -> List[Dict]:
        text = file_data.decode("utf-8", errors="ignore")
        return [{"page_number": 1, "content": text}]

    def extract_text_from_image(self, file_data: bytes) -> List[Dict]:
        image = Image.open(io.BytesIO(file_data))
        text = pytesseract.image_to_string(image)
        return [{"page_number": 1, "content": text}]

    def process_document(self, document_id: UUID, db: Session) -> None:
        # Stub orchestrator
        pass

document_processor = DocumentProcessor()
