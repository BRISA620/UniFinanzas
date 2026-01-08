from datetime import date, timedelta
from decimal import Decimal
from sqlalchemy import func

from app.extensions import db
from app.models import Budget, Expense, UserProfile, Category, Payment


class BudgetService:

    @staticmethod
    def get_current_budget(user_id):
        """Get the active budget for the user"""
        today = date.today()

        budget = Budget.query.filter(
            Budget.user_id == user_id,
            Budget.is_active == True,
            Budget.period_start <= today,
            Budget.period_end >= today
        ).first()

        return budget

    @staticmethod
    def get_period_expenses(user_id, start_date, end_date):
        """Get total expenses in a period"""
        total = db.session.query(
            func.coalesce(func.sum(Expense.amount), 0)
        ).filter(
            Expense.user_id == user_id,
            Expense.is_deleted == False,
            Expense.expense_date >= start_date,
            Expense.expense_date <= end_date
        ).scalar()

        return Decimal(str(total))

    @staticmethod
    def get_expenses_by_category(user_id, start_date, end_date, include_payments=False):
        """Get expenses grouped by category"""
        results = db.session.query(
            Category.id,
            Category.name,
            Category.icon,
            Category.color,
            func.coalesce(func.sum(Expense.amount), 0).label('total')
        ).outerjoin(
            Expense,
            (Expense.category_id == Category.id) &
            (Expense.user_id == user_id) &
            (Expense.is_deleted == False) &
            (Expense.expense_date >= start_date) &
            (Expense.expense_date <= end_date)
        ).filter(
            Category.user_id == user_id,
            Category.is_active == True
        ).group_by(
            Category.id, Category.name, Category.icon, Category.color
        ).order_by(
            func.sum(Expense.amount).desc().nullslast()
        ).all()

        categories = []
        totals_by_id = {}

        for r in results:
            entry = {
                'category_id': str(r.id),
                'name': r.name,
                'icon': r.icon,
                'color': r.color,
                'total': float(r.total)
            }
            categories.append(entry)
            totals_by_id[entry['category_id']] = entry

        if include_payments:
            payments = Payment.query.filter(
                Payment.user_id == user_id,
                Payment.is_paid == False,
                Payment.due_date >= start_date,
                Payment.due_date <= end_date
            ).all()

            other_entry = None
            other_category = Category.query.filter(
                Category.user_id == user_id,
                Category.is_active == True,
                func.lower(Category.name) == 'otros'
            ).first()

            for payment in payments:
                entry = totals_by_id.get(str(payment.category_id)) if payment.category_id else None
                if entry:
                    entry['total'] += float(payment.amount)
                    continue

                if other_entry is None:
                    if other_category:
                        other_entry = totals_by_id.get(str(other_category.id))
                    if other_entry is None:
                        other_entry = {
                            'category_id': str(other_category.id) if other_category else 'otros',
                            'name': other_category.name if other_category else 'Otros',
                            'icon': other_category.icon if other_category else 'more-horizontal',
                            'color': other_category.color if other_category else '#6B7280',
                            'total': 0.0
                        }
                        categories.append(other_entry)
                        totals_by_id[other_entry['category_id']] = other_entry

                other_entry['total'] += float(payment.amount)

            categories = sorted(categories, key=lambda item: item['total'], reverse=True)

        return categories

    @staticmethod
    def get_risk_indicator(user_id):
        """Calculate risk indicator (traffic light)"""
        budget = BudgetService.get_current_budget(user_id)

        if not budget:
            return {
                'level': 'grey',
                'percentage': 0,
                'spent': 0,
                'budget': 0,
                'remaining': 0,
                'message': 'No hay presupuesto activo'
            }

        # Get accumulated spending
        spent = BudgetService.get_period_expenses(
            user_id,
            budget.period_start,
            budget.period_end
        )

        # Calculate percentage
        percentage = float((spent / budget.total_amount) * 100)
        remaining = float(budget.total_amount - spent)

        # Get user thresholds
        profile = UserProfile.query.filter_by(user_id=user_id).first()
        thresholds = profile.risk_thresholds if profile else {'yellow': 60, 'red': 85}

        # Determine risk level
        if percentage >= thresholds['red']:
            level = 'red'
            message = '¡Alerta! Has superado el umbral crítico de gasto'
        elif percentage >= thresholds['yellow']:
            level = 'yellow'
            message = 'Precaución: Te acercas al límite de tu presupuesto'
        else:
            level = 'green'
            message = 'Tu gasto está bajo control'

        return {
            'level': level,
            'percentage': round(percentage, 2),
            'spent': float(spent),
            'budget': float(budget.total_amount),
            'remaining': remaining,
            'message': message,
            'period_start': budget.period_start.isoformat(),
            'period_end': budget.period_end.isoformat()
        }

    @staticmethod
    def create_weekly_budget(user_id, amount, allocations=None):
        """Create a new weekly budget"""
        profile = UserProfile.query.filter_by(user_id=user_id).first()

        # Calculate week start/end based on user configuration
        today = date.today()
        closing_day = profile.weekly_closing_day if profile else 0  # Default: Sunday

        # Calculate current period start
        days_since_closing = (today.weekday() - closing_day) % 7
        period_start = today - timedelta(days=days_since_closing)
        period_end = period_start + timedelta(days=6)

        # Deactivate previous budgets
        Budget.query.filter_by(
            user_id=user_id,
            is_active=True
        ).update({'is_active': False})

        # Create new budget
        budget = Budget(
            user_id=user_id,
            total_amount=amount,
            period_start=period_start,
            period_end=period_end,
            is_active=True
        )

        db.session.add(budget)
        db.session.flush()

        # Add category allocations if provided
        if allocations:
            from app.models import BudgetAllocation
            for alloc in allocations:
                allocation = BudgetAllocation(
                    budget_id=budget.id,
                    category_id=alloc['category_id'],
                    allocated_amount=alloc['amount']
                )
                db.session.add(allocation)

        db.session.commit()

        return budget

    @staticmethod
    def get_daily_spending(user_id, start_date, end_date):
        """Get daily spending breakdown with accumulated totals"""
        # Query expenses grouped by date
        daily_expenses = db.session.query(
            Expense.expense_date,
            func.sum(Expense.amount).label('amount')
        ).filter(
            Expense.user_id == user_id,
            Expense.is_deleted == False,
            Expense.expense_date >= start_date,
            Expense.expense_date <= end_date
        ).group_by(
            Expense.expense_date
        ).order_by(
            Expense.expense_date
        ).all()

        # Create a dictionary for quick lookup
        expenses_by_date = {row.expense_date: float(row.amount) for row in daily_expenses}

        # Generate complete date range
        daily_data = []
        current_date = start_date
        accumulated = 0.0

        while current_date <= end_date:
            daily_amount = expenses_by_date.get(current_date, 0.0)
            accumulated += daily_amount

            daily_data.append({
                'date': current_date.isoformat(),
                'daily_amount': round(daily_amount, 2),
                'accumulated': round(accumulated, 2)
            })

            current_date += timedelta(days=1)

        return daily_data
