# System Architecture & Technical Specification

**Project:** University Academic Assistant (Serverless RAG)
**Version:** 1.0

## 1. Executive Summary

The University Academic Assistant is a Retrieval-Augmented Generation (RAG) system designed to answer student queries using official university syllabi and program content. The system leverages an AWS serverless architecture to ensure high availability, scalability during peak academic seasons, and cost-efficiency.

## 2. Technology Stack

* **Data Ingestion (Scraping):** Node.js, Playwright.
* **Backend Framework:** FastAPI (Python).
* **Cloud Provider:** Amazon Web Services (AWS).
* **Compute:** AWS Lambda, Docker (for the ingestion scraper containerization).
* **Storage:** Amazon S3 (Raw PDFs), Amazon OpenSearch Serverless (Vector Database).
* **AI / LLM Orchestration:** Amazon Bedrock.
  * *Embeddings:* `amazon.titan-embed-text-v2:0` or `cohere.embed-multilingual-v3`.
  * *Generation:* `anthropic.claude-3-haiku-20240307-v1:0` (Fast/Standard) or `anthropic.claude-3-5-sonnet-20240620-v1:0` (Complex reasoning).
* **Process Management:** PM2 (for isolated scraper deployments) / Docker.

## 3. System Architecture

### 3.1. Automated Ingestion Pipeline

The ingestion process is handled programmatically, isolating the extraction of syllabus data per academic program (career) to ensure accurate metadata tagging and prevent API throttling.

1. **Scraper Execution:** A Node.js/Playwright script navigates the university portal, downloading syllabus PDFs. This script is containerized with Docker or managed via PM2 for consistent background execution.
2. **Structured S3 Upload:** The scraper uploads PDFs to an S3 bucket using a deterministic key structure: `s3://<bucket-name>/careers/<career-name>/<course-name>.pdf`.
3. **Event-Driven Trigger:** The `s3:ObjectCreated:Put` event automatically triggers the **Ingestion Lambda Function**.
4. **Parsing and Chunking:** The Lambda function extracts text from the PDF (preserving structural integrity) and splits it into logical chunks (500-1000 tokens, 10-15% overlap). The `<career-name>` extracted from the S3 prefix is injected as mandatory metadata.
5. **Vectorization:** The Lambda function invokes Amazon Bedrock to generate mathematical embeddings for each chunk.
6. **Indexing:** The vectors and their corresponding metadata are stored in Amazon OpenSearch Serverless.

### 3.2. Query Pipeline

The query pipeline processes student questions in real-time, retrieving contextually relevant syllabus fragments to construct an accurate response.

1. **API Routing:** An Amazon API Gateway exposes RESTful endpoints, routing incoming requests to the **Query Lambda Function**. (The FastAPI application is packaged using an ASGI adapter like Mangum to run seamlessly inside Lambda).
2. **Query Vectorization:** The user's prompt is converted into an embedding using the same Bedrock model used during ingestion.
3. **Semantic Search:** The system queries OpenSearch Serverless. It applies strict metadata filtering (`where={"career": user_selected_career}`) to prevent syllabus collisions between different academic programs.
4. **Prompt Engineering:** The top-K relevant chunks are retrieved and assembled into a strict system prompt to ground the LLM and prevent hallucinations.
5. **Response Generation:** Amazon Bedrock (Claude 3) processes the grounded prompt and returns the natural language response to the user.

## 4. Operational Guidelines

* **Batch Processing:** Scraper execution must remain strictly sequential (career by career) to respect Bedrock's Tokens Per Minute (TPM) and Requests Per Minute (RPM) quotas.
* **Local Development:** The backend stack is designed to be cross-platform, running seamlessly across local developer environments (whether on Garuda Linux workstations with local GPU acceleration via Ollama for testing, or macOS systems utilizing corporate VPNs like Zscaler).
* **Error Handling:** By compartmentalizing the S3 uploads per career, any PDF parsing failures in the Lambda function can be isolated, logged in CloudWatch, and retried without affecting the entire university dataset.

## 5. Security & Access Control

* **IAM Roles:** Lambda functions will operate with the Principle of Least Privilege, strictly limited to reading from specific S3 paths, invoking specific Bedrock models, and writing/reading from the OpenSearch cluster.
* **API Security:** The API Gateway will implement standard rate-limiting and require appropriate API keys or JWT validation depending on the frontend integration.
