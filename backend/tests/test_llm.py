import pytest
from app.llm.orchestrator import LLMOrchestrator


@pytest.mark.asyncio
async def test_llm_grounded_answer():
    orchestrator = LLMOrchestrator()

    chunks = [
        {
            "chunk_id": "ch1",
            "course_name": "Fundamentos de Programación",
            "course_code": "CCPG1043",
            "document_type": "syllabus",
            "raw_text": "El examen primer parcial abarca Estructuras de Control y Funciones.",
            "score": 0.89,
            "s3_uri": "s3://bucket/careers/CI013/CCPG1043.pdf",
        }
    ]

    answer, citations = await orchestrator.generate_grounded_answer(
        query="¿Qué temas entran en el primer parcial?",
        career="CI013_CIENCIAS_DE_LA_COMPUTACION",
        context_chunks=chunks,
    )

    assert isinstance(answer, str)
    assert len(answer) > 0
    assert len(citations) == 1
    assert citations[0].course_name == "Fundamentos de Programación"
    assert citations[0].course_code == "CCPG1043"
    assert citations[0].score == 0.89
