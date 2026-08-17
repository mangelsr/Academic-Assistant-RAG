from typing import List, Optional
from pydantic import BaseModel, Field


class Citation(BaseModel):
    course_name: str = Field(..., description="Name of the course")
    course_code: Optional[str] = Field(None, description="Code of the course")
    career: str = Field(..., description="Academic program / career name")
    document_type: str = Field("syllabus", description="syllabus or contenidocurso")
    snippet: str = Field(..., description="Text excerpt retrieved from OpenSearch")
    score: float = Field(..., description="Vector similarity search score")
    s3_uri: Optional[str] = Field(None, description="Source S3 URI of original PDF")


class QueryRequest(BaseModel):
    query: str = Field(..., json_schema_extra={"example": "¿Cuáles son los temas del primer parcial de Computación?"}, description="Student prompt")
    career: str = Field(..., json_schema_extra={"example": "CI013_CIENCIAS_DE_LA_COMPUTACION"}, description="Mandatory academic program filter")
    top_k: int = Field(5, ge=1, le=20, description="Number of context chunks to retrieve")
    use_complex_model: bool = Field(False, description="Use Claude 3.5 Sonnet instead of Claude 3 Haiku")


class QueryResponse(BaseModel):
    answer: str = Field(..., description="Grounded LLM response")
    career: str = Field(..., description="Career filter applied")
    citations: List[Citation] = Field(default_factory=list, description="Source chunks used in answer")
    execution_time_ms: float = Field(..., description="Response latency in milliseconds")


class CareerInfo(BaseModel):
    code: str
    name: str
    total_courses: int = 0
    total_chunks: int = 0


class CareerListResponse(BaseModel):
    careers: List[CareerInfo]


class IngestRequest(BaseModel):
    career: str = Field(..., description="Target career folder to ingest")
    s3_prefix: Optional[str] = Field(None, description="S3 prefix if downloading from S3")
    local_path: Optional[str] = Field(None, description="Local folder path if ingesting locally")


class IngestResponse(BaseModel):
    career: str
    processed_documents: int
    generated_chunks: int
    indexed_vectors: int
    status: str
    message: str
