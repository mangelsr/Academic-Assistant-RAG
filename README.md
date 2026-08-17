# University Academic Assistant (Serverless RAG)

[![AWS Bedrock](https://img.shields.io/badge/AWS-Bedrock-orange.svg)](https://aws.amazon.com/bedrock/)
[![OpenSearch](https://img.shields.io/badge/AWS-OpenSearch_Serverless-blue.svg)](https://aws.amazon.com/opensearch-service/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![Angular](https://img.shields.io/badge/Angular-19+-DD0031.svg)](https://angular.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-10+-F69220.svg)](https://pnpm.io/)

The **University Academic Assistant** is a high-performance, Retrieval-Augmented Generation (RAG) system designed to answer student queries using official university syllabi and academic program content. The system leverages an AWS serverless architecture to ensure high availability, cost-efficiency, and strict metadata-isolated vector search across academic degree programs.

---

## 🏗️ System Architecture

```mermaid
graph TD
    User([Student / User]) -->|HTTPS| CloudFront[Amazon CloudFront CDN]
    CloudFront --> S3Frontend[S3 Static Website Hosting\n(Angular SPA)]
    
    User -->|API Requests| APIGateway[Amazon API Gateway]
    APIGateway --> LambdaQuery[Query Lambda Function\nFastAPI + Mangum]
    
    LambdaQuery -->|Embed Query| BedrockEmbed[Amazon Bedrock\nTitan Text Embeddings v2]
    LambdaQuery -->|Vector Similarity Search\n(where: career)| OpenSearch[Amazon OpenSearch Serverless\nVector Store]
    LambdaQuery -->|Grounded Prompt| BedrockLLM[Amazon Bedrock\nClaude 3 Haiku / Claude 3.5 Sonnet]
    
    subgraph Ingestion Pipeline
        Scraper[Playwright Scraper\nNode.js] -->|Upload Syllabi PDFs| S3Storage[S3 Syllabi Bucket]
        S3Storage -->|s3:ObjectCreated:Put| LambdaIngest[Ingestion Lambda Function]
        LambdaIngest -->|Vectorize Chunks| BedrockEmbed
        LambdaIngest -->|Index Vectors + Metadata| OpenSearch
    end
```

### Key Architectural Highlights

- **Front-End Single Page Application**: Angular 19+ built with **Angular Signals** for reactive state management, Tailwind CSS for dark-mode glassmorphism UI, RxJS observables, and Lucide icons. Package management handled via **`pnpm`**.
- **Query Pipeline**: FastAPI backend packaged via Mangum for AWS Lambda execution. Converts user prompts into embeddings, queries Amazon OpenSearch Serverless with strict career-scoped metadata filtering (`where={"career": user_selected_career}`), and generates grounded answers via Amazon Bedrock (Claude 3).
- **Automated Ingestion**: Containerized Node.js/Playwright scrapers download syllabus PDFs per degree program into S3, triggering an automated Lambda parsing, chunking (500–1000 tokens), vectorization, and indexing pipeline.

---

## 📁 Repository Structure

```
academic-assistant-rag/
├── academic_assistant_rag_spec.md # Technical specification & system requirements
├── serverless.yml                  # Serverless Framework IAC deployment manifest
├── docker-compose.yml              # Local development container orchestration
├── README.md                       # Main repository documentation
│
├── frontend/                       # Angular SPA Web Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── rag-chat/          # Main chat view & parameter controls
│   │   │   │   ├── program-selector/  # Degree program selector with Signals
│   │   │   │   └── citation-cards/    # Source attribution cards with scores
│   │   │   ├── services/
│   │   │   │   ├── api.service.ts     # HttpClient REST wrapper
│   │   │   │   └── program-state.ts   # Angular Signals reactive state
│   │   │   └── pipes/
│   │   │       └── markdown.pipe.ts   # DomSanitizer protected Markdown pipe
│   │   ├── environments/              # Dev and Prod API endpoint configs
│   │   └── styles.scss                # Tailwind CSS styling tokens
│   ├── angular.json                   # Angular CLI configuration (pnpm manager)
│   ├── package.json                   # Dependencies and scripts (pnpm@10.4.0)
│   └── pnpm-lock.yaml                 # Lockfile
│
├── backend/                        # FastAPI Python RAG Engine
│   ├── app/
│   │   ├── api/v1/                    # REST routers (/query, /careers, /ingest)
│   │   ├── core/                      # Rate limiting, security, logging
│   │   ├── llm/                       # Amazon Bedrock orchestrator
│   │   ├── vectorstore/               # OpenSearch Serverless & LocalStore
│   │   └── lambda_handler.py          # ASGI Lambda adapter (Mangum)
│   ├── tests/                         # Pytest unit & integration test suite
│   ├── pyproject.toml                 # Python project configuration
│   └── Dockerfile                     # Lambda ECR container image definition
│
└── academic-scraper/               # Syllabus Data Ingestion Scraper
    ├── index.js                       # Playwright automation script
    └── package.json                   # Scraper dependencies
```

---

## 🚀 Getting Started

### Quick Start (One Command)

To launch both the FastAPI backend and Angular frontend services concurrently:

```bash
chmod +x start.sh
./start.sh
```

**Options:**

- `./start.sh --docker` : Run backend via Docker Compose and frontend locally.
- `./start.sh --backend-only` : Start only the FastAPI Python backend.
- `./start.sh --frontend-only` : Start only the Angular SPA frontend.
- `./start.sh --install` : Force reinstall virtualenv and node_modules dependencies.

---

### Prerequisites

- **Node.js**: `v24.x` or `v20.x`
- **pnpm**: `v10.x` (`corepack enable` or `npm i -g pnpm`)
- **Python**: `3.12+`
- **AWS CLI & Serverless Framework**: (Optional, for AWS deployments)

---

### 1. Running the Backend Locally

```bash
cd backend

# Create virtual environment and install dependencies
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start FastAPI development server (Local Dev Mode defaults to LocalVectorStore)
LOCAL_DEV_MODE=true uvicorn app.main:app --reload --port 8000
```

- API Documentation available at: `http://localhost:8000/docs`
- Health check endpoint: `http://localhost:8000/health`

#### Running Backend Tests

```bash
pytest
```

---

### 2. Running the Frontend Locally

```bash
cd frontend

# Install dependencies using pnpm
pnpm install

# Start Angular development server
pnpm start
```

- Open browser at `http://localhost:4200` to interact with the RAG interface.

#### Building Frontend for Production

```bash
pnpm build
```

Production assets are generated in `frontend/dist/frontend`.

---

### 3. Running the Academic Syllabus Scraper

```bash
cd academic-scraper
npm install
node index.js
```

---

## ☁️ Deployment

The infrastructure is defined using Serverless Framework in `serverless.yml`.

```bash
# Build Lambda Docker container and deploy AWS resources
sls deploy --stage prod
```

### Resources Provisioned

- **Amazon S3**: Syllabi storage bucket (`s3://espol-academic-syllabi-*`) and Angular SPA static web hosting bucket.
- **Amazon OpenSearch Serverless**: Vector collection (`espol-syllabi-vectors`) with encryption and network policies.
- **AWS Lambda**: Containerized Ingestion Lambda and FastAPI Query Lambda.
- **Amazon CloudFront**: Global CDN distribution with Origin Access Control (OAC).

---

## 🛡️ Security & Access Control

- **DOM Sanitization**: Angular `DomSanitizer` guarantees sanitization of LLM responses and syllabus citations against Cross-Site Scripting (XSS).
- **Metadata Scope Isolation**: API Gateway and OpenSearch queries strictly enforce `career` metadata filtering to eliminate syllabus cross-contamination.
- **API Protection**: Optional `X-API-Key` headers and Rate Limiting middleware (`RateLimitMiddleware`).

---

## 📄 License

This project is licensed under the MIT License.
