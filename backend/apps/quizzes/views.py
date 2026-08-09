from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Quiz, Result
from .serializers import QuizSerializer, ResultSerializer

class QuizListView(generics.ListCreateAPIView):
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Quiz.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # The actual generation logic will be handled by CrewAI Celery task
        serializer.save(user=self.request.user)

class QuizDetailView(generics.RetrieveAPIView):
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Quiz.objects.filter(user=self.request.user)

class QuizSubmitView(generics.CreateAPIView):
    serializer_class = ResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # Implementation for taking answers and triggering AI evaluation
        return Response({'status': 'evaluation pending'}, status=status.HTTP_202_ACCEPTED)
