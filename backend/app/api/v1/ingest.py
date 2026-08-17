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
        # Resolve path to project root academic-scraper/downloads directory
        # ingest.py is in backend/app/api/v1 -> 4 levels up to root
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../academic-scraper/downloads"))
        candidate = os.path.join(base_dir, career_name)
        
        if os.path.exists(candidate):
            local_path = candidate
        else:
            # Fallback: search for matching directory in downloads (e.g., CI013_Computacion vs CI013_CIENCIAS_DE_LA_COMPUTACION)
            match_found = False
            if os.path.exists(base_dir):
                career_code = career_name.split("_")[0] if "_" in career_name else career_name
                for folder in os.listdir(base_dir):
                    if folder == career_name or folder.startswith(career_code + "_") or folder == career_code:
                        local_path = os.path.join(base_dir, folder)
                        match_found = True
                        break
            if not match_found:
                local_path = candidate

    result = await pipeline.process_local_directory(career_dir=local_path, career_name=career_name)

    return IngestResponse(
        career=career_name,
        processed_documents=result.get("processed_documents", 0),
        generated_chunks=result.get("generated_chunks", 0),
        indexed_vectors=result.get("generated_chunks", 0),
        status=result.get("status", "SUCCESS"),
        message=result.get("message", "Ingestion trigger finished"),
    )
