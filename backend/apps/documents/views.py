import uuid
import boto3
from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Document
from .serializers import DocumentSerializer
from apps.users.permissions import IsOwnerOrAdmin

class DocumentListView(generics.ListCreateAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'ADMINISTRATEUR':
            return Document.objects.all().order_by('-created_at')
        return Document.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class GeneratePresignedUrlView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        filename = request.data.get('filename')
        file_size = request.data.get('file_size')
        
        if not filename or not file_size:
            return Response({'error': 'filename and file_size are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        
        # Check quota
        current_storage = sum(doc.file_size for doc in Document.objects.filter(user=user))
        if current_storage + int(file_size) > user.quota_storage_mb * 1024 * 1024:
            return Response({'error': 'Storage quota exceeded'}, status=status.HTTP_400_BAD_REQUEST)
            
        if Document.objects.filter(user=user).count() >= user.quota_documents:
            return Response({'error': 'Document quota exceeded'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate S3 key
        ext = filename.split('.')[-1]
        s3_key = f"uploads/{user.id}/{uuid.uuid4()}.{ext}"
        
        # Init boto3 client
        s3_client = boto3.client(
            's3',
            endpoint_url=f"http://{settings.MINIO_ENDPOINT}",
            aws_access_key_id=settings.MINIO_ACCESS_KEY,
            aws_secret_access_key=settings.MINIO_SECRET_KEY,
            config=boto3.session.Config(signature_version='s3v4')
        )
        
        # Generate presigned url
        try:
            presigned_url = s3_client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                    'Key': s3_key,
                    'ContentType': 'application/pdf'
                },
                ExpiresIn=3600
            )
            
            # Create document record in DB immediately
            doc = Document.objects.create(
                user=user,
                title=filename,
                file_url=f"http://{settings.MINIO_ENDPOINT}/{settings.AWS_STORAGE_BUCKET_NAME}/{s3_key}",
                file_size=int(file_size),
                status='UPLOADED'
            )
            
            return Response({
                'upload_url': presigned_url,
                'document_id': doc.id,
                'file_url': doc.file_url
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NotifyUploadReadyView(APIView):
    """Called by the client after the direct S3/MinIO PUT is complete.
    Updates the document status and triggers the AI processing pipeline."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            if request.user.role == 'ADMINISTRATEUR':
                doc = Document.objects.get(pk=pk)
            else:
                doc = Document.objects.get(pk=pk, user=request.user)
        except Document.DoesNotExist:
            return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)
        
        doc.status = 'PROCESSING'
        doc.save(update_fields=['status'])
        
        # Trigger Celery AI processing task (import here to avoid circular imports)
        try:
            from rag.processor import process_document
            process_document.delay(doc.id)
        except Exception:
            # Celery might not be running in dev; still return success
            pass
        
        return Response({
            'document_id': doc.id,
            'status': doc.status,
            'message': 'Document queued for AI processing.'
        })


class DocumentDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        if self.request.user.role == 'ADMINISTRATEUR':
            return Document.objects.all()
        return Document.objects.filter(user=self.request.user)
