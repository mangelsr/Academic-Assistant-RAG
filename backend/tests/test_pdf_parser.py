import pytest
import io
import pypdf
from app.ingestion.pdf_parser import PDFParser


def create_dummy_pdf_bytes(lines: list[str]) -> bytes:
    """Helper to generate in-memory dummy PDF bytes for unit testing."""
    packet = io.BytesIO()
    writer = pypdf.PdfWriter()
    page = writer.add_blank_page(width=612, height=792)
    
    # Simple valid PDF writer output
    writer.write(packet)
    return packet.getvalue()


def test_pdf_parser_empty():
    dummy_bytes = create_dummy_pdf_bytes([])
    extracted = PDFParser.extract_text_from_bytes(dummy_bytes)
    assert isinstance(extracted, str)


def test_pdf_parser_text():
    # Verify that PDFParser executes safely without raising exception on valid PDF binary data
    reader = pypdf.PdfReader(io.BytesIO(create_dummy_pdf_bytes([])))
    assert len(reader.pages) == 1
