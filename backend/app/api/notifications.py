from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, current_user

from app.extensions import db
from app.models import Notification, UserProfile

notifications_bp = Blueprint('notifications', __name__)


@notifications_bp.route('', methods=['GET'])
@jwt_required()
def list_notifications():
    """List user notifications"""
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = Notification.query.filter_by(user_id=current_user.id)

    if unread_only:
        query = query.filter_by(is_read=False)

    pagination = query.order_by(Notification.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    # Count unread
    unread_count = Notification.query.filter_by(
        user_id=current_user.id,
        is_read=False
    ).count()

    return jsonify({
        'notifications': [n.to_dict() for n in pagination.items],
        'unread_count': unread_count,
        'pagination': {
            'page': pagination.page,
            'per_page': pagination.per_page,
            'total': pagination.total,
            'pages': pagination.pages
        }
    }), 200


@notifications_bp.route('/<notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_as_read(notification_id):
    """Mark notification as read"""
    notification = Notification.query.filter_by(
        id=notification_id,
        user_id=current_user.id
    ).first()

    if not notification:
        return jsonify({'error': 'Notification not found'}), 404

    notification.mark_as_read()
    db.session.commit()

    return jsonify({
        'message': 'Notification marked as read',
        'notification': notification.to_dict()
    }), 200


@notifications_bp.route('/read-all', methods=['PUT'])
@jwt_required()
def mark_all_as_read():
    """Mark all notifications as read"""
    from datetime import datetime

    Notification.query.filter_by(
        user_id=current_user.id,
        is_read=False
    ).update({
        'is_read': True,
        'read_at': datetime.utcnow()
    })

    db.session.commit()

    return jsonify({'message': 'All notifications marked as read'}), 200


@notifications_bp.route('/fcm-token', methods=['POST'])
@jwt_required()
def register_fcm_token():
    """Register FCM token for push notifications"""
    data = request.get_json()
    token = data.get('token')

    if not token:
        return jsonify({'error': 'FCM token required'}), 400

    profile = UserProfile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        return jsonify({'error': 'User profile not found'}), 404

    profile.fcm_token = token
    db.session.commit()

    return jsonify({'message': 'FCM token registered successfully'}), 200


@notifications_bp.route('/preferences', methods=['GET'])
@jwt_required()
def get_preferences():
    """Get notification preferences"""
    profile = UserProfile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        return jsonify({'error': 'User profile not found'}), 404

    return jsonify({
        'preferences': profile.notification_preferences
    }), 200


@notifications_bp.route('/preferences', methods=['PUT'])
@jwt_required()
def update_preferences():
    """Update notification preferences"""
    profile = UserProfile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        return jsonify({'error': 'User profile not found'}), 404

    data = request.get_json()
    current_prefs = profile.notification_preferences or {}

    # Update preferences
    for key in ['push_enabled', 'email_enabled', 'threshold_alerts', 'weekly_summary', 'daily_reminder', 'reminder_time']:
        if key in data:
            current_prefs[key] = data[key]

    profile.notification_preferences = current_prefs
    db.session.commit()

    return jsonify({
        'message': 'Preferences updated successfully',
        'preferences': profile.notification_preferences
    }), 200


@notifications_bp.route('/<notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """Delete notification"""
    notification = Notification.query.filter_by(
        id=notification_id,
        user_id=current_user.id
    ).first()

    if not notification:
        return jsonify({'error': 'Notification not found'}), 404

    db.session.delete(notification)
    db.session.commit()

    return jsonify({'message': 'Notification deleted successfully'}), 200
