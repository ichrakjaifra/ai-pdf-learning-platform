from django.urls import path
from .views import NotificationListView, NotificationUpdateView

urlpatterns = [
    path('notifications/', NotificationListView.as_view(), name='notification_list'),
    path('notifications/<int:pk>/', NotificationUpdateView.as_view(), name='notification_update'),
]
