from django.urls import path
from .views import QuizListView, QuizDetailView, QuizGenerateView, QuizSubmitView

urlpatterns = [
    path('', QuizListView.as_view(), name='quiz_list'),
    path('generate/', QuizGenerateView.as_view(), name='quiz_generate'),
    path('<int:pk>/', QuizDetailView.as_view(), name='quiz_detail'),
    path('<int:pk>/submit/', QuizSubmitView.as_view(), name='quiz_submit'),
]
