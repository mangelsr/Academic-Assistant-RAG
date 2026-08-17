FROM public.ecr.aws/lambda/python:3.14

# Copy uv package manager binary from official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy project definition and uv lockfile
COPY pyproject.toml uv.lock ${LAMBDA_TASK_ROOT}/

# Install production dependencies using uv into system site-packages
RUN uv pip install --system --no-cache -r ${LAMBDA_TASK_ROOT}/pyproject.toml

# Copy application package
COPY app ${LAMBDA_TASK_ROOT}/app

# Default command for Lambda execution
CMD ["app.lambda_handler.handler"]
