import pytest
from app.lambda_handler import handler, s3_event_handler


def test_mangum_api_gateway_handler():
    # Simulate API Gateway proxy event for /health
    event = {
        "resource": "/health",
        "path": "/health",
        "httpMethod": "GET",
        "headers": {},
        "queryStringParameters": None,
        "pathParameters": None,
        "stageVariables": None,
        "requestContext": {
            "path": "/health",
            "httpMethod": "GET",
            "resourcePath": "/health",
            "identity": {"sourceIp": "127.0.0.1"},
        },
        "body": None,
        "isBase64Encoded": False,
    }
    response = handler(event, None)
    assert response["statusCode"] == 200


def test_s3_event_handler_ignore_invalid_key():
    event = {
        "Records": [
            {
                "s3": {
                    "bucket": {"name": "test-bucket"},
                    "object": {"key": "invalid_folder/file.pdf"},
                }
            }
        ]
    }
    result = s3_event_handler(event, None)
    assert result["statusCode"] == 200
    assert result["processed_records"] == 0
