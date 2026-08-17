import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "University Academic Assistant (Serverless RAG)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # AWS Configuration
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    S3_BUCKET_NAME: str = os.getenv("S3_BUCKET_NAME", "espol-academic-syllabi-bucket")

    # Amazon OpenSearch Serverless
    OPENSEARCH_HOST: Optional[str] = os.getenv("OPENSEARCH_HOST", None)
    OPENSEARCH_INDEX: str = os.getenv("OPENSEARCH_INDEX", "espol-syllabi-vectors")

    # Bedrock Models
    BEDROCK_EMBEDDING_MODEL_ID: str = os.getenv(
        "BEDROCK_EMBEDDING_MODEL_ID", "amazon.titan-embed-text-v2:0"
    )
    BEDROCK_GENERATION_MODEL_ID: str = os.getenv(
        "BEDROCK_GENERATION_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0"
    )
    BEDROCK_COMPLEX_MODEL_ID: str = os.getenv(
        "BEDROCK_COMPLEX_MODEL_ID", "anthropic.claude-3-5-sonnet-20240620-v1:0"
    )

    # Local Development & Fallbacks
    LOCAL_DEV_MODE: bool = os.getenv("LOCAL_DEV_MODE", "true").lower() == "true"
    LOCAL_STORAGE_PATH: str = os.getenv("LOCAL_STORAGE_PATH", "data/local_vector_store.json")
    OLLAMA_ENDPOINT: str = os.getenv("OLLAMA_ENDPOINT", "http://localhost:11434")
    OLLAMA_EMBED_MODEL: str = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
    OLLAMA_GEN_MODEL: str = os.getenv("OLLAMA_GEN_MODEL", "llama3")

    # Rate Limiting & Auth
    API_KEY: Optional[str] = os.getenv("API_KEY", "espol-secret-api-key")
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")


settings = Settings()
