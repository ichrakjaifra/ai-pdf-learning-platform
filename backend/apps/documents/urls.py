from django.urls import path
from .views import DocumentListView, DocumentDetailView, GeneratePresignedUrlView

urlpatterns = [
    path('', DocumentListView.as_view(), name='document_list'),
    path('<int:pk>/', DocumentDetailView.as_view(), name='document_detail'),
    path('generate-upload-url/', GeneratePresignedUrlView.as_view(), name='generate_upload_url'),
]
