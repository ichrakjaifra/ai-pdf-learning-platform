from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('apps.users.urls')),
    path('api/documents/', include('apps.documents.urls')),
    path('api/chat/', include('apps.chat.urls')),
    path('api/quizzes/', include('apps.quizzes.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
]
