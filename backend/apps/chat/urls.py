from django.urls import path
from .views import ChatSessionListView, ChatSessionDetailView, MessageCreateView, MessageClearView

urlpatterns = [
    path('', ChatSessionListView.as_view(), name='chat_list'),
    path('<int:pk>/', ChatSessionDetailView.as_view(), name='chat_detail'),
    path('<int:pk>/messages/', MessageClearView.as_view(), name='clear_messages'),
    path('message/', MessageCreateView.as_view(), name='create_message'),
]
