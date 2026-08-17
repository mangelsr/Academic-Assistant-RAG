# Academic Assistant RAG Engine (FastAPI Backend)

FastAPI Python backend powering the **University Academic Assistant**. The engine handles semantic query vectorization, career-scoped similarity search on Amazon OpenSearch Serverless, and grounded answer generation via Amazon Bedrock (Claude 3).

---

## 🚀 Technology Stack

- **Framework**: FastAPI (Python 3.12+)
- **LLM & Embeddings Orchestration**: Amazon Bedrock (`amazon.titan-embed-text-v2:0`, `anthropic.claude-3-haiku-20240307-v1:0`, `anthropic.claude-3-5-sonnet-20240620-v1:0`)
- **Vector Database**: Amazon OpenSearch Serverless / Local In-Memory Store
- **Lambda ASGI Adapter**: Mangum
- **Testing**: Pytest & Httpx

---

## 📡 REST API Endpoints

### 1. Natural Language Academic Query

- **`POST /api/v1/query`**
- **Security**: Optional `X-API-Key` header & Rate Limiting (60 req/min).
- **Request Body**:

  ```json
  {
    "query": "¿Cuáles son los temas evaluados en el primer parcial?",
    "career": "CI013_CIENCIAS_DE_LA_COMPUTACION",
    "top_k": 5,
    "use_complex_model": false
  }
  ```

- **Response**:

  ```json
  {
    "answer": "La evaluación del primer parcial comprende...",
    "career": "CI013_CIENCIAS_DE_LA_COMPUTACION",
    "citations": [
      {
        "course_name": "Estructuras de Datos y Algoritmos II",
        "course_code": "CCPG1014",
        "career": "CI013_CIENCIAS_DE_LA_COMPUTACION",
        "document_type": "syllabus",
        "snippet": "Examen Parcial 1: Listas enlazadas, Árboles AVL y Grafos...",
        "score": 0.942,
        "s3_uri": "s3://espol-academic-syllabi/careers/CI013_CIENCIAS_DE_LA_COMPUTACION/CCPG1014.pdf"
      }
    ],
    "execution_time_ms": 348.5
  }
  ```

### 2. Academic Program / Careers List

- **`GET /api/v1/careers`**
- Returns list of indexed academic programs with course and chunk counts.

### 3. Ingestion Trigger

- **`POST /api/v1/ingest`**
- Ingests and vectorizes syllabus PDFs for a specific career directory.

### 4. Health Check

- **`GET /health`**
- Target group monitoring endpoint returning system status and mode (`local_dev` vs `production`).

---

## 💻 Local Development Setup

### 1. Environment Setup

```bash
# Create and activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Run Development Server

```bash
# Set LOCAL_DEV_MODE=true to run with LocalVectorStore (no OpenSearch credentials needed)
LOCAL_DEV_MODE=true uvicorn app.main:app --reload --port 8000
```

Swagger API Documentation will be available at: `http://localhost:8000/docs`

### 3. Run Unit Tests

```bash
pytest
```

---

## 🐳 Docker & Lambda Deployment

The application is containerized using `Dockerfile` for execution inside AWS Lambda target groups:

```bash
docker build -t academic-assistant-backend .
docker run -p 8000:8000 -e LOCAL_DEV_MODE=true academic-assistant-backend
```
