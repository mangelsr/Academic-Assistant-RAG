from typing import List, Dict, Any
import numpy as np
from app.vectorstore.base import BaseVectorStore
from app.core.logging import logger


class LocalVectorStore(BaseVectorStore):
    def __init__(self):
        self.documents: List[Dict[str, Any]] = []
        self.vectors: List[np.ndarray] = []

    async def index_documents(
        self, chunks: List[Dict[str, Any]], embeddings: List[List[float]]
    ) -> int:
        count = 0
        for chunk, embedding in zip(chunks, embeddings):
            vec = np.array(embedding, dtype=np.float32)
            # Normalize vector for cosine similarity
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm

            self.documents.append(chunk)
            self.vectors.append(vec)
            count += 1
            
        logger.info(f"[LocalVectorStore] Indexed {count} chunks. Total stored: {len(self.documents)}")
        return count

    async def similarity_search(
        self, query_vector: List[float], career: str, top_k: int = 5
    ) -> List[Dict[str, Any]]:
        if not self.documents or not self.vectors:
            return []

        q_vec = np.array(query_vector, dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)
        if q_norm > 0:
            q_vec = q_vec / q_norm

        # Filter by career metadata FIRST to enforce strict isolation
        filtered_indices = [
            i for i, doc in enumerate(self.documents) if doc.get("career") == career
        ]

        if not filtered_indices:
            return []

        scores = []
        for idx in filtered_indices:
            doc_vec = self.vectors[idx]
            sim = float(np.dot(q_vec, doc_vec))
            scores.append((sim, idx))

        scores.sort(key=lambda x: x[0], reverse=True)
        top_matches = scores[:top_k]

        results = []
        for sim, idx in top_matches:
            doc = self.documents[idx].copy()
            doc["score"] = round(sim, 4)
            results.append(doc)

        return results

    async def list_careers(self) -> List[Dict[str, Any]]:
        career_counts: Dict[str, int] = {}
        for doc in self.documents:
            c = doc.get("career", "UNKNOWN")
            career_counts[c] = career_counts.get(c, 0) + 1

        return [
            {"code": c, "name": c, "total_chunks": count}
            for c, count in career_counts.items()
        ]
