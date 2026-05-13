FROM python:3.12-slim

ARG GIT_COMMIT=unknown
ENV GIT_COMMIT=${GIT_COMMIT}

RUN useradd --create-home --shell /bin/bash --uid 10001 appuser

WORKDIR /app

COPY pyproject.toml README.md alembic.ini MANIFEST.in ./
COPY app ./app
COPY migrations ./migrations

RUN pip install --no-cache-dir . \
    && chown -R appuser:appuser /app

USER appuser

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
