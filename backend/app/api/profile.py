from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, current_user
from marshmallow import Schema, fields, validate, ValidationError, EXCLUDE

from app.extensions import db
from app.models import UserProfile

profile_bp = Blueprint('profile', __name__)


# ========== SCHEMAS ==========

class ProfileUpdateSchema(Schema):
    class Meta:
        unknown = EXCLUDE  # Ignorar campos desconocidos

    first_name = fields.Str(validate=validate.Length(max=100))
    last_name = fields.Str(validate=validate.Length(max=100))
    currency_code = fields.Str(validate=validate.Length(min=3, max=3))
    timezone = fields.Str(validate=validate.Length(max=50))
    weekly_closing_day = fields.Int(validate=validate.Range(min=0, max=6))
    budget_method = fields.Str(validate=validate.OneOf(['weekly', 'biweekly', 'monthly']))
    notification_preferences = fields.Dict()
    risk_thresholds = fields.Dict()


# ========== ENDPOINTS ==========

@profile_bp.route('', methods=['GET'])
@jwt_required()
def get_profile():
    """Get user profile"""
    profile = UserProfile.query.filter_by(user_id=current_user.id).first()

    if not profile:
        return jsonify({'error': 'Profile not found'}), 404

    return jsonify({
        'profile': profile.to_dict()
    }), 200


@profile_bp.route('', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    profile = UserProfile.query.filter_by(user_id=current_user.id).first()

    if not profile:
        return jsonify({'error': 'Profile not found'}), 404

    try:
        data = ProfileUpdateSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({'error': 'Validation error', 'details': err.messages}), 400

    # Update fields
    if 'first_name' in data:
        profile.first_name = data['first_name']

    if 'last_name' in data:
        profile.last_name = data['last_name']

    if 'currency_code' in data:
        profile.currency_code = data['currency_code']

    if 'timezone' in data:
        profile.timezone = data['timezone']

    if 'weekly_closing_day' in data:
        profile.weekly_closing_day = data['weekly_closing_day']

    if 'budget_method' in data:
        profile.budget_method = data['budget_method']

    if 'notification_preferences' in data:
        # Merge with existing preferences
        current_prefs = dict(profile.notification_preferences or {})
        current_prefs.update(data['notification_preferences'] or {})
        profile.notification_preferences = current_prefs

    if 'risk_thresholds' in data:
        # Validate thresholds
        thresholds = data['risk_thresholds']
        if 'yellow' in thresholds and 'red' in thresholds:
            if thresholds['yellow'] >= thresholds['red']:
                return jsonify({'error': 'Yellow threshold must be less than red threshold'}), 400
            if not (0 <= thresholds['yellow'] <= 100) or not (0 <= thresholds['red'] <= 100):
                return jsonify({'error': 'Thresholds must be between 0 and 100'}), 400
        profile.risk_thresholds = thresholds

    db.session.commit()

    return jsonify({
        'message': 'Profile updated successfully',
        'profile': profile.to_dict()
    }), 200


@profile_bp.route('/risk-thresholds', methods=['PUT'])
@jwt_required()
def update_risk_thresholds():
    """Update risk thresholds specifically"""
    profile = UserProfile.query.filter_by(user_id=current_user.id).first()

    if not profile:
        return jsonify({'error': 'Profile not found'}), 404

    data = request.get_json()
    yellow = data.get('yellow')
    red = data.get('red')

    if yellow is None or red is None:
        return jsonify({'error': 'Both yellow and red thresholds are required'}), 400

    if not isinstance(yellow, (int, float)) or not isinstance(red, (int, float)):
        return jsonify({'error': 'Thresholds must be numbers'}), 400

    if yellow >= red:
        return jsonify({'error': 'Yellow threshold must be less than red threshold'}), 400

    if not (0 <= yellow <= 100) or not (0 <= red <= 100):
        return jsonify({'error': 'Thresholds must be between 0 and 100'}), 400

    profile.risk_thresholds = {
        'yellow': yellow,
        'red': red
    }

    db.session.commit()

    return jsonify({
        'message': 'Risk thresholds updated successfully',
        'risk_thresholds': profile.risk_thresholds
    }), 200
