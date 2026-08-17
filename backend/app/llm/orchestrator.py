from typing import List, Dict, Any, Tuple
from app.config import settings
from app.llm.bedrock_client import BedrockClient
from app.llm.ollama_client import OllamaClient
from app.models.schemas import Citation
from app.core.logging import logger


class LLMOrchestrator:
    def __init__(self):
        self.use_local_dev = settings.LOCAL_DEV_MODE
        self.bedrock = BedrockClient()
        self.ollama = OllamaClient()

    async def get_embedding(self, text: str) -> List[float]:
        """Generates embedding using Bedrock if configured, else fallback to local/Ollama."""
        if not self.use_local_dev:
            try:
                return await self.bedrock.generate_embedding(text)
            except Exception as e:
                logger.warning(f"[Orchestrator] Bedrock embedding failed, using local driver: {e}")

        return await self.ollama.generate_embedding(text)

    async def generate_grounded_answer(
        self,
        query: str,
        career: str,
        context_chunks: List[Dict[str, Any]],
        use_complex_model: bool = False,
    ) -> Tuple[str, List[Citation]]:
        """
        Assembles retrieved top-K syllabus chunks into a strict system prompt to ground the LLM,
        preventing hallucinations and attaching verifiable source citations.
        """
        citations: List[Citation] = []
        context_blocks: List[str] = []

        for idx, chunk in enumerate(context_chunks):
            course_name = chunk.get("course_name", "Desconocido")
            course_code = chunk.get("course_code", "")
            doc_type = chunk.get("document_type", "syllabus")
            text_snippet = chunk.get("raw_text") or chunk.get("text", "")
            score = float(chunk.get("score", 0.0))
            s3_uri = chunk.get("s3_uri")

            context_blocks.append(
                f"--- [FUENTE {idx+1}] ---\n"
                f"Materia: {course_name} ({course_code})\n"
                f"Carrera: {career}\n"
                f"Tipo: {doc_type}\n"
                f"Contenido:\n{text_snippet}\n"
            )

            citations.append(
                Citation(
                    course_name=course_name,
                    course_code=course_code,
                    career=career,
                    document_type=doc_type,
                    snippet=text_snippet[:300] + ("..." if len(text_snippet) > 300 else ""),
                    score=score,
                    s3_uri=s3_uri,
                )
            )

        joined_context = "\n".join(context_blocks) if context_blocks else "No se encontraron documentos relevantes."

        system_prompt = (
            "Eres el Asistente Académico Oficial de la Universidad (ESPOL).\n"
            "Tu objetivo es responder a las preguntas de los estudiantes utilizando ÚNICAMENTE el contexto oficial "
            "de los sílabos proporcionados a continuación.\n\n"
            "REGLAS STRICTAS:\n"
            "1. Responde solo con información explícitamente respaldada por las fuentes adjuntas.\n"
            "2. Si la información no se encuentra en las fuentes, responde: 'No dispongo de información en los sílabos oficiales para responder a esa consulta.'\n"
            "3. Cita las materias y fuentes relevantes al responder.\n"
            "4. Mantén un tono académico, formal y servicial.\n\n"
            f"CONTEXTO OFICIAL REGISTRADO (Carrera: {career}):\n"
            f"{joined_context}"
        )

        user_prompt = f"Consulta del estudiante: {query}"

        model_id = (
            settings.BEDROCK_COMPLEX_MODEL_ID
            if use_complex_model
            else settings.BEDROCK_GENERATION_MODEL_ID
        )

        if not self.use_local_dev:
            try:
                answer = await self.bedrock.generate_text(
                    prompt=user_prompt,
                    system_prompt=system_prompt,
                    model_id=model_id,
                )
                return answer, citations
            except Exception as e:
                logger.warning(f"[Orchestrator] Bedrock text generation failed ({e}), using local driver.")

        answer = await self.ollama.generate_text(
            prompt=user_prompt, system_prompt=system_prompt
        )
        return answer, citations
