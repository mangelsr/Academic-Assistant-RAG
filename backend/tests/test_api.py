import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)
AUTH_HEADERS = {"X-API-Key": settings.API_KEY or "espol-secret-api-key"}


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_careers_endpoint():
    response = client.get("/api/v1/careers", headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert "careers" in data
    assert len(data["careers"]) > 0


def test_query_unauthorized():
    response = client.post(
        "/api/v1/query",
        json={"query": "Hola", "career": "CI013"},
    )
    # If API_KEY is set, must return 401
    if settings.API_KEY:
        assert response.status_code == 401


def test_query_endpoint():
    payload = {
        "query": "¿Cuáles son los temas de evaluación?",
        "career": "CI013_CIENCIAS_DE_LA_COMPUTACION",
        "top_k": 3,
    }
    response = client.post("/api/v1/query", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert data["career"] == "CI013_CIENCIAS_DE_LA_COMPUTACION"
    assert "citations" in data
    assert "execution_time_ms" in data


def test_ingest_endpoint():
    payload = {
        "career": "CI013_CIENCIAS_DE_LA_COMPUTACION",
        "local_path": "/tmp/non_existent_folder_test",
    }
    response = client.post("/api/v1/ingest", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["career"] == "CI013_CIENCIAS_DE_LA_COMPUTACION"
    assert "processed_documents" in data
