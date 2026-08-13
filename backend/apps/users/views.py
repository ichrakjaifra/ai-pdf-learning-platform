from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from .permissions import IsAdministrateur
from apps.analytics.models import AdminAuditLog, Notification
from django.core.mail import send_mail
from .serializers import UserSerializer, RegisterSerializer

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class UserProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class AdminUserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdministrateur]

class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdministrateur]

    def perform_update(self, serializer):
        user = serializer.save()
        AdminAuditLog.objects.create(
            admin=self.request.user,
            action=f"Updated user {user.username}",
            target_user=user
        )

    def perform_destroy(self, instance):
        AdminAuditLog.objects.create(
            admin=self.request.user,
            action=f"Deleted user {instance.username}",
            target_user=None
        )
        instance.delete()

class AdminSendEmailView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAdministrateur]

    def post(self, request, *args, **kwargs):
        user_id = request.data.get('user_id')
        subject = request.data.get('subject')
        message = request.data.get('message')

        if not all([user_id, subject, message]):
            return Response({'error': 'user_id, subject, and message are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            # Send Email
            send_mail(
                subject,
                message,
                'noreply@ai-pdf-platform.com',
                [target_user.email],
                fail_silently=False,
            )

            # Log to notifications
            Notification.objects.create(
                user=target_user,
                title=subject,
                content=message
            )

            # Log to audit
            AdminAuditLog.objects.create(
                admin=request.user,
                action=f"Sent email: {subject}",
                target_user=target_user,
                details=message
            )
            return Response({'message': 'Email sent successfully.'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
