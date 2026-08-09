# Smart AI PDF Learning Platform

## Overview
A production-ready AI-powered EdTech SaaS platform that transforms passive PDF reading into an interactive, personalized learning experience using Retrieval-Augmented Generation (RAG) and CrewAI multi-agent system.

## Setup Instructions

### Prerequisites
- Docker and Docker Compose
- Node.js (v18+) and npm
- Python 3.10+
- Git

### 1. Environment Configuration
Copy the `.env.example` to `.env` in the root directory and fill in your Gemini API key.
```bash
cp .env.example .env
```

### 2. Start Infrastructure
Run the following to start PostgreSQL (with pgvector), Redis, and MinIO:
```bash
make start-services
```
_Note: For MinIO, access the console at http://localhost:9001 with `minioadmin`/`minioadmin` and create a bucket named `pdf-documents`. Make sure to set its access policy to public if needed._

### 3. Backend Setup
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### 4. Background Workers
In a separate terminal (with the virtual environment activated):
```bash
cd backend
celery -A ai_platform worker -l info
```

### 5. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Tech Stack
- **Frontend**: Next.js (React), TailwindCSS, Framer Motion
- **Backend**: Django, Django REST Framework, Celery
- **Database**: PostgreSQL with `pgvector`
- **Storage**: MinIO / S3
- **AI / Multi-Agent**: CrewAI, LangChain, Sentence-Transformers, Gemini API
