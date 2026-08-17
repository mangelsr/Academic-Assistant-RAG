import pytest
from app.api.v1 import query
from app.vectorstore.local_store import LocalVectorStore


@pytest.fixture(autouse=True)
def isolate_vector_store(tmp_path):
    """Provides a fresh, isolated LocalVectorStore for each test to avoid test cross-contamination."""
    temp_json = str(tmp_path / "test_store.json")
    test_store = LocalVectorStore(storage_path=temp_json)
    query._vector_store_instance = test_store
    yield test_store
    query._vector_store_instance = None
