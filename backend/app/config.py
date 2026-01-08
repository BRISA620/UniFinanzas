import os
from datetime import timedelta


class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'postgresql://localhost/unifinanzas')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'pool_recycle': 3600,
        'pool_pre_ping': True
    }

    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'

    # CORS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')

    # File Upload
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', '/tmp/unifinanzas/uploads')
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}

    # S3-Compatible Storage
    S3_BUCKET = os.environ.get('S3_BUCKET', 'unifinanzas-attachments')
    S3_ENDPOINT = os.environ.get('S3_ENDPOINT', 'http://localhost:9000')
    S3_ACCESS_KEY = os.environ.get('S3_ACCESS_KEY', 'minioadmin')
    S3_SECRET_KEY = os.environ.get('S3_SECRET_KEY', 'minioadmin')
    S3_REGION = os.environ.get('S3_REGION', 'us-east-1')

    # Email (Brevo)
    BREVO_API_KEY = os.environ.get('BREVO_API_KEY')
    BREVO_FROM_EMAIL = os.environ.get('BREVO_FROM_EMAIL', 'noreply@unifinanzas.com')
    BREVO_FROM_NAME = os.environ.get('BREVO_FROM_NAME', 'UniFinanzas')
    BREVO_API_URL = os.environ.get('BREVO_API_URL', 'https://api.brevo.com/v3/smtp/email')

    # FCM (Firebase Cloud Messaging)
    FCM_SERVER_KEY = os.environ.get('FCM_SERVER_KEY')

    # Redis (Cache)
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    CACHE_TYPE = 'RedisCache'
    CACHE_REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    CACHE_DEFAULT_TIMEOUT = 300

    # Task Queue (in-process)
    TASK_QUEUE_MAX_WORKERS = int(os.environ.get('TASK_QUEUE_MAX_WORKERS', 4))
    TASK_QUEUE_SCHEDULER_ENABLED = os.environ.get('TASK_QUEUE_SCHEDULER_ENABLED', 'false').lower() == 'true'
    TASK_QUEUE_TIMEZONE = os.environ.get('TASK_QUEUE_TIMEZONE', 'America/Lima')

    # Rate Limiting
    RATELIMIT_DEFAULT = "200 per day, 50 per hour"
    RATELIMIT_STORAGE_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

    # PDF Generation
    PDF_TEMP_DIR = os.environ.get('PDF_TEMP_DIR', '/tmp/unifinanzas/pdfs')


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_ECHO = False
    CACHE_TYPE = 'SimpleCache'  # Use simple cache for development
    RATELIMIT_STORAGE_URL = 'memory://'  # Use in-memory storage for development


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'postgresql://localhost/unifinanzas_test'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)
    CACHE_TYPE = 'SimpleCache'
    WTF_CSRF_ENABLED = False


class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_ECHO = False

    @classmethod
    def init_app(cls, app):
        Config.init_app(app)

        # Validate critical configuration
        assert os.environ.get('SECRET_KEY'), 'SECRET_KEY must be set'
        assert os.environ.get('JWT_SECRET_KEY'), 'JWT_SECRET_KEY must be set'
        assert os.environ.get('DATABASE_URL'), 'DATABASE_URL must be set'


config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
