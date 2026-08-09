import os
import tempfile
import urllib.request
import pdfplumber
import pytesseract
from sentence_transformers import SentenceTransformer
from django.conf import settings
from apps.documents.models import Document, Chunk
from celery import shared_task

# Initialize embedding model locally
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

def extract_text_from_pdf(file_path):
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
            else:
                # Fallback to OCR if no text found (e.g. scanned image)
                try:
                    img = page.to_image().original
                    text += pytesseract.image_to_string(img) + "\n"
                except Exception as e:
                    print(f"OCR failed for page: {e}")
    return text

def chunk_text(text, chunk_size=1000, overlap=200):
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks

@shared_task
def process_document(document_id):
    try:
        doc = Document.objects.get(id=document_id)
        doc.status = 'PROCESSING'
        doc.save()

        # Download file from S3/MinIO
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            urllib.request.urlretrieve(doc.file_url, tmp_file.name)
            
            # Extract text
            text = extract_text_from_pdf(tmp_file.name)
            
            # Chunking
            chunks = chunk_text(text)
            
            # Embeddings & Saving
            for i, chunk_text_content in enumerate(chunks):
                # all-MiniLM-L6-v2 produces 384-dimensional embeddings
                embedding = embedding_model.encode(chunk_text_content).tolist()
                
                Chunk.objects.create(
                    document=doc,
                    page_number=i+1, # Simplified page tracking for chunks
                    content=chunk_text_content,
                    embedding=embedding
                )
                
        doc.status = 'READY'
        doc.save()
        
    except Exception as e:
        doc = Document.objects.get(id=document_id)
        doc.status = 'FAILED'
        doc.error_message = str(e)
        doc.save()
