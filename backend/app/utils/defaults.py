"""
Utility functions for creating default data for new users
"""
from app.models import Category
from app.extensions import db


DEFAULT_CATEGORIES = [
    {'name': 'Alimentacion', 'icon': 'utensils', 'color': '#EF4444', 'category_type': 'expense'},
    {'name': 'Transporte', 'icon': 'car', 'color': '#F59E0B', 'category_type': 'expense'},
    {'name': 'Entretenimiento', 'icon': 'film', 'color': '#8B5CF6', 'category_type': 'expense'},
    {'name': 'Servicios', 'icon': 'wrench', 'color': '#3B82F6', 'category_type': 'expense'},
    {'name': 'Salud', 'icon': 'heart-pulse', 'color': '#10B981', 'category_type': 'expense'},
    {'name': 'Compras', 'icon': 'shopping-bag', 'color': '#EC4899', 'category_type': 'expense'},
    {'name': 'Educacion', 'icon': 'graduation-cap', 'color': '#6366F1', 'category_type': 'expense'},
    {'name': 'Otros', 'icon': 'more-horizontal', 'color': '#6B7280', 'category_type': 'expense'}
]


def create_default_categories(user_id: str, commit: bool = True):
    """
    Create default categories for a new user

    Args:
        user_id: User ID to create categories for
        commit: Whether to commit the transaction (default True)

    Returns:
        List of created Category objects
    """
    categories = []

    for i, cat in enumerate(DEFAULT_CATEGORIES):
        category = Category(
            user_id=user_id,
            name=cat['name'],
            icon=cat['icon'],
            color=cat['color'],
            category_type=cat.get('category_type', 'expense'),
            is_default=True,
            sort_order=i
        )
        db.session.add(category)
        categories.append(category)

    if commit:
        db.session.commit()

    return categories


def ensure_user_has_categories(user_id: str):
    """
    Ensure user has at least one category, create defaults if not

    Args:
        user_id: User ID to check

    Returns:
        Number of categories created (0 if user already had categories)
    """
    existing_count = Category.query.filter_by(
        user_id=user_id,
        is_active=True
    ).count()

    if existing_count == 0:
        create_default_categories(user_id, commit=True)
        return len(DEFAULT_CATEGORIES)

    return 0
