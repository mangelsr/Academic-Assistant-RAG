import pytest
import numpy as np
from app.vectorstore.local_store import LocalVectorStore


@pytest.mark.asyncio
async def test_local_vectorstore_career_isolation():
    store = LocalVectorStore(storage_path=None)

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
    store = LocalVectorStore(storage_path=None)
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


@pytest.mark.asyncio
async def test_local_vectorstore_persistence(tmp_path):
    json_file = str(tmp_path / "test_vector_store.json")
    store1 = LocalVectorStore(storage_path=json_file)

    chunks = [
        {
            "chunk_id": "p1",
            "text": "Inteligencia Artificial y Aprendizaje Automático",
            "career": "CI013",
            "course_name": "Inteligencia Artificial",
        }
    ]
    vecs = [[0.5] * 256]
    indexed_count = await store1.index_documents(chunks, vecs)
    assert indexed_count == 1

    # Instantiate a NEW store pointing to the same file
    store2 = LocalVectorStore(storage_path=json_file)
    assert len(store2.documents) == 1
    assert store2.documents[0]["chunk_id"] == "p1"

    # Search in store2 -> Should retrieve persisted document
    results = await store2.similarity_search(
        query_vector=vecs[0],
        career="CI013",
        top_k=5,
    )
    assert len(results) == 1
    assert results[0]["chunk_id"] == "p1"

