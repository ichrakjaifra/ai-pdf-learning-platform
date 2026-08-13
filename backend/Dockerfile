FROM python:3.11-slim

# System dependencies (for psycopg2-binary, pdfplumber, pytesseract, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    tesseract-ocr \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (cached layer unless requirements.txt changes)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the source code
COPY . .

# Expose the Django dev server port
EXPOSE 8000

# Default command (overridden in docker-compose for migrations + runserver)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
