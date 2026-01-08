#!/usr/bin/env python
"""Seed database with sample data for development."""
import sys
import os
from datetime import date, timedelta
from decimal import Decimal

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from app import create_app
from app.extensions import db
from app.models import User, UserProfile, Category, Budget, Expense

def seed_database():
    """Seed database with sample data."""
    app = create_app('development')

    with app.app_context():
        # Check if data already exists
        if User.query.count() > 0:
            print("Database already has data. Skipping seed.")
            return

        print("Seeding database...")

        # Create test user
        user = User(email='test@example.com')
        user.set_password('Test1234!')
        user.is_verified = True
        db.session.add(user)
        db.session.flush()

        # Create profile
        profile = UserProfile(
            user_id=user.id,
            first_name='Usuario',
            last_name='Demo',
            currency_code='MXN'
        )
        db.session.add(profile)

        # Create categories
        categories_data = [
            {'name': 'Alimentación', 'icon': '🍔', 'color': '#EF4444'},
            {'name': 'Transporte', 'icon': '🚗', 'color': '#F59E0B'},
            {'name': 'Entretenimiento', 'icon': '🎬', 'color': '#8B5CF6'},
            {'name': 'Servicios', 'icon': '💡', 'color': '#3B82F6'},
            {'name': 'Salud', 'icon': '🏥', 'color': '#10B981'},
            {'name': 'Compras', 'icon': '🛍️', 'color': '#EC4899'},
            {'name': 'Educación', 'icon': '📚', 'color': '#6366F1'},
            {'name': 'Otros', 'icon': '📦', 'color': '#6B7280'}
        ]

        categories = []
        for i, cat_data in enumerate(categories_data):
            cat = Category(
                user_id=user.id,
                name=cat_data['name'],
                icon=cat_data['icon'],
                color=cat_data['color'],
                is_default=True,
                sort_order=i
            )
            db.session.add(cat)
            categories.append(cat)

        db.session.flush()

        # Create budget
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)

        budget = Budget(
            user_id=user.id,
            total_amount=Decimal('6000.00'),
            period_start=week_start,
            period_end=week_end,
            is_active=True
        )
        db.session.add(budget)

        # Create sample expenses
        sample_expenses = [
            {'amount': 150.00, 'category': 0, 'desc': 'Almuerzo', 'days_ago': 0},
            {'amount': 45.00, 'category': 1, 'desc': 'Uber', 'days_ago': 0},
            {'amount': 890.00, 'category': 0, 'desc': 'Supermercado', 'days_ago': 1},
            {'amount': 200.00, 'category': 2, 'desc': 'Cine', 'days_ago': 2},
            {'amount': 350.00, 'category': 3, 'desc': 'Internet', 'days_ago': 3},
            {'amount': 120.00, 'category': 5, 'desc': 'Ropa', 'days_ago': 4},
            {'amount': 500.00, 'category': 4, 'desc': 'Consulta médica', 'days_ago': 5},
            {'amount': 95.00, 'category': 1, 'desc': 'Gasolina', 'days_ago': 6},
        ]

        for exp_data in sample_expenses:
            expense = Expense(
                user_id=user.id,
                category_id=categories[exp_data['category']].id,
                amount=Decimal(str(exp_data['amount'])),
                description=exp_data['desc'],
                expense_date=today - timedelta(days=exp_data['days_ago'])
            )
            db.session.add(expense)

        db.session.commit()

        print(f"Created test user: test@example.com / Test1234!")
        print(f"Created {len(categories)} categories")
        print(f"Created 1 budget: ${budget.total_amount}")
        print(f"Created {len(sample_expenses)} sample expenses")
        print("Database seeded successfully!")

if __name__ == '__main__':
    seed_database()
