from abc import ABC, abstractmethod
from typing import List, Dict, Any


class BaseVectorStore(ABC):
    @abstractmethod
    async def index_documents(
        self, chunks: List[Dict[str, Any]], embeddings: List[List[float]]
    ) -> int:
        """Indexes document chunks along with their vector embeddings."""
        pass

    @abstractmethod
    async def similarity_search(
        self,
        query_vector: List[float],
        career: str,
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Performs vector similarity search.
        MUST enforce strict metadata filtering matching career (where={"career": career}).
        """
        pass

    @abstractmethod
    async def list_careers(self) -> List[Dict[str, Any]]:
        """Lists available career categories indexed in the store."""
        pass
