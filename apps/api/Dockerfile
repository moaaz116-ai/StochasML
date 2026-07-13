FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install hatch
RUN pip install hatch

# Copy the ml-engine package and api
COPY packages/ml-engine /app/packages/ml-engine
COPY apps/api /app/apps/api

# Install ML engine as editable/dependency
RUN pip install -e /app/packages/ml-engine[tf]

# Install API dependencies
WORKDIR /app/apps/api
RUN pip install -e .

# Create data directories
RUN mkdir -p /app/data/db /app/data/storage

EXPOSE 8000

# Run uvicorn
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
