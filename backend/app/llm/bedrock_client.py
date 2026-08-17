import json
from typing import List, Dict, Any, Optional
import boto3
from app.config import settings
from app.core.logging import logger


class BedrockClient:
    def __init__(
        self,
        region: Optional[str] = None,
        embedding_model_id: Optional[str] = None,
        generation_model_id: Optional[str] = None,
    ):
        self.region = region or settings.AWS_REGION
        self.embedding_model_id = (
            embedding_model_id or settings.BEDROCK_EMBEDDING_MODEL_ID
        )
        self.generation_model_id = (
            generation_model_id or settings.BEDROCK_GENERATION_MODEL_ID
        )
        self._client = None

    @property
    def client(self):
        if self._client is None:
            try:
                self._client = boto3.client(
                    service_name="bedrock-runtime", region_name=self.region
                )
            except Exception as e:
                logger.error(f"[Bedrock] Failed to initialize bedrock-runtime client: {e}")
                raise e
        return self._client

    async def generate_embedding(self, text: str) -> List[float]:
        """Generates embedding using Amazon Titan Embeddings V2 or Cohere."""
        if "titan" in self.embedding_model_id.lower():
            body = json.dumps({"inputText": text})
        else:
            # Cohere embed multilingual schema
            body = json.dumps({"texts": [text], "input_type": "search_document"})

        try:
            response = self.client.invoke_model(
                body=body,
                modelId=self.embedding_model_id,
                accept="application/json",
                contentType="application/json",
            )
            response_body = json.loads(response.get("body").read())

            if "embedding" in response_body:
                return response_body["embedding"]
            elif "embeddings" in response_body:
                return response_body["embeddings"][0]
            else:
                raise ValueError(f"Unexpected response format from Bedrock: {response_body}")
        except Exception as e:
            logger.error(f"[Bedrock] Error generating embedding: {e}")
            raise e

    async def generate_text(
        self,
        prompt: str,
        system_prompt: str = "",
        model_id: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.2,
    ) -> str:
        """Generates text response using Anthropic Claude on Bedrock."""
        target_model = model_id or self.generation_model_id

        messages = [{"role": "user", "content": prompt}]
        payload = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": messages,
        }
        if system_prompt:
            payload["system"] = system_prompt

        try:
            response = self.client.invoke_model(
                body=json.dumps(payload),
                modelId=target_model,
                accept="application/json",
                contentType="application/json",
            )
            response_body = json.loads(response.get("body").read())
            content = response_body.get("content", [])
            if content and isinstance(content, list):
                return content[0].get("text", "")
            return ""
        except Exception as e:
            logger.error(f"[Bedrock] Error generating text with model {target_model}: {e}")
            raise e
