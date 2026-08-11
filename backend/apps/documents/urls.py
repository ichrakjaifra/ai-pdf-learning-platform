from django.urls import path
from .views import DocumentListView, DocumentDetailView, GeneratePresignedUrlView, NotifyUploadReadyView

urlpatterns = [
    path('', DocumentListView.as_view(), name='document_list'),
    path('<int:pk>/', DocumentDetailView.as_view(), name='document_detail'),
    path('generate-upload-url/', GeneratePresignedUrlView.as_view(), name='generate_upload_url'),
    path('<int:pk>/notify-ready/', NotifyUploadReadyView.as_view(), name='notify_upload_ready'),
]
