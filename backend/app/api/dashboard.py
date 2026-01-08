from flask import Blueprint, jsonify, current_app
from flask_jwt_extended import jwt_required, current_user
from datetime import date, timedelta
import logging

from app.extensions import cache
from app.models import Expense
from app.services.budget_service import BudgetService

dashboard_bp = Blueprint('dashboard', __name__)
logger = logging.getLogger(__name__)


@dashboard_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_summary():
    """Get dashboard summary with all key metrics"""
    try:
        logger.info(f"Dashboard summary requested by user {current_user.id}")

        # Note: Cache removed to ensure real-time updates after expense creation
        budget = BudgetService.get_current_budget(current_user.id)

        # Current budget info
        current_budget = None
        if budget:
            spent = BudgetService.get_period_expenses(
                current_user.id,
                budget.period_start,
                budget.period_end
            )
            remaining = float(budget.total_amount) - float(spent)
            percentage = (float(spent) / float(budget.total_amount)) * 100 if budget.total_amount > 0 else 0

            current_budget = {
                'id': budget.id,
                'total': float(budget.total_amount),
                'spent': float(spent),
                'remaining': remaining,
                'percentage': round(percentage, 2),
                'period_start': budget.period_start.isoformat(),
                'period_end': budget.period_end.isoformat()
            }

        # Risk indicator
        risk_indicator = BudgetService.get_risk_indicator(current_user.id)

        # Recent expenses (last 10) - ordered by creation time to show newest first
        recent_expenses = Expense.query.filter_by(
            user_id=current_user.id,
            is_deleted=False
        ).order_by(Expense.created_at.desc()).limit(10).all()

        # Category breakdown
        category_breakdown = []
        if budget:
            breakdown = BudgetService.get_expenses_by_category(
                current_user.id,
                budget.period_start,
                budget.period_end
            )
            total_spent = sum([c['total'] for c in breakdown])
            for cat in breakdown:
                cat['percentage'] = round((cat['total'] / total_spent * 100) if total_spent > 0 else 0, 2)
            category_breakdown = breakdown

        # Weekly trend (last 4 weeks)
        weekly_trend = []
        for i in range(4):
            week_end = date.today() - timedelta(days=i * 7)
            week_start = week_end - timedelta(days=6)
            amount = BudgetService.get_period_expenses(current_user.id, week_start, week_end)
            weekly_trend.append({
                'week_start': week_start.isoformat(),
                'week_end': week_end.isoformat(),
                'amount': float(amount)
            })
        weekly_trend.reverse()

        logger.info(f"Dashboard summary loaded successfully for user {current_user.id}")

        return jsonify({
            'current_budget': current_budget,
            'risk_indicator': risk_indicator,
            'recent_expenses': [e.to_dict() for e in recent_expenses],
            'category_breakdown': category_breakdown,
            'weekly_trend': weekly_trend
        }), 200

    except Exception as e:
        logger.error(f"Dashboard summary error for user {current_user.id}: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Error al cargar dashboard',
            'details': str(e) if current_app.debug else 'Internal server error'
        }), 500


@dashboard_bp.route('/risk-indicator', methods=['GET'])
@jwt_required()
def get_risk_indicator():
    """Get risk indicator (traffic light)"""
    try:
        indicator = BudgetService.get_risk_indicator(current_user.id)
        return jsonify(indicator), 200
    except Exception as e:
        logger.error(f"Risk indicator error for user {current_user.id}: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Error al cargar indicador de riesgo',
            'details': str(e) if current_app.debug else 'Internal server error'
        }), 500


@dashboard_bp.route('/quick-stats', methods=['GET'])
@jwt_required()
def get_quick_stats():
    """Get quick statistics"""
    try:
        today = date.today()

        # Today's expenses
        today_spent = BudgetService.get_period_expenses(current_user.id, today, today)

        # This week
        week_start = today - timedelta(days=today.weekday())
        week_spent = BudgetService.get_period_expenses(current_user.id, week_start, today)

        # This month
        month_start = today.replace(day=1)
        month_spent = BudgetService.get_period_expenses(current_user.id, month_start, today)

        # Total expenses count
        total_expenses = Expense.query.filter_by(
            user_id=current_user.id,
            is_deleted=False
        ).count()

        return jsonify({
            'today_spent': float(today_spent),
            'week_spent': float(week_spent),
            'month_spent': float(month_spent),
            'total_expenses': total_expenses
        }), 200

    except Exception as e:
        logger.error(f"Quick stats error for user {current_user.id}: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Error al cargar estadísticas',
            'details': str(e) if current_app.debug else 'Internal server error'
        }), 500
