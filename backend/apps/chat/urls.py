from django.urls import path
from .views import ChatSessionListView, ChatSessionDetailView, MessageCreateView

urlpatterns = [
    path('', ChatSessionListView.as_view(), name='chat_list'),
    path('<int:pk>/', ChatSessionDetailView.as_view(), name='chat_detail'),
    path('message/', MessageCreateView.as_view(), name='create_message'),
]
