from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('APPRENANT', 'Apprenant'),
        ('ADMINISTRATEUR', 'Administrateur'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='APPRENANT')
    quota_documents = models.IntegerField(default=50) # max number of documents
    quota_storage_mb = models.IntegerField(default=500) # max storage in MB
    
    def __str__(self):
        return f"{self.email} ({self.role})"
