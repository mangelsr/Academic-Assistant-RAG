import json
import urllib.parse
import asyncio
import boto3
from mangum import Mangum
from app.main import app
from app.ingestion.pipeline import IngestionPipeline
from app.core.logging import logger

# Mangum handler for AWS API Gateway / Lambda REST requests
handler = Mangum(app, lifespan="off")


def s3_event_handler(event, context):
    """
    Event-Driven Lambda Trigger handler.
    Executed on s3:ObjectCreated:Put event.
    Parses S3 object key s3://<bucket-name>/careers/<career-name>/<course-name>.pdf
    and triggers automated extraction, chunking, and vector indexing.
    """
    logger.info(f"[Lambda S3 Event] Processing event: {json.dumps(event)}")
    s3_client = boto3.client("s3")
    pipeline = IngestionPipeline()

    results = []

    for record in event.get("Records", []):
        bucket = record["s3"]["bucket"]["name"]
        key = urllib.parse.unquote_plus(record["s3"]["object"]["key"], encoding="utf-8")

        logger.info(f"[Lambda S3 Event] Handling S3 Object s3://{bucket}/{key}")

        # Expected S3 Key format: careers/<career-name>/<course-name>.pdf
        key_parts = key.split("/")
        if len(key_parts) < 3 or key_parts[0] != "careers":
            logger.warning(f"Ignored S3 key format: {key}. Expected: careers/<career-name>/<course-name>.pdf")
            continue

        career_name = key_parts[1]
        filename = key_parts[-1]
        course_name = filename.replace(".pdf", "")
        doc_type = "syllabus" if "syllabus" in filename.lower() else "contenidocurso"

        try:
            response = s3_client.get_object(Bucket=bucket, Key=key)
            pdf_bytes = response["Body"].read()

            loop = asyncio.get_event_loop()
            if loop.is_running():
                indexed_count = loop.run_until_complete(
                    pipeline.process_pdf_bytes(
                        pdf_bytes=pdf_bytes,
                        career=career_name,
                        course_name=course_name,
                        document_type=doc_type,
                        s3_uri=f"s3://{bucket}/{key}",
                    )
                )
            else:
                indexed_count = asyncio.run(
                    pipeline.process_pdf_bytes(
                        pdf_bytes=pdf_bytes,
                        career=career_name,
                        course_name=course_name,
                        document_type=doc_type,
                        s3_uri=f"s3://{bucket}/{key}",
                    )
                )

            results.append({"key": key, "career": career_name, "indexed_chunks": indexed_count})
        except Exception as e:
            logger.error(f"[Lambda S3 Event] Failed to process S3 object {key}: {e}", exc_info=True)
            raise e

    return {"statusCode": 200, "processed_records": len(results), "details": results}
