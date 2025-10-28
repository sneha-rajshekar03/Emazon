# Use Python 3.9 slim image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY api.py .
COPY personalized_payment_data.csv .
COPY payment_predictor_time_aware.pkl .
COPY feature_columns_time_aware.pkl .
COPY label_encoders_time_aware.pkl .
COPY database.py .

# Expose port 5050
EXPOSE 5050

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:5050/health')"

# Run the application on port 5050
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "5050", "--reload"]