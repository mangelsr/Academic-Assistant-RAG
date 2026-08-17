import os
from typing import List, Dict, Any, Optional
import boto3
from app.ingestion.pdf_parser import PDFParser
from app.ingestion.chunker import TextChunker
from app.llm.orchestrator import LLMOrchestrator
from app.vectorstore.base import BaseVectorStore
from app.vectorstore.local_store import LocalVectorStore
from app.vectorstore.opensearch_store import OpenSearchVectorStore
from app.config import settings
from app.core.logging import logger


class IngestionPipeline:
    def __init__(self, vector_store: Optional[BaseVectorStore] = None):
        self.chunker = TextChunker()
        self.orchestrator = LLMOrchestrator()
        if vector_store:
            self.vector_store = vector_store
        elif settings.LOCAL_DEV_MODE or not settings.OPENSEARCH_HOST:
            self.vector_store = LocalVectorStore()
        else:
            self.vector_store = OpenSearchVectorStore()

    async def process_pdf_bytes(
        self,
        pdf_bytes: bytes,
        career: str,
        course_name: str,
        course_code: str = "",
        document_type: str = "syllabus",
        s3_uri: str = "",
    ) -> int:
        """Parses a PDF binary buffer, chunks text, generates embeddings, and indexes in vector store."""
        text = PDFParser.extract_text_from_bytes(pdf_bytes)
        if not text.strip():
            logger.warning(f"No extractable text found in PDF for course {course_name}")
            return 0

        chunks = self.chunker.chunk_document(
            text=text,
            career=career,
            course_name=course_name,
            course_code=course_code,
            document_type=document_type,
            s3_uri=s3_uri,
        )

        if not chunks:
            return 0

        embeddings = []
        for chunk in chunks:
            embed = await self.orchestrator.get_embedding(chunk["text"])
            embeddings.append(embed)

        indexed_count = await self.vector_store.index_documents(chunks, embeddings)
        logger.info(
            f"Successfully ingested {indexed_count}/{len(chunks)} chunks for {course_name} ({career})"
        )
        return indexed_count

    async def process_local_directory(self, career_dir: str, career_name: str) -> Dict[str, Any]:
        """Ingests all PDFs inside a local career directory structure."""
        processed_docs = 0
        total_chunks = 0

        if not os.path.exists(career_dir):
            return {
                "processed_documents": 0,
                "generated_chunks": 0,
                "status": "ERROR",
                "message": f"Directory {career_dir} does not exist",
            }

        for root, _, files in os.walk(career_dir):
            for file in files:
                if file.endswith(".pdf"):
                    file_path = os.path.join(root, file)
                    course_name = os.path.basename(os.path.dirname(file_path)) or file.replace(".pdf", "")
                    doc_type = "syllabus" if "syllabus" in file.lower() else "contenidocurso"

                    with open(file_path, "rb") as f:
                        pdf_bytes = f.read()

                    count = await self.process_pdf_bytes(
                        pdf_bytes=pdf_bytes,
                        career=career_name,
                        course_name=course_name,
                        document_type=doc_type,
                        s3_uri=f"file://{file_path}",
                    )
                    if count > 0:
                        processed_docs += 1
                        total_chunks += count

        return {
            "processed_documents": processed_docs,
            "generated_chunks": total_chunks,
            "status": "SUCCESS",
            "message": f"Processed {processed_docs} documents with {total_chunks} chunks for {career_name}",
        }
