import os
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import IngestRequest, IngestResponse
from app.api.v1.query import get_vector_store
from app.vectorstore.base import BaseVectorStore
from app.ingestion.pipeline import IngestionPipeline
from app.core.security import verify_api_key
from app.core.logging import logger

router = APIRouter()


@router.post("/ingest", response_model=IngestResponse, dependencies=[Depends(verify_api_key)])
async def trigger_ingestion(
    request: IngestRequest,
    vector_store: BaseVectorStore = Depends(get_vector_store),
):
    """Triggers batch processing of PDFs for a specific career program."""
    pipeline = IngestionPipeline(vector_store=vector_store)
    career_name = request.career

    local_path = request.local_path
    if not local_path:
        # Default local download path check
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../academic-scraper/downloads"))
        local_path = os.path.join(base_dir, career_name)

    logger.info(f"[API /ingest] Initiating ingestion for career '{career_name}' at path '{local_path}'")

    result = await pipeline.process_local_directory(career_dir=local_path, career_name=career_name)

    return IngestResponse(
        career=career_name,
        processed_documents=result.get("processed_documents", 0),
        generated_chunks=result.get("generated_chunks", 0),
        indexed_vectors=result.get("generated_chunks", 0),
        status=result.get("status", "SUCCESS"),
        message=result.get("message", "Ingestion trigger finished"),
    )
