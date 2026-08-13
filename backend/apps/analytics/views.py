from rest_framework import generics, permissions
from .models import Notification
from .serializers import NotificationSerializer
from apps.users.permissions import IsOwnerOrAdmin

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'ADMINISTRATEUR':
            return Notification.objects.all().order_by('-created_at')
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

class NotificationUpdateView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        if self.request.user.role == 'ADMINISTRATEUR':
            return Notification.objects.all()
        return Notification.objects.filter(user=self.request.user)
