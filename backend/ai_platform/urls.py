from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # To be added: path('api/users/', include('apps.users.urls')),
    # To be added: path('api/documents/', include('apps.documents.urls')),
    # To be added: path('api/chat/', include('apps.chat.urls')),
    # To be added: path('api/quizzes/', include('apps.quizzes.urls')),
    # To be added: path('api/analytics/', include('apps.analytics.urls')),
]
