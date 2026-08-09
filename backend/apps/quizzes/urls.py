from django.urls import path
from .views import QuizListView, QuizDetailView, QuizSubmitView

urlpatterns = [
    path('', QuizListView.as_view(), name='quiz_list'),
    path('<int:pk>/', QuizDetailView.as_view(), name='quiz_detail'),
    path('<int:pk>/submit/', QuizSubmitView.as_view(), name='quiz_submit'),
]
