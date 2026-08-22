from rest_framework.views import APIView
from rest_framework import permissions
from rest_framework.response import Response
from apps.documents.models import Document
from apps.chat.models import ChatSession
from apps.quizzes.models import Quiz, Result
from apps.analytics.models import UserConceptAnalysis
from django.utils import timezone
from django.http import HttpResponse
import csv
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


class DashboardStatsView(APIView):
    """
    Returns aggregated dashboard stats for the authenticated user.
    All data is read from the DB — no live AI/LLM calls are made here.
    Weak concept analysis is generated once per quiz submission and cached.
    """
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

        # Calculate Study Streak
        today = timezone.now().date()
        activities = (
            list(Document.objects.filter(user=user).values_list('created_at', flat=True))
            + list(ChatSession.objects.filter(user=user).values_list('updated_at', flat=True))
            + list(Quiz.objects.filter(user=user, completed_at__isnull=False).values_list('completed_at', flat=True))
        )

        # Unique dates sorted descending
        activity_dates = sorted(list(set([a.date() for a in activities])), reverse=True)

        study_streak = 0
        current_date = today

        # If no activity today, check if yesterday was active to keep streak alive
        if activity_dates and activity_dates[0] == today:
            for date in activity_dates:
                if date == current_date:
                    study_streak += 1
                    current_date -= timedelta(days=1)
                else:
                    break
        elif activity_dates and activity_dates[0] == today - timedelta(days=1):
            current_date = today - timedelta(days=1)
            for date in activity_dates:
                if date == current_date:
                    study_streak += 1
                    current_date -= timedelta(days=1)
                else:
                    break

        # Read cached weak concepts from DB — set by QuizSubmitView after each quiz
        try:
            analysis = UserConceptAnalysis.objects.get(user=user)
            weak_concepts = analysis.weak_concepts or []
        except UserConceptAnalysis.DoesNotExist:
            weak_concepts = []

        return Response({
            "total_documents": total_documents,
            "total_chats": total_chats,
            "quizzes_passed": quizzes_passed,
            "recent_documents": docs_data,
            "study_streak": study_streak,
            "weak_concepts": weak_concepts,
        })

class ExportReportView(APIView):
    """Generates a CSV report of the user's progress."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="learning_report_{user.username}.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Report for', user.username])
        writer.writerow(['Generated on', timezone.now().strftime("%Y-%m-%d %H:%M:%S")])
        writer.writerow([])
        
        writer.writerow(['Metrics Summary'])
        writer.writerow(['Total Documents', Document.objects.filter(user=user).count()])
        writer.writerow(['Total Chats', ChatSession.objects.filter(user=user).count()])
        writer.writerow(['Quizzes Passed', Quiz.objects.filter(user=user, score__gte=70).count()])
        writer.writerow([])
        
        writer.writerow(['Quiz History'])
        writer.writerow(['Title', 'Scope', 'Difficulty', 'Score', 'Date Completed'])
        
        for quiz in Quiz.objects.filter(user=user).order_by('-completed_at'):
            writer.writerow([
                quiz.title,
                quiz.scope,
                quiz.difficulty,
                f"{quiz.score}%" if quiz.score is not None else "N/A",
                quiz.completed_at.strftime("%Y-%m-%d") if quiz.completed_at else "Incomplete"
            ])
            
        return response
