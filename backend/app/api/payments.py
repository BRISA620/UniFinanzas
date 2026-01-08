from datetime import datetime, date, timedelta
import calendar

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, current_user

from app.extensions import db
from app.models import Payment, Category

payments_bp = Blueprint('payments', __name__)

ALLOWED_FREQUENCIES = {'one_time', 'weekly', 'monthly', 'yearly'}


def _parse_date(value):
    try:
        return date.fromisoformat(value)
    except Exception:
        return None


def _advance_due_date(current_date: date, frequency: str) -> date:
    if frequency == 'weekly':
        return current_date + timedelta(days=7)
    if frequency == 'monthly':
        year = current_date.year
        month = current_date.month + 1
        if month > 12:
            month = 1
            year += 1
        last_day = calendar.monthrange(year, month)[1]
        day = min(current_date.day, last_day)
        return date(year, month, day)
    if frequency == 'yearly':
        year = current_date.year + 1
        last_day = calendar.monthrange(year, current_date.month)[1]
        day = min(current_date.day, last_day)
        return date(year, current_date.month, day)
    return current_date


@payments_bp.route('', methods=['GET'])
@jwt_required()
def list_payments():
    """List payments in a date range"""
    start_date = _parse_date(request.args.get('start'))
    end_date = _parse_date(request.args.get('end'))
    include_paid = request.args.get('include_paid', 'true').lower() == 'true'

    query = Payment.query.filter_by(user_id=current_user.id)

    if start_date and end_date:
        query = query.filter(Payment.due_date >= start_date, Payment.due_date <= end_date)

    if not include_paid:
        query = query.filter(Payment.is_paid == False)

    payments = query.order_by(Payment.due_date.asc()).all()

    return jsonify({
        'payments': [p.to_dict() for p in payments]
    }), 200


@payments_bp.route('', methods=['POST'])
@jwt_required()
def create_payment():
    """Create a payment"""
    data = request.get_json() or {}

    name = data.get('name')
    amount = data.get('amount')
    due_date_value = data.get('due_date')
    frequency = data.get('frequency', 'one_time')
    notes = data.get('notes')
    category_id = data.get('category_id')

    if not name or amount is None or not due_date_value:
        return jsonify({'error': 'name, amount, and due_date are required'}), 400

    if frequency not in ALLOWED_FREQUENCIES:
        return jsonify({'error': 'Invalid frequency'}), 400

    try:
        amount_value = float(amount)
        if amount_value <= 0:
            return jsonify({'error': 'amount must be greater than 0'}), 400
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid amount'}), 400

    due_date = _parse_date(due_date_value)
    if not due_date:
        return jsonify({'error': 'Invalid due_date'}), 400

    category = None
    if category_id:
        category = Category.query.filter_by(
            id=category_id,
            user_id=current_user.id,
            is_active=True
        ).first()
        if not category:
            return jsonify({'error': 'Category not found'}), 404

    payment = Payment(
        user_id=current_user.id,
        category_id=category_id,
        name=name,
        amount=amount_value,
        due_date=due_date,
        frequency=frequency,
        notes=notes
    )

    db.session.add(payment)
    db.session.commit()

    return jsonify({'payment': payment.to_dict()}), 201


@payments_bp.route('/<payment_id>', methods=['PUT'])
@jwt_required()
def update_payment(payment_id):
    """Update a payment"""
    payment = Payment.query.filter_by(id=payment_id, user_id=current_user.id).first()
    if not payment:
        return jsonify({'error': 'Payment not found'}), 404

    data = request.get_json() or {}

    if 'name' in data:
        payment.name = data['name']
    if 'amount' in data:
        try:
            amount_value = float(data['amount'])
            if amount_value <= 0:
                return jsonify({'error': 'amount must be greater than 0'}), 400
            payment.amount = amount_value
        except (TypeError, ValueError):
            return jsonify({'error': 'Invalid amount'}), 400
    if 'due_date' in data:
        due_date = _parse_date(data['due_date'])
        if not due_date:
            return jsonify({'error': 'Invalid due_date'}), 400
        if due_date != payment.due_date:
            payment.due_date = due_date
            payment.reminder_7_sent = False
            payment.reminder_3_sent = False
            payment.reminder_0_sent = False
    if 'frequency' in data:
        if data['frequency'] not in ALLOWED_FREQUENCIES:
            return jsonify({'error': 'Invalid frequency'}), 400
        payment.frequency = data['frequency']
    if 'notes' in data:
        payment.notes = data['notes']
    if 'category_id' in data:
        category_id = data['category_id']
        if category_id:
            category = Category.query.filter_by(
                id=category_id,
                user_id=current_user.id,
                is_active=True
            ).first()
            if not category:
                return jsonify({'error': 'Category not found'}), 404
            payment.category_id = category_id
        else:
            payment.category_id = None

    db.session.commit()
    return jsonify({'payment': payment.to_dict()}), 200


@payments_bp.route('/<payment_id>/mark-paid', methods=['PUT'])
@jwt_required()
def mark_payment_paid(payment_id):
    """Mark payment as paid and optionally advance recurring payments"""
    payment = Payment.query.filter_by(id=payment_id, user_id=current_user.id).first()
    if not payment:
        return jsonify({'error': 'Payment not found'}), 404

    data = request.get_json() or {}
    advance = data.get('advance', True)

    payment.is_paid = True
    payment.paid_at = datetime.utcnow()

    next_payment = None
    if payment.frequency != 'one_time' and advance:
        next_due = _advance_due_date(payment.due_date, payment.frequency)
        next_payment = Payment(
            user_id=payment.user_id,
            category_id=payment.category_id,
            name=payment.name,
            amount=payment.amount,
            due_date=next_due,
            frequency=payment.frequency,
            notes=payment.notes
        )
        db.session.add(next_payment)

    db.session.commit()

    response = {'payment': payment.to_dict()}
    if next_payment:
        response['next_payment'] = next_payment.to_dict()

    return jsonify(response), 200


@payments_bp.route('/<payment_id>', methods=['DELETE'])
@jwt_required()
def delete_payment(payment_id):
    """Delete a payment"""
    payment = Payment.query.filter_by(id=payment_id, user_id=current_user.id).first()
    if not payment:
        return jsonify({'error': 'Payment not found'}), 404

    db.session.delete(payment)
    db.session.commit()

    return jsonify({'message': 'Payment deleted successfully'}), 200
