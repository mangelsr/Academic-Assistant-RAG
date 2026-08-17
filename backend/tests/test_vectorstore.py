import pytest
import numpy as np
from app.vectorstore.local_store import LocalVectorStore


@pytest.mark.asyncio
async def test_local_vectorstore_career_isolation():
    store = LocalVectorStore()

    # Index chunks for Career A (Computación)
    chunks_a = [
        {
            "chunk_id": "c1",
            "text": "Algoritmos y estructuras de datos en Python",
            "raw_text": "Algoritmos y estructuras de datos en Python",
            "career": "CI013_CIENCIAS_DE_LA_COMPUTACION",
            "course_name": "Estructuras de Datos",
        }
    ]
    vec_a = [np.random.randn(256).tolist()]

    # Index chunks for Career B (Diseño Industrial)
    chunks_b = [
        {
            "chunk_id": "c2",
            "text": "Materiales compuestos y ergonomía en diseño",
            "raw_text": "Materiales compuestos y ergonomía en diseño",
            "career": "LI004_DISENO_INDUSTRIAL",
            "course_name": "Diseño de Productos",
        }
    ]
    vec_b = [np.random.randn(256).tolist()]

    await store.index_documents(chunks_a, vec_a)
    await store.index_documents(chunks_b, vec_b)

    # Query with Career A filter -> Must ONLY return Career A chunks
    results_a = await store.similarity_search(
        query_vector=vec_a[0],
        career="CI013_CIENCIAS_DE_LA_COMPUTACION",
        top_k=5,
    )
    assert len(results_a) == 1
    assert results_a[0]["career"] == "CI013_CIENCIAS_DE_LA_COMPUTACION"
    assert results_a[0]["chunk_id"] == "c1"

    # Query with Career B filter -> Must ONLY return Career B chunks
    results_b = await store.similarity_search(
        query_vector=vec_a[0],
        career="LI004_DISENO_INDUSTRIAL",
        top_k=5,
    )
    assert len(results_b) == 1
    assert results_b[0]["career"] == "LI004_DISENO_INDUSTRIAL"
    assert results_b[0]["chunk_id"] == "c2"

    # Query with non-existent Career -> Must return empty list
    results_empty = await store.similarity_search(
        query_vector=vec_a[0],
        career="INEXISTENT_CAREER",
        top_k=5,
    )
    assert len(results_empty) == 0


@pytest.mark.asyncio
async def test_list_careers():
    store = LocalVectorStore()
    chunks = [
        {"chunk_id": "1", "career": "CI013"},
        {"chunk_id": "2", "career": "CI013"},
        {"chunk_id": "3", "career": "LI004"},
    ]
    vecs = [[0.1] * 256 for _ in range(3)]
    await store.index_documents(chunks, vecs)

    careers = await store.list_careers()
    assert len(careers) == 2
    career_map = {c["code"]: c["total_chunks"] for c in careers}
    assert career_map["CI013"] == 2
    assert career_map["LI004"] == 1
