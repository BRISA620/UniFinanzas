from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, current_user, get_jwt_identity,
    decode_token
)
from marshmallow import Schema, fields, validate, ValidationError
from datetime import datetime, timedelta
import secrets
import hashlib

from app.extensions import db, limiter
from app.models import User, UserProfile, Category, RefreshToken
from app.utils.validators import validate_password_strength
from app.utils.defaults import create_default_categories
from app.services.notification_service import NotificationService

auth_bp = Blueprint('auth', __name__)


# ========== SCHEMAS ==========

class RegisterSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=8, max=128))
    first_name = fields.Str(validate=validate.Length(max=100))
    last_name = fields.Str(validate=validate.Length(max=100))


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)


class ChangePasswordSchema(Schema):
    current_password = fields.Str(required=True)
    new_password = fields.Str(required=True, validate=validate.Length(min=8, max=128))


# ========== ENDPOINTS ==========

@auth_bp.route('/register', methods=['POST'])
@limiter.limit("10 per hour")
def register():
    """Register new user"""
    try:
        data = RegisterSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({'error': 'Validation error', 'details': err.messages}), 400

    # Check if email already exists
    if User.query.filter_by(email=data['email'].lower()).first():
        return jsonify({'error': 'Email already registered'}), 409

    # Validate password strength
    password_validation = validate_password_strength(data['password'])
    if not password_validation['valid']:
        return jsonify({
            'error': 'Weak password',
            'details': password_validation['issues']
        }), 400

    # Create user
    user = User(
        email=data['email'].lower(),
        verification_token=secrets.token_urlsafe(32)
    )
    user.set_password(data['password'])

    db.session.add(user)
    db.session.flush()

    # Create profile
    profile = UserProfile(
        user_id=user.id,
        first_name=data.get('first_name'),
        last_name=data.get('last_name')
    )
    db.session.add(profile)

    # Create default categories
    create_default_categories(user.id, commit=True)

    # Welcome notification (DB only)
    try:
        NotificationService.send_notification(
            user_id=user.id,
            title="Bienvenido a UniFinanzas",
            message="Tu cuenta esta lista. Empieza a registrar gastos, metas y presupuestos.",
            notification_type="general",
            channels=("email", "db")
        )
    except Exception as exc:
        current_app.logger.warning(f"Welcome notification failed: {exc}")

    # Create tokens
    access_token = create_access_token(identity=user)
    refresh_token = create_refresh_token(identity=user)

    # Save refresh token
    save_refresh_token(user.id, refresh_token)

    return jsonify({
        'message': 'User registered successfully',
        'user': {
            'id': user.id,
            'email': user.email,
            'profile': {
                'first_name': profile.first_name,
                'last_name': profile.last_name,
                'currency_code': profile.currency_code
            }
        },
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 201


@auth_bp.route('/login', methods=['POST'])
@limiter.limit("20 per minute")
def login():
    """Login user"""
    try:
        data = LoginSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({'error': 'Validation error', 'details': err.messages}), 400

    user = User.query.filter_by(email=data['email'].lower()).first()

    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401

    if not user.is_active:
        return jsonify({'error': 'Account is disabled'}), 403

    # Update last login
    user.last_login = datetime.utcnow()
    db.session.commit()

    # Create tokens
    access_token = create_access_token(identity=user)
    refresh_token = create_refresh_token(identity=user)

    # Save refresh token
    save_refresh_token(user.id, refresh_token)

    return jsonify({
        'message': 'Login successful',
        'user': {
            'id': user.id,
            'email': user.email,
            'profile': {
                'first_name': user.profile.first_name if user.profile else None,
                'last_name': user.profile.last_name if user.profile else None,
                'currency_code': user.profile.currency_code if user.profile else 'MXN',
                'full_name': user.profile.full_name if user.profile else 'Usuario'
            }
        },
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 200


@auth_bp.route('/refresh', methods=['POST'])
@limiter.limit("30 per hour")
def refresh():
    """Refresh access token"""
    data = request.get_json()
    refresh_token = data.get('refresh_token') if data else None

    if not refresh_token:
        return jsonify({'error': 'Refresh token required'}), 400

    try:
        decoded = decode_token(refresh_token)
        user_id = decoded['sub']

        user = User.query.get(user_id)
        if not user or not user.is_active:
            return jsonify({'error': 'Invalid token'}), 401

        # Create new access token
        new_access_token = create_access_token(identity=user)

        return jsonify({
            'access_token': new_access_token
        }), 200

    except Exception as e:
        current_app.logger.error(f"Token refresh error: {e}")
        return jsonify({'error': 'Invalid or expired refresh token'}), 401


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user - revoke tokens"""
    RefreshToken.query.filter_by(
        user_id=current_user.id,
        revoked=False
    ).update({
        'revoked': True,
        'revoked_at': datetime.utcnow()
    })
    db.session.commit()

    return jsonify({'message': 'Logged out successfully'}), 200


@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
@limiter.limit("10 per hour")
def change_password():
    """Change password for the authenticated user"""
    try:
        data = ChangePasswordSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({'error': 'Validation error', 'details': err.messages}), 400

    if not current_user.check_password(data['current_password']):
        return jsonify({'error': 'Invalid current password'}), 400

    password_validation = validate_password_strength(data['new_password'])
    if not password_validation['valid']:
        return jsonify({
            'error': 'Weak password',
            'details': password_validation['issues']
        }), 400

    current_user.set_password(data['new_password'])

    # Revoke existing refresh tokens
    RefreshToken.query.filter_by(
        user_id=current_user.id,
        revoked=False
    ).update({
        'revoked': True,
        'revoked_at': datetime.utcnow()
    })

    db.session.commit()

    return jsonify({'message': 'Password updated successfully'}), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user_info():
    """Get current user information"""
    return jsonify({
        'user': {
            'id': current_user.id,
            'email': current_user.email,
            'is_verified': current_user.is_verified,
            'profile': {
                'first_name': current_user.profile.first_name if current_user.profile else None,
                'last_name': current_user.profile.last_name if current_user.profile else None,
                'full_name': current_user.profile.full_name if current_user.profile else 'Usuario',
                'currency_code': current_user.profile.currency_code if current_user.profile else 'MXN',
                'weekly_closing_day': current_user.profile.weekly_closing_day if current_user.profile else 0,
                'notification_preferences': current_user.profile.notification_preferences if current_user.profile else {},
                'risk_thresholds': current_user.profile.risk_thresholds if current_user.profile else {}
            },
            'created_at': current_user.created_at.isoformat(),
            'last_login': current_user.last_login.isoformat() if current_user.last_login else None
        }
    }), 200


# ========== HELPERS ==========

def save_refresh_token(user_id, token):
    """Save refresh token to database"""
    token_hash = hashlib.sha256(token.encode()).hexdigest()

    refresh_token = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=datetime.utcnow() + timedelta(days=30),
        device_info={
            'user_agent': request.headers.get('User-Agent'),
            'ip': request.remote_addr
        }
    )

    db.session.add(refresh_token)
    db.session.commit()
