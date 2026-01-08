from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, current_user
from marshmallow import Schema, fields, validate, ValidationError

from app.extensions import db
from app.models import Category
from app.utils.defaults import ensure_user_has_categories

categories_bp = Blueprint('categories', __name__)


# ========== SCHEMAS ==========

ALLOWED_CATEGORY_TYPES = {'expense', 'income'}


class CategoryCreateSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    icon = fields.Str(load_default='tag', validate=validate.Length(max=50))
    color = fields.Str(load_default='#6B7280', validate=validate.Length(max=7))
    category_type = fields.Str(
        load_default='expense',
        validate=validate.OneOf(ALLOWED_CATEGORY_TYPES)
    )
    monthly_limit = fields.Float(allow_none=True)
    description = fields.Str(allow_none=True, validate=validate.Length(max=255))


class CategoryUpdateSchema(Schema):
    name = fields.Str(validate=validate.Length(min=1, max=100))
    icon = fields.Str(validate=validate.Length(max=50))
    color = fields.Str(validate=validate.Length(max=7))
    category_type = fields.Str(validate=validate.OneOf(ALLOWED_CATEGORY_TYPES))
    monthly_limit = fields.Float(allow_none=True)
    description = fields.Str(allow_none=True, validate=validate.Length(max=255))
    sort_order = fields.Int()
    is_active = fields.Bool()


# ========== ENDPOINTS ==========

@categories_bp.route('', methods=['GET'])
@jwt_required()
def list_categories():
    """List user categories"""
    try:
        # Ensure user has categories (create defaults if none exist)
        ensure_user_has_categories(current_user.id)

        category_type = request.args.get('type', 'expense')
        include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'

        if category_type not in ALLOWED_CATEGORY_TYPES and category_type != 'all':
            return jsonify({'error': 'Invalid category type'}), 400

        query = Category.query.filter_by(user_id=current_user.id)

        if category_type != 'all':
            query = query.filter(Category.category_type == category_type)

        if not include_inactive:
            query = query.filter(Category.is_active == True)

        categories = query.order_by(Category.category_type, Category.sort_order, Category.name).all()

        return jsonify({
            'categories': [c.to_dict() for c in categories]
        }), 200
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Error listing categories: {e}", exc_info=True)
        return jsonify({
            'error': 'Error al cargar categorias',
            'details': str(e)
        }), 500


@categories_bp.route('', methods=['POST'])
@jwt_required()
def create_category():
    """Create new category"""
    try:
        data = CategoryCreateSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({'error': 'Validation error', 'details': err.messages}), 400

    # Check if category name already exists
    existing = Category.query.filter_by(
        user_id=current_user.id,
        name=data['name'],
        category_type=data.get('category_type', 'expense')
    ).first()

    if existing:
        return jsonify({'error': 'Category name already exists'}), 409

    # Get max sort order
    max_order = db.session.query(db.func.max(Category.sort_order)).filter_by(
        user_id=current_user.id
    ).scalar() or 0

    monthly_limit = data.get('monthly_limit')
    if monthly_limit is not None and monthly_limit < 0:
        return jsonify({'error': 'monthly_limit must be greater or equal to 0'}), 400

    category = Category(
        user_id=current_user.id,
        name=data['name'],
        icon=data.get('icon', 'tag'),
        color=data.get('color', '#6B7280'),
        category_type=data.get('category_type', 'expense'),
        monthly_limit=monthly_limit,
        description=data.get('description'),
        sort_order=max_order + 1
    )

    db.session.add(category)
    db.session.commit()

    return jsonify({
        'message': 'Category created successfully',
        'category': category.to_dict()
    }), 201


@categories_bp.route('/<category_id>', methods=['GET'])
@jwt_required()
def get_category(category_id):
    """Get category detail"""
    category = Category.query.filter_by(
        id=category_id,
        user_id=current_user.id
    ).first()

    if not category:
        return jsonify({'error': 'Category not found'}), 404

    return jsonify({'category': category.to_dict()}), 200


@categories_bp.route('/<category_id>', methods=['PUT'])
@jwt_required()
def update_category(category_id):
    """Update category"""
    category = Category.query.filter_by(
        id=category_id,
        user_id=current_user.id
    ).first()

    if not category:
        return jsonify({'error': 'Category not found'}), 404

    try:
        data = CategoryUpdateSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({'error': 'Validation error', 'details': err.messages}), 400

    if 'name' in data or 'category_type' in data:
        candidate_name = data.get('name', category.name)
        candidate_type = data.get('category_type', category.category_type)
        existing = Category.query.filter(
            Category.user_id == current_user.id,
            Category.name == candidate_name,
            Category.category_type == candidate_type,
            Category.id != category_id
        ).first()
        if existing:
            return jsonify({'error': 'Category name already exists'}), 409
        if 'name' in data:
            category.name = data['name']

    if 'icon' in data:
        category.icon = data['icon']

    if 'color' in data:
        category.color = data['color']

    if 'category_type' in data:
        category.category_type = data['category_type']

    if 'monthly_limit' in data:
        monthly_limit = data['monthly_limit']
        if monthly_limit is not None and monthly_limit < 0:
            return jsonify({'error': 'monthly_limit must be greater or equal to 0'}), 400
        category.monthly_limit = monthly_limit

    if 'description' in data:
        category.description = data['description']

    if 'sort_order' in data:
        category.sort_order = data['sort_order']

    if 'is_active' in data:
        if category.is_default and not data['is_active']:
            return jsonify({'error': 'Cannot deactivate default category'}), 400
        category.is_active = data['is_active']

    db.session.commit()

    return jsonify({
        'message': 'Category updated successfully',
        'category': category.to_dict()
    }), 200


@categories_bp.route('/<category_id>', methods=['DELETE'])
@jwt_required()
def deactivate_category(category_id):
    """Deactivate category (soft delete)"""
    category = Category.query.filter_by(
        id=category_id,
        user_id=current_user.id
    ).first()

    if not category:
        return jsonify({'error': 'Category not found'}), 404

    if category.is_default:
        return jsonify({'error': 'Cannot delete default category'}), 400

    # Check if category has expenses
    if category.expenses.count() > 0:
        # Soft delete - just mark as inactive
        category.is_active = False
        db.session.commit()
        return jsonify({
            'message': 'Category deactivated (has associated expenses)',
            'deactivated': True
        }), 200

    # Hard delete if no expenses
    db.session.delete(category)
    db.session.commit()

    return jsonify({'message': 'Category deleted successfully'}), 200
