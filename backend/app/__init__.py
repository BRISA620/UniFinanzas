from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime

from app.config import config
from app.extensions import db, migrate, jwt, ma, limiter, cache, task_queue


def create_app(config_name='development'):
    """Application Factory Pattern"""
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    ma.init_app(app)
    limiter.init_app(app)
    cache.init_app(app)

    # Initialize local task queue (in-process background tasks)
    task_queue.init_app(app)
    from app import extensions
    try:
        from app.task_scheduler import start_scheduler
        extensions.scheduler = start_scheduler(app)
    except Exception as e:
        app.logger.warning(f"Task scheduler not started: {str(e)[:120]}")

    # CORS configuration
    CORS(app, resources={
        r"/api/*": {
            "origins": app.config['CORS_ORIGINS'],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "expose_headers": ["Content-Type", "Authorization"]
        }
    })

    # Health check endpoint (no auth required)
    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint - verifica que el backend está funcionando"""
        try:
            # Verificar conexión a base de datos
            db.session.execute(db.text('SELECT 1'))
            db_status = 'healthy'
        except Exception:
            db_status = 'unhealthy'

        return jsonify({
            'status': 'healthy' if db_status == 'healthy' else 'degraded',
            'timestamp': datetime.utcnow().isoformat(),
            'database': db_status,
            'version': '1.0.0'
        }), 200 if db_status == 'healthy' else 503

    # Register blueprints
    from app.api.auth import auth_bp
    from app.api.expenses import expenses_bp
    from app.api.budgets import budgets_bp
    from app.api.categories import categories_bp
    from app.api.dashboard import dashboard_bp
    from app.api.reports import reports_bp
    from app.api.notifications import notifications_bp
    from app.api.profile import profile_bp
    from app.api.simulator import simulator_bp
    from app.api.tasks import tasks_bp
    from app.api.payments import payments_bp

    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
    app.register_blueprint(expenses_bp, url_prefix='/api/v1/expenses')
    app.register_blueprint(budgets_bp, url_prefix='/api/v1/budgets')
    app.register_blueprint(categories_bp, url_prefix='/api/v1/categories')
    app.register_blueprint(dashboard_bp, url_prefix='/api/v1/dashboard')
    app.register_blueprint(reports_bp, url_prefix='/api/v1/reports')
    app.register_blueprint(notifications_bp, url_prefix='/api/v1/notifications')
    app.register_blueprint(profile_bp, url_prefix='/api/v1/profile')
    app.register_blueprint(simulator_bp, url_prefix='/api/v1/simulator')
    app.register_blueprint(tasks_bp, url_prefix='/api/v1/tasks')
    app.register_blueprint(payments_bp, url_prefix='/api/v1/payments')

    # Register error handlers
    register_error_handlers(app)

    # Register JWT callbacks
    register_jwt_callbacks(app)

    return app


def register_error_handlers(app):
    @app.errorhandler(400)
    def bad_request(error):
        return {'error': 'Bad Request', 'message': str(error)}, 400

    @app.errorhandler(401)
    def unauthorized(error):
        return {'error': 'Unauthorized', 'message': 'Authentication required'}, 401

    @app.errorhandler(403)
    def forbidden(error):
        return {'error': 'Forbidden', 'message': 'Access denied'}, 403

    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Not Found', 'message': 'Resource not found'}, 404

    @app.errorhandler(422)
    def unprocessable(error):
        return {'error': 'Unprocessable Entity', 'message': str(error)}, 422

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return {'error': 'Internal Server Error', 'message': 'An unexpected error occurred'}, 500


def register_jwt_callbacks(app):
    from app.models.user import User

    @jwt.user_identity_loader
    def user_identity_lookup(user):
        return str(user.id) if isinstance(user, User) else user

    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data["sub"]
        return User.query.get(identity)

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {'error': 'Token expired', 'message': 'Please log in again'}, 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {'error': 'Invalid token', 'message': str(error)}, 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return {'error': 'Authorization required', 'message': 'Token is missing'}, 401
