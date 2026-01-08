from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, current_user
from marshmallow import Schema, fields, validate, ValidationError
from datetime import date
import logging

from app.extensions import db, limiter, cache
from app.models import Expense, Category
from app.services.storage_service import StorageService
from app.services.budget_service import BudgetService
from app.utils.audit import log_audit

logger = logging.getLogger(__name__)

expenses_bp = Blueprint('expenses', __name__)
storage_service = StorageService()


# ========== SCHEMAS ==========

class ExpenseCreateSchema(Schema):
    amount = fields.Decimal(required=True, places=2, validate=validate.Range(min=0.01))
    category_id = fields.Str(required=True)
    description = fields.Str(allow_none=True, validate=validate.Length(max=500))
    expense_date = fields.Date(load_default=date.today)
    tags = fields.List(fields.Str(validate=validate.Length(max=50)), load_default=[])


class ExpenseUpdateSchema(Schema):
    amount = fields.Decimal(places=2, validate=validate.Range(min=0.01))
    category_id = fields.Str()
    description = fields.Str(allow_none=True, validate=validate.Length(max=500))
    expense_date = fields.Date()
    tags = fields.List(fields.Str(validate=validate.Length(max=50)))


# ========== ENDPOINTS ==========

@expenses_bp.route('', methods=['GET'])
@jwt_required()
@limiter.limit("100 per minute")
def list_expenses():
    """List expenses with filters and pagination"""
    # Parse filters
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    category_id = request.args.get('category_id')
    min_amount = request.args.get('min_amount', type=float)
    max_amount = request.args.get('max_amount', type=float)
    search = request.args.get('search')
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)

    query = Expense.query.filter_by(
        user_id=current_user.id,
        is_deleted=False
    )

    # Apply filters
    if start_date:
        query = query.filter(Expense.expense_date >= start_date)

    if end_date:
        query = query.filter(Expense.expense_date <= end_date)

    if category_id:
        query = query.filter(Expense.category_id == category_id)

    if min_amount is not None:
        query = query.filter(Expense.amount >= min_amount)

    if max_amount is not None:
        query = query.filter(Expense.amount <= max_amount)

    if search:
        search_term = f"%{search}%"
        query = query.filter(Expense.description.ilike(search_term))

    # Order and paginate
    query = query.order_by(Expense.expense_date.desc(), Expense.created_at.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'expenses': [e.to_dict() for e in pagination.items],
        'pagination': {
            'page': pagination.page,
            'per_page': pagination.per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }
    }), 200


@expenses_bp.route('', methods=['POST'])
@jwt_required()
@limiter.limit("50 per minute")
def create_expense():
    """Create new expense"""
    try:
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = ExpenseCreateSchema().load(request.form.to_dict())
        else:
            data = ExpenseCreateSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({'error': 'Validation error', 'details': err.messages}), 400

    # Verify category belongs to user
    category = Category.query.filter_by(
        id=str(data['category_id']),
        user_id=current_user.id,
        is_active=True
    ).first()

    if not category:
        return jsonify({'error': 'Category not found'}), 404

    # Create expense
    expense = Expense(
        user_id=current_user.id,
        category_id=str(data['category_id']),
        amount=data['amount'],
        description=data.get('description'),
        expense_date=data.get('expense_date', date.today()),
        tags=data.get('tags', [])
    )

    db.session.add(expense)

    # Handle attachment if exists
    if 'attachment' in request.files:
        file = request.files['attachment']
        if file and file.filename:
            try:
                attachment = storage_service.upload_attachment(file, expense)
                expense.attachments.append(attachment)
            except Exception as e:
                current_app.logger.error(f"Error uploading attachment: {e}")

    db.session.commit()

    # Disparar verificación de umbrales de forma asíncrona (no bloquear si falla)
    try:
        from app.tasks.notification_tasks import check_budget_threshold_task
        check_budget_threshold_task.delay(
            user_id=current_user.id,
            expense_amount=float(expense.amount)
        )
    except Exception as e:
        # Log error but don't fail the request
        logger.debug(f"Threshold check task: {e}")

    # Log audit
    log_audit(
        user_id=current_user.id,
        entity_type='expense',
        entity_id=expense.id,
        action='create',
        new_values=expense.to_dict()
    )

    return jsonify({
        'message': 'Expense created successfully',
        'expense': expense.to_dict()
    }), 201


@expenses_bp.route('/quick', methods=['POST'])
@jwt_required()
@limiter.limit("100 per minute")
def quick_expense():
    """Quick expense registration - optimized for <5 seconds"""
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    amount = data.get('amount')
    category_id = data.get('category_id')

    if not amount or not category_id:
        return jsonify({'error': 'amount and category_id are required'}), 400

    try:
        amount = float(amount)
        if amount <= 0:
            raise ValueError("Amount must be positive")
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid amount'}), 400

    # Verify category
    category = Category.query.filter_by(
        id=category_id,
        user_id=current_user.id,
        is_active=True
    ).first()

    if not category:
        return jsonify({'error': 'Category not found'}), 404

    # Create quick expense
    expense = Expense(
        user_id=current_user.id,
        category_id=category_id,
        amount=amount,
        description=data.get('note'),
        expense_date=date.today(),
        tags=[]
    )

    db.session.add(expense)
    db.session.commit()

    # Disparar verificación de umbrales de forma asíncrona (no bloquear si falla)
    try:
        from app.tasks.notification_tasks import check_budget_threshold_task
        check_budget_threshold_task.delay(
            user_id=current_user.id,
            expense_amount=float(expense.amount)
        )
    except Exception as e:
        # Log error but don't fail the request
        logger.debug(f"Threshold check task: {e}")

    # Calculate new risk indicator (no bloquear si falla)
    try:
        risk_indicator = BudgetService.get_risk_indicator(current_user.id)
    except Exception as e:
        # Log error and return default risk indicator
        logger.error(f"Failed to get risk indicator: {e}", exc_info=True)
        risk_indicator = {
            'level': 'grey',
            'percentage': 0,
            'spent': 0,
            'budget': 0,
            'remaining': 0,
            'message': 'No hay presupuesto activo'
        }

    return jsonify({
        'success': True,
        'expense': {
            'id': expense.id,
            'amount': float(expense.amount),
            'category': category.name
        },
        'risk_indicator': risk_indicator
    }), 201


@expenses_bp.route('/<expense_id>', methods=['GET'])
@jwt_required()
def get_expense(expense_id):
    """Get expense detail"""
    expense = Expense.query.filter_by(
        id=expense_id,
        user_id=current_user.id,
        is_deleted=False
    ).first()

    if not expense:
        return jsonify({'error': 'Expense not found'}), 404

    return jsonify({'expense': expense.to_dict()}), 200


@expenses_bp.route('/<expense_id>', methods=['PUT'])
@jwt_required()
def update_expense(expense_id):
    """Update an existing expense"""
    expense = Expense.query.filter_by(
        id=expense_id,
        user_id=current_user.id,
        is_deleted=False
    ).first()

    if not expense:
        return jsonify({'error': 'Expense not found'}), 404

    try:
        data = ExpenseUpdateSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({'error': 'Validation error', 'details': err.messages}), 400

    if not data:
        return jsonify({'error': 'No data to update'}), 400

    # Save old values for audit
    old_values = expense.to_dict()

    # Update fields
    if 'amount' in data:
        expense.amount = data['amount']

    if 'category_id' in data:
        category = Category.query.filter_by(
            id=str(data['category_id']),
            user_id=current_user.id,
            is_active=True
        ).first()
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        expense.category_id = str(data['category_id'])

    if 'description' in data:
        expense.description = data['description']

    if 'expense_date' in data:
        expense.expense_date = data['expense_date']

    if 'tags' in data:
        expense.tags = data['tags']

    db.session.commit()

    # Log audit
    log_audit(
        user_id=current_user.id,
        entity_type='expense',
        entity_id=expense.id,
        action='update',
        old_values=old_values,
        new_values=expense.to_dict()
    )

    return jsonify({
        'message': 'Expense updated successfully',
        'expense': expense.to_dict()
    }), 200


@expenses_bp.route('/<expense_id>', methods=['DELETE'])
@jwt_required()
def delete_expense(expense_id):
    """Delete expense (soft delete)"""
    expense = Expense.query.filter_by(
        id=expense_id,
        user_id=current_user.id,
        is_deleted=False
    ).first()

    if not expense:
        return jsonify({'error': 'Expense not found'}), 404

    data = request.get_json() or {}
    reason = data.get('reason')

    # Save values for audit
    old_values = expense.to_dict()

    # Soft delete
    expense.soft_delete(reason=reason)
    db.session.commit()

    # Log audit
    log_audit(
        user_id=current_user.id,
        entity_type='expense',
        entity_id=expense.id,
        action='delete',
        old_values=old_values,
        reason=reason
    )

    return jsonify({'message': 'Expense deleted successfully'}), 200
