from django.db import models
from django.conf import settings
from pgvector.django import VectorField

class Document(models.Model):
    STATUS_CHOICES = (
        ('UPLOADED', 'Uploaded'),
        ('PROCESSING', 'Processing'),
        ('READY', 'Ready'),
        ('FAILED', 'Failed'),
    )
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=255)
    file_url = models.URLField(max_length=1024)
    file_size = models.IntegerField(help_text="Size in bytes")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='UPLOADED')
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.user.username}"

class Chunk(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='chunks')
    page_number = models.IntegerField()
    content = models.TextField()
    # 384 dimensions for sentence-transformers (all-MiniLM-L6-v2) or adjust based on model used
    embedding = VectorField(dimensions=384, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Chunk {self.id} of {self.document.title}"
