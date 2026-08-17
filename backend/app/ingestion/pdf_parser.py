import io
from typing import Dict, Any, List
import pypdf
from app.core.logging import logger


class PDFParser:
    @staticmethod
    def extract_text_from_bytes(pdf_bytes: bytes) -> str:
        """Extracts text content from PDF binary buffer preserving page structure."""
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        extracted_pages: List[str] = []

        for page_num, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            if page_text.strip():
                extracted_pages.append(f"--- Página {page_num + 1} ---\n{page_text.strip()}")

        full_text = "\n\n".join(extracted_pages)
        return full_text

    @staticmethod
    def extract_text_from_file(file_path: str) -> str:
        """Extracts text content from a local PDF file path."""
        with open(file_path, "rb") as f:
            return PDFParser.extract_text_from_bytes(f.read())
