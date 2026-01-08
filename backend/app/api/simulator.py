from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, current_user
from decimal import Decimal
from datetime import date, timedelta
import calendar

from app.services.budget_service import BudgetService
from app.models import Category, UserProfile, Payment

simulator_bp = Blueprint('simulator', __name__)


@simulator_bp.route('/what-if', methods=['POST'])
@jwt_required()
def what_if_simulation():
    """Simulate 'What if' scenarios"""
    data = request.get_json() or {}
    adjustments = data.get('adjustments', [])
    simulation_type = data.get('simulation_type')

    # Get current budget
    budget = BudgetService.get_current_budget(current_user.id)
    if not budget:
        return jsonify({'error': 'No active budget found'}), 404

    # Get current spending by category
    current_spending = BudgetService.get_expenses_by_category(
        current_user.id,
        budget.period_start,
        budget.period_end
    )

    current_total = sum([c['total'] for c in current_spending])

    if simulation_type:
        try:
            budget_amount = float(budget.total_amount)
            current_total_amount = float(current_total)
            original_remaining = budget_amount - current_total_amount
            original_percentage = (current_total_amount / budget_amount * 100) if budget_amount > 0 else 0

            if simulation_type == 'add_expense':
                additional_expense = float(data.get('additional_expense', 0) or 0)
                if additional_expense <= 0:
                    return jsonify({'error': 'additional_expense must be greater than 0'}), 400
                simulated_spent = current_total_amount + additional_expense
                simulated_budget = budget_amount
            elif simulation_type == 'adjust_budget':
                new_budget_amount = float(data.get('new_budget_amount', 0) or 0)
                if new_budget_amount <= 0:
                    return jsonify({'error': 'new_budget_amount must be greater than 0'}), 400
                simulated_spent = current_total_amount
                simulated_budget = new_budget_amount
            else:
                return jsonify({'error': 'simulation_type is invalid'}), 400

            simulated_remaining = simulated_budget - simulated_spent
            simulated_percentage = (simulated_spent / simulated_budget * 100) if simulated_budget > 0 else 0

            profile = UserProfile.query.filter_by(user_id=current_user.id).first()
            thresholds = profile.risk_thresholds if profile else {'yellow': 60, 'red': 85}

            if simulated_percentage >= thresholds['red']:
                simulated_risk_level = 'red'
                recommendation = 'Riesgo alto: superarás el umbral crítico de presupuesto.'
            elif simulated_percentage >= thresholds['yellow']:
                simulated_risk_level = 'yellow'
                recommendation = 'Precaución: te acercas al límite de tu presupuesto.'
            else:
                simulated_risk_level = 'green'
                recommendation = 'Buen control: tu presupuesto sigue en un rango saludable.'

            return jsonify({
                'original_budget': budget_amount,
                'original_spent': current_total_amount,
                'original_remaining': original_remaining,
                'original_percentage': round(original_percentage, 2),
                'simulated_budget': simulated_budget,
                'simulated_spent': simulated_spent,
                'simulated_remaining': simulated_remaining,
                'simulated_percentage': round(simulated_percentage, 2),
                'simulated_risk_level': simulated_risk_level,
                'difference': simulated_remaining - original_remaining,
                'recommendation': recommendation
            }), 200
        except (TypeError, ValueError):
            return jsonify({'error': 'Invalid numeric values for simulation'}), 400

    if not adjustments:
        return jsonify({'error': 'Adjustments required'}), 400

    # Apply adjustments
    simulated_spending = []
    simulated_total = Decimal('0')

    for cat_spending in current_spending:
        cat_id = cat_spending['category_id']
        current_amount = Decimal(str(cat_spending['total']))

        # Check if there's an adjustment for this category
        adjustment = next(
            (adj for adj in adjustments if adj.get('category_id') == cat_id),
            None
        )

        if adjustment:
            percentage_change = Decimal(str(adjustment.get('percentage_change', 0)))
            new_amount = current_amount * (1 + percentage_change / 100)
        else:
            new_amount = current_amount

        simulated_spending.append({
            'category_id': cat_id,
            'name': cat_spending['name'],
            'icon': cat_spending['icon'],
            'color': cat_spending['color'],
            'current': float(current_amount),
            'simulated': float(new_amount),
            'difference': float(new_amount - current_amount)
        })

        simulated_total += new_amount

    # Calculate impact
    budget_amount = float(budget.total_amount)
    current_percentage = (float(current_total) / budget_amount * 100) if budget_amount > 0 else 0
    simulated_percentage = (float(simulated_total) / budget_amount * 100) if budget_amount > 0 else 0

    current_remaining = budget_amount - float(current_total)
    simulated_remaining = budget_amount - float(simulated_total)

    return jsonify({
        'current_state': {
            'total_spent': float(current_total),
            'remaining': current_remaining,
            'percentage_used': round(current_percentage, 2)
        },
        'simulated_state': {
            'total_spent': float(simulated_total),
            'remaining': simulated_remaining,
            'percentage_used': round(simulated_percentage, 2)
        },
        'impact': {
            'spending_difference': float(simulated_total - Decimal(str(current_total))),
            'percentage_difference': round(simulated_percentage - current_percentage, 2),
            'remaining_difference': simulated_remaining - current_remaining
        },
        'by_category': simulated_spending
    }), 200


@simulator_bp.route('/plan', methods=['POST'])
@jwt_required()
def build_monthly_plan():
    data = request.get_json() or {}

    def parse_amount(key):
        value = data.get(key, 0)
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    monthly_income = parse_amount('monthly_income')
    savings_goal = parse_amount('savings_goal') or 0
    fixed_expenses = parse_amount('fixed_expenses') or 0
    essential_expenses = parse_amount('essential_expenses') or 0
    use_calendar_payments = bool(data.get('use_calendar_payments'))
    exclude_payment_ids = set(data.get('exclude_payment_ids') or [])

    if monthly_income is None or monthly_income <= 0:
        return jsonify({'error': 'monthly_income must be greater than 0'}), 400

    for key, value in [
        ('savings_goal', savings_goal),
        ('fixed_expenses', fixed_expenses),
        ('essential_expenses', essential_expenses),
    ]:
        if key == 'fixed_expenses' and use_calendar_payments:
            continue
        if value < 0:
            return jsonify({'error': f'{key} must be 0 or greater'}), 400

    profile = UserProfile.query.filter_by(user_id=current_user.id).first()

    today = date.today()
    days_in_month = calendar.monthrange(today.year, today.month)[1]
    weeks_in_month = days_in_month / 7

    month_start = date(today.year, today.month, 1)
    month_end = date(today.year, today.month, days_in_month)

    payments_in_month = Payment.query.filter(
        Payment.user_id == current_user.id,
        Payment.due_date >= month_start,
        Payment.due_date <= month_end,
        Payment.is_paid == False
    ).order_by(Payment.due_date.asc()).all()

    included_payments = []
    if use_calendar_payments:
        included_payments = [p for p in payments_in_month if p.id not in exclude_payment_ids]

    calendar_total = sum(float(p.amount) for p in payments_in_month)
    included_total = sum(float(p.amount) for p in included_payments)

    fixed_expenses_source = 'manual'
    if use_calendar_payments:
        fixed_expenses = included_total
        fixed_expenses_source = 'calendar'
    spent_month_to_date = float(BudgetService.get_period_expenses(
        current_user.id,
        month_start,
        today
    ))

    closing_day = profile.weekly_closing_day if profile else 0
    days_since_closing = (today.weekday() - closing_day) % 7
    week_start = today - timedelta(days=days_since_closing)
    spent_week_to_date = float(BudgetService.get_period_expenses(
        current_user.id,
        week_start,
        today
    ))

    def build_scenario(label, savings_target, recommendation):
        available = monthly_income - fixed_expenses - savings_target
        feasible = available >= 0
        shortfall = abs(available) if not feasible else 0
        available = max(available, 0)

        essential = min(essential_expenses, available)
        discretionary = max(available - essential, 0)

        weekly_total = available / weeks_in_month
        weekly_essential = essential / weeks_in_month
        weekly_discretionary = discretionary / weeks_in_month

        expected_to_date = available * (today.day / days_in_month) if days_in_month > 0 else 0
        adherence_ratio = (spent_month_to_date / expected_to_date) if expected_to_date > 0 else 0
        adherence_status = 'on_track'
        if adherence_ratio >= 1.1:
            adherence_status = 'over'
        elif adherence_ratio <= 0.9:
            adherence_status = 'under'

        if not feasible:
            risk_level = 'red'
        else:
            cushion_ratio = (available / monthly_income) if monthly_income > 0 else 0
            if cushion_ratio < 0.1:
                risk_level = 'yellow'
            else:
                risk_level = 'green'

        return {
            'label': label,
            'savings_monthly': round(savings_target, 2),
            'available_monthly': round(available, 2),
            'essential_monthly': round(essential, 2),
            'discretionary_monthly': round(discretionary, 2),
            'weekly': {
                'total': round(weekly_total, 2),
                'essential': round(weekly_essential, 2),
                'discretionary': round(weekly_discretionary, 2),
            },
            'tracking': {
                'spent_week_to_date': round(spent_week_to_date, 2),
                'remaining_week': round(weekly_total - spent_week_to_date, 2),
                'week_exceeded': spent_week_to_date > weekly_total,
                'spent_month_to_date': round(spent_month_to_date, 2),
                'expected_month_to_date': round(expected_to_date, 2),
                'adherence_ratio': round(adherence_ratio, 2),
                'adherence_status': adherence_status,
            },
            'feasible': feasible,
            'shortfall': round(shortfall, 2),
            'risk_level': risk_level,
            'recommendation': recommendation,
        }

    scenarios = {
        'spend_all': build_scenario(
            'Gasto total',
            savings_goal * 0.5,
            'Reduces el ahorro para tener más liquidez este mes.'
        ),
        'normal': build_scenario(
            'Ahorro normal',
            savings_goal,
            'Mantienes tu objetivo de ahorro con gasto equilibrado.'
        ),
        'severe': build_scenario(
            'Ahorro severo',
            savings_goal * 1.5,
            'Priorizas el ahorro, reduciendo el gasto discrecional.'
        ),
    }

    return jsonify({
        'inputs': {
            'monthly_income': monthly_income,
            'savings_goal': savings_goal,
            'fixed_expenses': round(fixed_expenses, 2),
            'essential_expenses': essential_expenses,
            'use_calendar_payments': use_calendar_payments,
        },
        'fixed_expenses_used': round(fixed_expenses, 2),
        'fixed_expenses_source': fixed_expenses_source,
        'calendar_payments': {
            'month_start': month_start.isoformat(),
            'month_end': month_end.isoformat(),
            'total': round(calendar_total, 2),
            'included_total': round(included_total, 2),
            'included_ids': [p.id for p in included_payments],
            'payments': [
                {
                    'id': p.id,
                    'name': p.name,
                    'amount': float(p.amount),
                    'due_date': p.due_date.isoformat(),
                }
                for p in payments_in_month
            ],
        },
        'weeks_in_month': round(weeks_in_month, 2),
        'days_in_month': days_in_month,
        'scenarios': scenarios,
    }), 200


@simulator_bp.route('/recommendations', methods=['GET'])
@jwt_required()
def get_recommendations():
    """Get spending recommendations"""
    # Get current budget
    budget = BudgetService.get_current_budget(current_user.id)
    if not budget:
        return jsonify({'error': 'No active budget found'}), 404

    # Get current spending
    current_spending = BudgetService.get_expenses_by_category(
        current_user.id,
        budget.period_start,
        budget.period_end
    )

    current_total = sum([c['total'] for c in current_spending])
    budget_amount = float(budget.total_amount)
    percentage_used = (float(current_total) / budget_amount * 100) if budget_amount > 0 else 0

    recommendations = []

    # Analyze spending patterns
    if percentage_used > 85:
        # High spending - recommend cuts
        recommendations.append({
            'type': 'warning',
            'title': 'Gasto elevado',
            'message': f'Has usado {percentage_used:.1f}% de tu presupuesto. Considera reducir gastos en categorías no esenciales.',
            'priority': 'high'
        })

        # Find highest spending categories
        sorted_spending = sorted(current_spending, key=lambda x: x['total'], reverse=True)
        if sorted_spending:
            top_category = sorted_spending[0]
            recommendations.append({
                'type': 'suggestion',
                'title': f'Reduce {top_category["name"]}',
                'message': f'Tu mayor gasto es en {top_category["name"]} (${top_category["total"]:.2f}). Intenta reducir un 20%.',
                'category_id': top_category['category_id'],
                'suggested_reduction': 20,
                'priority': 'medium'
            })

    elif percentage_used > 60:
        # Moderate spending
        recommendations.append({
            'type': 'info',
            'title': 'Gasto moderado',
            'message': f'Has usado {percentage_used:.1f}% de tu presupuesto. Vas bien, pero mantén el control.',
            'priority': 'low'
        })

    else:
        # Good spending
        remaining = budget_amount - float(current_total)
        recommendations.append({
            'type': 'success',
            'title': 'Buen control de gastos',
            'message': f'Excelente! Te quedan ${remaining:.2f} disponibles esta semana.',
            'priority': 'low'
        })

        # Suggest saving
        savings_suggestion = remaining * 0.3  # Suggest saving 30% of remaining
        recommendations.append({
            'type': 'suggestion',
            'title': 'Oportunidad de ahorro',
            'message': f'Podrías ahorrar ${savings_suggestion:.2f} esta semana.',
            'priority': 'medium'
        })

    # Check for categories with no spending
    user_categories = Category.query.filter_by(
        user_id=current_user.id,
        is_active=True
    ).all()

    spending_category_ids = [c['category_id'] for c in current_spending if c['total'] > 0]
    unused_categories = [c for c in user_categories if c.id not in spending_category_ids]

    if unused_categories:
        recommendations.append({
            'type': 'info',
            'title': 'Categorías sin uso',
            'message': f'{len(unused_categories)} categoría(s) sin gastos registrados esta semana.',
            'priority': 'low'
        })

    return jsonify({
        'recommendations': recommendations,
        'current_stats': {
            'budget': budget_amount,
            'spent': float(current_total),
            'remaining': budget_amount - float(current_total),
            'percentage_used': round(percentage_used, 2)
        }
    }), 200
