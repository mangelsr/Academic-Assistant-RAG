import uuid
from typing import List, Dict, Any


class TextChunker:
    def __init__(self, target_chunk_tokens: int = 750, overlap_pct: float = 0.12):
        """
        Chunker targeting 500-1000 tokens (default ~750 tokens) with 10-15% overlap (default 12%).
        Assumes approx 1 word = 1.3 tokens (approx 550 words target per chunk).
        """
        self.target_chunk_tokens = target_chunk_tokens
        self.overlap_pct = overlap_pct
        # 1 word ~ 1.33 tokens => target_words = target_tokens / 1.33
        self.target_words = int(target_chunk_tokens / 1.33)
        self.overlap_words = int(self.target_words * overlap_pct)

    def chunk_document(
        self,
        text: str,
        career: str,
        course_name: str,
        course_code: str = "",
        document_type: str = "syllabus",
        s3_uri: str = "",
    ) -> List[Dict[str, Any]]:
        """Splits document text into logical overlapping chunks and attaches mandatory career metadata."""
        if not text or not text.strip():
            return []

        # Split text into paragraphs first to respect structural boundaries
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        
        chunks: List[Dict[str, Any]] = []
        current_words: List[str] = []
        
        for para in paragraphs:
            para_words = para.split()
            current_words.extend(para_words)

            while len(current_words) >= self.target_words:
                chunk_words = current_words[: self.target_words]
                chunk_text = " ".join(chunk_words)

                chunks.append(
                    self._build_chunk_payload(
                        text=chunk_text,
                        career=career,
                        course_name=course_name,
                        course_code=course_code,
                        document_type=document_type,
                        s3_uri=s3_uri,
                        chunk_index=len(chunks),
                    )
                )
                # Slide window retaining overlap_words
                current_words = current_words[self.target_words - self.overlap_words :]

        # Remaining words
        if current_words:
            chunk_text = " ".join(current_words)
            if len(chunk_text) > 30:  # Ignore trivial leftover noise
                chunks.append(
                    self._build_chunk_payload(
                        text=chunk_text,
                        career=career,
                        course_name=course_name,
                        course_code=course_code,
                        document_type=document_type,
                        s3_uri=s3_uri,
                        chunk_index=len(chunks),
                    )
                )

        return chunks

    def _build_chunk_payload(
        self,
        text: str,
        career: str,
        course_name: str,
        course_code: str,
        document_type: str,
        s3_uri: str,
        chunk_index: int,
    ) -> Dict[str, Any]:
        chunk_id = str(uuid.uuid4())
        # Inject structural preamble for high-quality embedding matching
        contextualized_text = (
            f"[Carrera: {career} | Materia: {course_name} | Tipo: {document_type}]\n"
            f"{text}"
        )
        return {
            "chunk_id": chunk_id,
            "text": contextualized_text,
            "raw_text": text,
            "career": career,
            "course_name": course_name,
            "course_code": course_code,
            "document_type": document_type,
            "s3_uri": s3_uri,
            "chunk_index": chunk_index,
        }
