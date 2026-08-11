from rest_framework.views import APIView
from rest_framework import permissions
from rest_framework.response import Response
from apps.documents.models import Document
from apps.chat.models import ChatSession
from apps.quizzes.models import Quiz


class DashboardStatsView(APIView):
    """Returns aggregated dashboard stats for the authenticated user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        total_documents = Document.objects.filter(user=user).count()
        total_chats = ChatSession.objects.filter(user=user).count()
        # A quiz is "passed" if score >= 70%
        quizzes_passed = Quiz.objects.filter(
            user=user, score__isnull=False, score__gte=70
        ).count()

        # Last 5 documents
        recent_docs = Document.objects.filter(user=user).order_by('-created_at')[:5]
        docs_data = [
            {
                "id": doc.id,
                "title": doc.title,
                "status": doc.status,
                "created_at": doc.created_at.strftime("%b %d, %Y"),
                "file_size": doc.file_size,
            }
            for doc in recent_docs
        ]

        return Response({
            "total_documents": total_documents,
            "total_chats": total_chats,
            "quizzes_passed": quizzes_passed,
            "recent_documents": docs_data,
        })
