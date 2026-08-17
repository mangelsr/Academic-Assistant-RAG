from fastapi import APIRouter, Depends
from app.models.schemas import CareerListResponse, CareerInfo
from app.api.v1.query import get_vector_store
from app.vectorstore.base import BaseVectorStore
from app.core.security import verify_api_key

router = APIRouter()


@router.get("/careers", response_model=CareerListResponse, dependencies=[Depends(verify_api_key)])
async def list_academic_careers(
    vector_store: BaseVectorStore = Depends(get_vector_store),
):
    """Returns available degree programs / careers indexed in the system."""
    raw_careers = await vector_store.list_careers()

    # Pre-populate defaults if store is empty for smooth UI selection
    if not raw_careers:
        raw_careers = [
            {"code": "CI013_CIENCIAS_DE_LA_COMPUTACION", "name": "Ciencias de la Computación", "total_chunks": 0},
            {"code": "LI004_DISENO_INDUSTRIAL", "name": "Diseño Industrial", "total_chunks": 0},
        ]

    career_objects = [
        CareerInfo(
            code=c["code"],
            name=c.get("name", c["code"]),
            total_chunks=c.get("total_chunks", 0),
        )
        for c in raw_careers
    ]

    return CareerListResponse(careers=career_objects)
