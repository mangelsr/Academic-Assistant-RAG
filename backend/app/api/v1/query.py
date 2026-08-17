import time
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import QueryRequest, QueryResponse
from app.core.security import verify_api_key
from app.core.logging import logger
from app.llm.orchestrator import LLMOrchestrator
from app.vectorstore.base import BaseVectorStore

router = APIRouter()

# Active vector store instance (shared across app)
_vector_store_instance: BaseVectorStore = None


def get_vector_store() -> BaseVectorStore:
    global _vector_store_instance
    if _vector_store_instance is None:
        from app.config import settings
        from app.vectorstore.local_store import LocalVectorStore
        from app.vectorstore.opensearch_store import OpenSearchVectorStore

        if settings.LOCAL_DEV_MODE or not settings.OPENSEARCH_HOST:
            _vector_store_instance = LocalVectorStore()
        else:
            _vector_store_instance = OpenSearchVectorStore()
    return _vector_store_instance


@router.post("/query", response_model=QueryResponse, dependencies=[Depends(verify_api_key)])
async def query_academic_assistant(
    request: QueryRequest,
    vector_store: BaseVectorStore = Depends(get_vector_store),
):
    """
    Processes student prompt, vectorizes query, performs similarity search
    with strict metadata filtering (where={"career": user_selected_career}),
    assembles grounded prompt, and generates LLM answer.
    """
    start_time = time.time()
    logger.info(f"[API /query] Received prompt for career '{request.career}': {request.query[:50]}...")

    orchestrator = LLMOrchestrator()

    try:
        # 1. Embed query prompt
        query_vector = await orchestrator.get_embedding(request.query)

        # 2. Similarity search with mandatory career filter
        retrieved_chunks = await vector_store.similarity_search(
            query_vector=query_vector,
            career=request.career,
            top_k=request.top_k,
        )

        # 3. Grounded LLM Response Generation
        answer, citations = await orchestrator.generate_grounded_answer(
            query=request.query,
            career=request.career,
            context_chunks=retrieved_chunks,
            use_complex_model=request.use_complex_model,
        )

        latency = (time.time() - start_time) * 1000.0

        return QueryResponse(
            answer=answer,
            career=request.career,
            citations=citations,
            execution_time_ms=round(latency, 2),
        )
    except Exception as e:
        logger.error(f"[API /query] Error processing query: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing query: {str(e)}",
        )
