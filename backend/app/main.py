from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.core.logging import logger
from app.core.rate_limit import RateLimitMiddleware
from app.api.v1 import query, careers, ingest

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for frontend integrations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enable Rate Limiting
app.add_middleware(RateLimitMiddleware, max_requests=settings.RATE_LIMIT_PER_MINUTE)

# Include API v1 Routers
app.include_router(query.router, prefix=settings.API_V1_STR, tags=["Query"])
app.include_router(careers.router, prefix=settings.API_V1_STR, tags=["Careers"])
app.include_router(ingest.router, prefix=settings.API_V1_STR, tags=["Ingestion"])


@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint for AWS Lambda target group & monitoring."""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "mode": "local_dev" if settings.LOCAL_DEV_MODE else "production",
    }
