from django.urls import path
from .views import RegisterView, UserProfileView, CustomTokenObtainPairView, AdminUserListView, AdminUserDetailView, AdminSendEmailView
from .dashboard_views import DashboardStatsView, ExportReportView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', UserProfileView.as_view(), name='user_profile'),
    path('stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('export-report/', ExportReportView.as_view(), name='export_report'),
    path('admin/users/', AdminUserListView.as_view(), name='admin_user_list'),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin_user_detail'),
    path('admin/send-email/', AdminSendEmailView.as_view(), name='admin_send_email'),
]
