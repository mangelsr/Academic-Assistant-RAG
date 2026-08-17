import json
import os
from typing import List, Dict, Any, Optional
import numpy as np
from app.vectorstore.base import BaseVectorStore
from app.config import settings
from app.core.logging import logger


_DEFAULT_STORAGE = object()


class LocalVectorStore(BaseVectorStore):
    def __init__(self, storage_path: Any = _DEFAULT_STORAGE):
        self.documents: List[Dict[str, Any]] = []
        self.vectors: List[np.ndarray] = []
        if storage_path is _DEFAULT_STORAGE:
            self.storage_path: Optional[str] = settings.LOCAL_STORAGE_PATH
        else:
            self.storage_path = storage_path

        if self.storage_path:
            self._load_from_disk()

    def _load_from_disk(self) -> None:
        if not os.path.exists(self.storage_path):
            return
        try:
            with open(self.storage_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            docs = data.get("documents", [])
            vecs = data.get("vectors", [])

            self.documents = docs
            self.vectors = [np.array(v, dtype=np.float32) for v in vecs]
            logger.info(
                f"[LocalVectorStore] Loaded {len(self.documents)} persisted documents from '{self.storage_path}'"
            )
        except Exception as e:
            logger.error(f"[LocalVectorStore] Failed to load data from '{self.storage_path}': {e}")

    def _save_to_disk(self) -> None:
        if not self.storage_path:
            return
        try:
            dir_name = os.path.dirname(self.storage_path)
            if dir_name:
                os.makedirs(dir_name, exist_ok=True)

            serializable_vectors = [v.tolist() for v in self.vectors]
            payload = {
                "documents": self.documents,
                "vectors": serializable_vectors,
            }

            temp_path = f"{self.storage_path}.tmp"
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)
            os.replace(temp_path, self.storage_path)
            logger.info(f"[LocalVectorStore] Saved {len(self.documents)} documents to '{self.storage_path}'")
        except Exception as e:
            logger.error(f"[LocalVectorStore] Failed to save data to '{self.storage_path}': {e}")

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

        if count > 0:
            self._save_to_disk()

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
