from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from django.core.mail import send_mail
from django.utils import timezone
import logging

from .serializers import CustomTokenObtainPairSerializer, UserSerializer, RegisterSerializer, AdminUserSerializer
from .permissions import IsAdministrateur
from apps.analytics.models import AdminAuditLog, Notification

logger = logging.getLogger(__name__)
User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            return Response(
                {"detail": "Failed to create user. Please try again later.", "error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class UserProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


# ─── Admin: User Management ──────────────────────────────────────────────────

class AdminUserListView(generics.ListAPIView):
    """GET /api/users/admin/users/ — returns all users with full profile fields."""
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdministrateur]

    def get_queryset(self):
        qs = User.objects.all().order_by('-date_joined')
        # Optional search by username or email
        q = self.request.query_params.get('search', '').strip()
        if q:
            qs = qs.filter(username__icontains=q) | qs.filter(email__icontains=q)
        return qs


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/users/admin/users/<pk>/ — manage a single user."""
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdministrateur]

    def perform_update(self, serializer):
        # Snapshot before state
        user_before = User.objects.get(pk=serializer.instance.pk)
        before = {
            'role': user_before.role,
            'quota_documents': user_before.quota_documents,
            'quota_storage_mb': user_before.quota_storage_mb,
            'is_active': user_before.is_active,
        }
        user = serializer.save()
        after = {
            'role': user.role,
            'quota_documents': user.quota_documents,
            'quota_storage_mb': user.quota_storage_mb,
            'is_active': user.is_active,
        }
        # Only log if something actually changed
        changes = {k: {'before': before[k], 'after': after[k]} for k in before if before[k] != after[k]}
        if changes:
            AdminAuditLog.objects.create(
                admin=self.request.user,
                action=f"Updated user: {user.username}",
                target_user=user,
                details=str(changes),
            )
            logger.info("Admin %s updated user %s: %s", self.request.user.username, user.username, changes)

    def perform_destroy(self, instance):
        AdminAuditLog.objects.create(
            admin=self.request.user,
            action=f"Deleted user: {instance.username}",
            target_user=None,
            details=f"Email was: {instance.email}",
        )
        instance.delete()


# ─── Admin: Audit Log ────────────────────────────────────────────────────────

class AdminAuditLogView(APIView):
    """GET /api/users/admin/audit-log/ — returns the last 100 admin actions."""
    permission_classes = [permissions.IsAuthenticated, IsAdministrateur]

    def get(self, request):
        logs = AdminAuditLog.objects.select_related('admin', 'target_user').order_by('-timestamp')[:100]
        data = [
            {
                'id': log.id,
                'admin': log.admin.username,
                'action': log.action,
                'target_user': log.target_user.username if log.target_user else '(deleted)',
                'timestamp': log.timestamp.isoformat(),
                'details': log.details,
            }
            for log in logs
        ]
        return Response(data)


# ─── Admin: Email / Notification Dispatch ────────────────────────────────────

NOTIFICATION_TEMPLATES = {
    'revision_reminder': {
        'subject': '📚 Rappel de révision — Smart AI PDF',
        'body': (
            "Bonjour {username},\n\n"
            "Nous vous rappelons de réviser vos documents récents sur Smart AI PDF.\n"
            "Connectez-vous dès maintenant pour continuer votre apprentissage !\n\n"
            "👉 http://localhost:3000/dashboard\n\n"
            "Bonne révision,\nL'équipe Smart AI PDF"
        ),
    },
    'new_document': {
        'subject': '📄 Nouveau document disponible — Smart AI PDF',
        'body': (
            "Bonjour {username},\n\n"
            "Un nouveau document est disponible sur la plateforme.\n"
            "Connectez-vous pour le consulter et générer un quiz !\n\n"
            "👉 http://localhost:3000/dashboard/documents\n\n"
            "L'équipe Smart AI PDF"
        ),
    },
    'quiz_result': {
        'subject': '🎯 Résultat de votre quiz — Smart AI PDF',
        'body': (
            "Bonjour {username},\n\n"
            "Votre résultat de quiz est disponible sur la plateforme.\n"
            "Consultez votre tableau de bord pour voir vos performances et vos zones à améliorer.\n\n"
            "👉 http://localhost:3000/dashboard\n\n"
            "L'équipe Smart AI PDF"
        ),
    },
    'pedagogical_recommendation': {
        'subject': '💡 Recommandation pédagogique — Smart AI PDF',
        'body': (
            "Bonjour {username},\n\n"
            "Nos analyses AI ont identifié des concepts que vous devriez réviser.\n"
            "Connectez-vous pour voir vos zones faibles personnalisées.\n\n"
            "👉 http://localhost:3000/dashboard\n\n"
            "L'équipe Smart AI PDF"
        ),
    },
    'custom': {
        'subject': '{subject}',
        'body': '{body}',
    },
}


class AdminSendEmailView(APIView):
    """
    POST /api/users/admin/send-email/
    Supports single or multi-recipient dispatch with template or custom message.
    Logs every send to Notification + AdminAuditLog.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdministrateur]

    def post(self, request):
        # Accept either a single user_id or a list of user_ids
        user_ids = request.data.get('user_ids') or (
            [request.data.get('user_id')] if request.data.get('user_id') else []
        )
        notification_type = request.data.get('notification_type', 'custom')
        custom_subject = request.data.get('subject', '')
        custom_body = request.data.get('message', '')

        if not user_ids:
            return Response({'error': 'At least one user_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        template = NOTIFICATION_TEMPLATES.get(notification_type, NOTIFICATION_TEMPLATES['custom'])
        results = []

        for uid in user_ids:
            try:
                target = User.objects.get(id=uid)
            except User.DoesNotExist:
                results.append({'user_id': uid, 'status': 'error', 'detail': 'User not found'})
                continue

            subject = template['subject'].format(username=target.username, subject=custom_subject)
            body = template['body'].format(username=target.username, body=custom_body)

            # If custom type, use provided subject/body
            if notification_type == 'custom':
                subject = custom_subject or subject
                body = custom_body or body

            send_status = 'sent'
            error_detail = ''
            try:
                send_mail(
                    subject, body,
                    'noreply@ai-pdf-platform.com',
                    [target.email],
                    fail_silently=False,
                )
            except Exception as mail_err:
                send_status = 'failed'
                error_detail = str(mail_err)
                logger.error("Failed to send email to %s: %s", target.email, mail_err)

            # Always log to Notification history regardless of send success
            Notification.objects.create(
                user=target,
                title=subject,
                content=body,
            )

            # Log to AdminAuditLog
            AdminAuditLog.objects.create(
                admin=request.user,
                action=f"Email dispatch [{notification_type}]: {subject}",
                target_user=target,
                details=f"Status: {send_status}. {error_detail}",
            )

            results.append({
                'user_id': uid,
                'username': target.username,
                'email': target.email,
                'status': send_status,
                'detail': error_detail,
            })

        success_count = sum(1 for r in results if r['status'] == 'sent')
        return Response({
            'sent': success_count,
            'total': len(user_ids),
            'results': results,
        }, status=status.HTTP_200_OK)


class AdminNotificationTemplatesView(APIView):
    """GET /api/users/admin/notification-templates/ — list available templates."""
    permission_classes = [permissions.IsAuthenticated, IsAdministrateur]

    def get(self, request):
        return Response([
            {'key': k, 'subject': v['subject']} for k, v in NOTIFICATION_TEMPLATES.items()
        ])
