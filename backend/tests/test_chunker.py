import pytest
from app.ingestion.chunker import TextChunker


def test_chunker_metadata_and_size():
    chunker = TextChunker(target_chunk_tokens=500, overlap_pct=0.12)
    sample_text = "Esta es una oración sobre la materia de programación. " * 100

    chunks = chunker.chunk_document(
        text=sample_text,
        career="CI013_CIENCIAS_DE_LA_COMPUTACION",
        course_name="Fundamentos de Programación",
        course_code="CCPG1043",
        document_type="syllabus",
        s3_uri="s3://bucket/careers/CI013/CCPG1043.pdf",
    )

    assert len(chunks) > 0

    for chunk in chunks:
        # Mandatory Metadata Check
        assert chunk["career"] == "CI013_CIENCIAS_DE_LA_COMPUTACION"
        assert chunk["course_name"] == "Fundamentos de Programación"
        assert chunk["course_code"] == "CCPG1043"
        assert chunk["document_type"] == "syllabus"
        assert chunk["s3_uri"] == "s3://bucket/careers/CI013/CCPG1043.pdf"
        assert "chunk_id" in chunk
        assert "[Carrera: CI013_CIENCIAS_DE_LA_COMPUTACION | Materia: Fundamentos de Programación" in chunk["text"]


def test_chunker_overlap():
    chunker = TextChunker(target_chunk_tokens=300, overlap_pct=0.15)
    # Generate distinct numbered paragraphs
    paragraphs = [f"Párrafo {i}: " + "Palabra " * 50 for i in range(10)]
    text = "\n\n".join(paragraphs)

    chunks = chunker.chunk_document(
        text=text,
        career="LI004_DISENO_INDUSTRIAL",
        course_name="Diseño I",
    )

    assert len(chunks) >= 2
    # Verify overlap exists between consecutive chunks
    first_chunk_text = chunks[0]["raw_text"]
    second_chunk_text = chunks[1]["raw_text"]

    first_words = set(first_chunk_text.split())
    second_words = set(second_chunk_text.split())

    common_words = first_words.intersection(second_words)
    assert len(common_words) > 0, "Chunks must share overlap words according to 10-15% overlap rule"
