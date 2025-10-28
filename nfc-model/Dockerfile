FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libgomp1 \
    git \
    git-lfs \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the sentence transformer model to avoid runtime downloads
# This prevents timeout issues when starting the container
RUN mkdir -p /app/database/models && \
    python -c "from sentence_transformers import SentenceTransformer; \
    import os; \
    os.makedirs('/app/database/models', exist_ok=True); \
    print('Downloading sentence transformer model...'); \
    model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2', cache_folder='/app/database/models'); \
    print('Model downloaded successfully!')"

# Copy application code
COPY api.py .
COPY database.py .
COPY init_preferences.py .

# Copy database files
COPY database/ ./database/

# Initialize user preferences file (fix directory issue)
RUN python init_preferences.py

# Set environment variables for better stability
ENV TRANSFORMERS_CACHE=/app/database/models
ENV SENTENCE_TRANSFORMERS_HOME=/app/database/models
ENV HF_HOME=/app/database/models
ENV TOKENIZERS_PARALLELISM=false

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run the application with increased timeout
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000", "--timeout-keep-alive", "300"]