from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, current_user
from marshmallow import Schema, fields, validate, ValidationError
from datetime import date, timedelta

from app.extensions import db, limiter
from app.models import Budget, BudgetAllocation, Category
from app.services.budget_service import BudgetService

budgets_bp = Blueprint('budgets', __name__)


# ========== SCHEMAS ==========

class BudgetCreateSchema(Schema):
    total_amount = fields.Decimal(required=True, places=2, validate=validate.Range(min=0.01))
    period_start = fields.Date(load_default=date.today)
    period_end = fields.Date()
    notes = fields.Str(validate=validate.Length(max=500))
    allocations = fields.List(fields.Dict(), load_default=[])


class BudgetUpdateSchema(Schema):
    total_amount = fields.Decimal(places=2, validate=validate.Range(min=0.01))
    notes = fields.Str(validate=validate.Length(max=500))


# ========== ENDPOINTS ==========

@budgets_bp.route('', methods=['GET'])
@jwt_required()
def list_budgets():
    """List user budgets"""
    budgets = Budget.query.filter_by(user_id=current_user.id).order_by(Budget.created_at.desc()).all()
    return jsonify({'budgets': [b.to_dict() for b in budgets]}), 200


@budgets_bp.route('/current', methods=['GET'])
@jwt_required()
def get_current_budget():
    """Get current active budget with real-time calculations"""
    budget = BudgetService.get_current_budget(current_user.id)

    if not budget:
        return jsonify({
            'budget': None,
            'message': 'No active budget found'
        }), 200

    # Calculate spent amount
    spent = BudgetService.get_period_expenses(
        current_user.id,
        budget.period_start,
        budget.period_end
    )

    # Get expenses by category
    by_category = BudgetService.get_expenses_by_category(
        current_user.id,
        budget.period_start,
        budget.period_end,
        include_payments=True
    )

    remaining = float(budget.total_amount) - float(spent)
    percentage = (float(spent) / float(budget.total_amount)) * 100 if budget.total_amount > 0 else 0

    return jsonify({
        'budget': budget.to_dict(),
        'spent': float(spent),
        'remaining': remaining,
        'percentage_used': round(percentage, 2),
        'by_category': by_category
    }), 200


@budgets_bp.route('/current', methods=['OPTIONS'])
def options_current_budget():
    """Allow CORS preflight for current budget"""
    return '', 204


@budgets_bp.route('', methods=['POST'])
@jwt_required()
@limiter.limit("20 per hour")
def create_budget():
    """Create new budget"""
    try:
        data = BudgetCreateSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({'error': 'Validation error', 'details': err.messages}), 400

    # Calculate period end if not provided
    period_start = data.get('period_start', date.today())
    period_end = data.get('period_end')

    if not period_end:
        # Default to weekly
        period_end = period_start + timedelta(days=6)

    if period_end <= period_start:
        return jsonify({'error': 'period_end must be after period_start'}), 400

    # Deactivate previous active budgets
    Budget.query.filter_by(
        user_id=current_user.id,
        is_active=True
    ).update({'is_active': False})

    # Create new budget
    budget = Budget(
        user_id=current_user.id,
        total_amount=data['total_amount'],
        period_start=period_start,
        period_end=period_end,
        notes=data.get('notes'),
        is_active=True
    )

    db.session.add(budget)
    db.session.flush()

    # Add allocations if provided
    allocations = data.get('allocations', [])
    for alloc in allocations:
        if 'category_id' in alloc and 'amount' in alloc:
            category = Category.query.filter_by(
                id=alloc['category_id'],
                user_id=current_user.id
            ).first()
            if category:
                allocation = BudgetAllocation(
                    budget_id=budget.id,
                    category_id=alloc['category_id'],
                    allocated_amount=alloc['amount']
                )
                db.session.add(allocation)

    db.session.commit()

    return jsonify({
        'message': 'Budget created successfully',
        'budget': budget.to_dict()
    }), 201


@budgets_bp.route('/<budget_id>', methods=['PUT'])
@jwt_required()
def update_budget(budget_id):
    """Update budget"""
    budget = Budget.query.filter_by(
        id=budget_id,
        user_id=current_user.id
    ).first()

    if not budget:
        return jsonify({'error': 'Budget not found'}), 404

    try:
        data = BudgetUpdateSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({'error': 'Validation error', 'details': err.messages}), 400

    if 'total_amount' in data:
        budget.total_amount = data['total_amount']

    if 'notes' in data:
        budget.notes = data['notes']

    db.session.commit()

    return jsonify({
        'message': 'Budget updated successfully',
        'budget': budget.to_dict()
    }), 200


@budgets_bp.route('/<budget_id>', methods=['DELETE'])
@jwt_required()
def deactivate_budget(budget_id):
    """Deactivate budget"""
    budget = Budget.query.filter_by(
        id=budget_id,
        user_id=current_user.id
    ).first()

    if not budget:
        return jsonify({'error': 'Budget not found'}), 404

    budget.is_active = False
    db.session.commit()

    return jsonify({'message': 'Budget deactivated successfully'}), 200


@budgets_bp.route('/<budget_id>/allocations', methods=['POST'])
@jwt_required()
def set_allocations(budget_id):
    """Set budget allocations by category"""
    budget = Budget.query.filter_by(
        id=budget_id,
        user_id=current_user.id
    ).first()

    if not budget:
        return jsonify({'error': 'Budget not found'}), 404

    data = request.get_json()
    allocations = data.get('allocations', [])

    if not allocations:
        return jsonify({'error': 'Allocations required'}), 400

    # Remove existing allocations
    BudgetAllocation.query.filter_by(budget_id=budget.id).delete()

    # Add new allocations
    total_allocated = 0
    for alloc in allocations:
        if 'category_id' in alloc and 'amount' in alloc:
            category = Category.query.filter_by(
                id=alloc['category_id'],
                user_id=current_user.id
            ).first()
            if category:
                allocation = BudgetAllocation(
                    budget_id=budget.id,
                    category_id=alloc['category_id'],
                    allocated_amount=alloc['amount']
                )
                db.session.add(allocation)
                total_allocated += float(alloc['amount'])

    if total_allocated > float(budget.total_amount):
        db.session.rollback()
        return jsonify({'error': 'Total allocations exceed budget amount'}), 400

    db.session.commit()

    return jsonify({
        'message': 'Allocations updated successfully',
        'budget': budget.to_dict(),
        'total_allocated': total_allocated
    }), 200


@budgets_bp.route('/current/daily-spending', methods=['GET'])
@jwt_required()
def get_daily_spending():
    """Get daily spending breakdown for current budget period"""
    budget = BudgetService.get_current_budget(current_user.id)

    if not budget:
        return jsonify({'error': 'No active budget found'}), 404

    # Get daily spending data
    daily_data = BudgetService.get_daily_spending(
        current_user.id,
        budget.period_start,
        budget.period_end
    )

    return jsonify({
        'period_start': budget.period_start.isoformat(),
        'period_end': budget.period_end.isoformat(),
        'budget_total': float(budget.total_amount),
        'daily_spending': daily_data
    }), 200
