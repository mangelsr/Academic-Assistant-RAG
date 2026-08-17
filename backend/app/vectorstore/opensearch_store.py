from typing import List, Dict, Any, Optional
from opensearchpy import OpenSearch, RequestsHttpConnection, AWSV4SignerAuth
import boto3
from app.vectorstore.base import BaseVectorStore
from app.config import settings
from app.core.logging import logger


class OpenSearchVectorStore(BaseVectorStore):
    def __init__(
        self,
        host: Optional[str] = None,
        index_name: Optional[str] = None,
        region: Optional[str] = None,
    ):
        self.host = host or settings.OPENSEARCH_HOST
        self.index_name = index_name or settings.OPENSEARCH_INDEX
        self.region = region or settings.AWS_REGION
        self.client = self._init_client()

    def _init_client(self) -> Optional[OpenSearch]:
        if not self.host:
            logger.warning("[OpenSearch] No host configured.")
            return None

        try:
            credentials = boto3.Session().get_credentials()
            auth = AWSV4SignerAuth(credentials, self.region, "aoss")

            client = OpenSearch(
                hosts=[{"host": self.host.replace("https://", ""), "port": 443}],
                http_auth=auth,
                use_ssl=True,
                verify_certs=True,
                connection_class=RequestsHttpConnection,
                pool_maxsize=20,
            )
            return client
        except Exception as e:
            logger.error(f"[OpenSearch] Failed to initialize OpenSearch client: {e}")
            return None

    async def index_documents(
        self, chunks: List[Dict[str, Any]], embeddings: List[List[float]]
    ) -> int:
        if not self.client:
            raise RuntimeError("OpenSearch client is not initialized")

        indexed_count = 0
        for chunk, embedding in zip(chunks, embeddings):
            doc = {
                "vector": embedding,
                "text": chunk.get("text", ""),
                "raw_text": chunk.get("raw_text", ""),
                "career": chunk.get("career", ""),
                "course_name": chunk.get("course_name", ""),
                "course_code": chunk.get("course_code", ""),
                "document_type": chunk.get("document_type", "syllabus"),
                "s3_uri": chunk.get("s3_uri", ""),
                "chunk_index": chunk.get("chunk_index", 0),
            }
            try:
                self.client.index(
                    index=self.index_name,
                    id=chunk.get("chunk_id"),
                    body=doc,
                    refresh=True,
                )
                indexed_count += 1
            except Exception as e:
                logger.error(f"[OpenSearch] Error indexing chunk {chunk.get('chunk_id')}: {e}")

        return indexed_count

    async def similarity_search(
        self, query_vector: List[float], career: str, top_k: int = 5
    ) -> List[Dict[str, Any]]:
        if not self.client:
            raise RuntimeError("OpenSearch client is not initialized")

        # OpenSearch Serverless k-NN query with mandatory career metadata filter
        query_body = {
            "size": top_k,
            "query": {
                "bool": {
                    "must": [
                        {
                            "knn": {
                                "vector": {
                                    "vector": query_vector,
                                    "k": top_k,
                                }
                            }
                        }
                    ],
                    "filter": [
                        {"term": {"career.keyword": career}}
                    ],
                }
            },
        }

        response = self.client.search(index=self.index_name, body=query_body)
        hits = response.get("hits", {}).get("hits", [])

        results = []
        for hit in hits:
            source = hit.get("_source", {})
            results.append(
                {
                    "chunk_id": hit.get("_id"),
                    "text": source.get("text"),
                    "raw_text": source.get("raw_text"),
                    "career": source.get("career"),
                    "course_name": source.get("course_name"),
                    "course_code": source.get("course_code"),
                    "document_type": source.get("document_type"),
                    "s3_uri": source.get("s3_uri"),
                    "score": hit.get("_score", 0.0),
                }
            )
        return results

    async def list_careers(self) -> List[Dict[str, Any]]:
        if not self.client:
            return []

        query_body = {
            "size": 0,
            "aggs": {
                "careers": {
                    "terms": {"field": "career.keyword", "size": 100}
                }
            },
        }
        response = self.client.search(index=self.index_name, body=query_body)
        buckets = response.get("aggregations", {}).get("careers", {}).get("buckets", [])

        return [
            {"code": b.get("key"), "name": b.get("key"), "total_chunks": b.get("doc_count")}
            for b in buckets
        ]
