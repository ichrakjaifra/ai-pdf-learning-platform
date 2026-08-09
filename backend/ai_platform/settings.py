import os
from pathlib import Path
from datetime import timedelta
import environ

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Setup environ
env = environ.Env(
    DEBUG=(bool, False)
)
environ.Env.read_env(os.path.join(BASE_DIR.parent, '.env'))

SECRET_KEY = env('DJANGO_SECRET_KEY', default='django-insecure-dev-key')
DEBUG = env('DEBUG', default=True)
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['*'])

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_celery_results',
    
    # Local apps
    'apps.users',
    'apps.documents',
    'apps.chat',
    'apps.quizzes',
    'apps.analytics',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'ai_platform.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'ai_platform.wsgi.application'
ASGI_APPLICATION = 'ai_platform.asgi.application'

DATABASES = {
    'default': env.db('DATABASE_URL', default=f"postgres://{env('DB_USER', default='aiadmin')}:{env('DB_PASSWORD', default='secretpassword')}@{env('DB_HOST', default='localhost')}:{env('DB_PORT', default='5432')}/{env('DB_NAME', default='aipdfdb')}")
}

AUTH_USER_MODEL = 'users.CustomUser'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'AUTH_HEADER_TYPES': ('Bearer',),
}

CORS_ALLOW_ALL_ORIGINS = True # For dev

CELERY_BROKER_URL = env('REDIS_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = 'django-db'
CELERY_ACCEPT_CONTENT = ['application/json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'

MINIO_ENDPOINT = env('MINIO_ENDPOINT', default='localhost:9000')
MINIO_ACCESS_KEY = env('MINIO_ACCESS_KEY', default='minioadmin')
MINIO_SECRET_KEY = env('MINIO_SECRET_KEY', default='minioadmin')
MINIO_USE_SSL = env.bool('MINIO_USE_SSL', default=False)
AWS_STORAGE_BUCKET_NAME = env('AWS_STORAGE_BUCKET_NAME', default='pdf-documents')

GEMINI_API_KEY = env('GEMINI_API_KEY', default='')
