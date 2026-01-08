from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_marshmallow import Marshmallow
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_caching import Cache

from app.task_queue import TaskQueue

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
ma = Marshmallow()

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="memory://",
    default_limits=[]  
)
cache = Cache()

task_queue = TaskQueue()
scheduler = None
