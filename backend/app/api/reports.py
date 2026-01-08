from datetime import date, timedelta
import csv
import io

from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import current_user, jwt_required

from app.models import Expense
from app.services.budget_service import BudgetService
from app.services.report_service import ReportService

reports_bp = Blueprint('reports', __name__)


def _get_payload():
    return request.get_json(silent=True) or {}


def _parse_date(value, field_name):
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        raise ValueError(f"{field_name} debe tener formato YYYY-MM-DD")


@reports_bp.route('/weekly', methods=['GET'])
@jwt_required()
def get_weekly_report():
    """Get weekly report data"""
    week_start_str = request.args.get('week_start')

    if week_start_str:
        week_start = date.fromisoformat(week_start_str)
    else:
        today = date.today()
        week_start = today - timedelta(days=today.weekday())

    week_end = week_start + timedelta(days=6)

    total_spent = BudgetService.get_period_expenses(current_user.id, week_start, week_end)
    by_category = BudgetService.get_expenses_by_category(current_user.id, week_start, week_end)

    daily_breakdown = []
    for i in range(7):
        day = week_start + timedelta(days=i)
        amount = BudgetService.get_period_expenses(current_user.id, day, day)
        daily_breakdown.append({
            'date': day.isoformat(),
            'day_name': day.strftime('%A'),
            'amount': float(amount)
        })

    return jsonify({
        'period': {
            'start': week_start.isoformat(),
            'end': week_end.isoformat()
        },
        'total_spent': float(total_spent),
        'by_category': by_category,
        'daily_breakdown': daily_breakdown
    }), 200


@reports_bp.route('/monthly', methods=['GET'])
@jwt_required()
def get_monthly_report():
    """Get monthly report data"""
    year = request.args.get('year', type=int, default=date.today().year)
    month = request.args.get('month', type=int, default=date.today().month)

    month_start = date(year, month, 1)
    if month == 12:
        month_end = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        month_end = date(year, month + 1, 1) - timedelta(days=1)

    total_spent = BudgetService.get_period_expenses(current_user.id, month_start, month_end)
    by_category = BudgetService.get_expenses_by_category(current_user.id, month_start, month_end)

    weekly_breakdown = []
    current_week_start = month_start
    while current_week_start <= month_end:
        current_week_end = min(current_week_start + timedelta(days=6), month_end)
        amount = BudgetService.get_period_expenses(current_user.id, current_week_start, current_week_end)
        weekly_breakdown.append({
            'week_start': current_week_start.isoformat(),
            'week_end': current_week_end.isoformat(),
            'amount': float(amount)
        })
        current_week_start = current_week_end + timedelta(days=1)

    return jsonify({
        'period': {
            'year': year,
            'month': month,
            'start': month_start.isoformat(),
            'end': month_end.isoformat()
        },
        'total_spent': float(total_spent),
        'by_category': by_category,
        'weekly_breakdown': weekly_breakdown
    }), 200


@reports_bp.route('/pdf', methods=['GET'])
@jwt_required()
def download_pdf():
    """Generate and download PDF report"""
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    report_type = request.args.get('report_type', 'custom')

    if not start_date_str or not end_date_str:
        return jsonify({'error': 'start_date y end_date son requeridos'}), 400

    try:
        start_date = _parse_date(start_date_str, 'start_date')
        end_date = _parse_date(end_date_str, 'end_date')

        if start_date > end_date:
            return jsonify({'error': 'start_date no puede ser mayor que end_date'}), 400

        pdf_buffer = ReportService.generate_pdf_report(
            user_id=current_user.id,
            report_type=report_type,
            start_date=start_date,
            end_date=end_date
        )

        filename = f"reporte_gastos_{start_date_str}_{end_date_str}.pdf"

        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400
    except Exception as exc:
        return jsonify({'error': f'Error al generar el PDF: {str(exc)}'}), 500


@reports_bp.route('/generate-pdf', methods=['POST'])
@jwt_required()
def generate_pdf():
    """Generate PDF report (async)"""
    data = _get_payload()
    report_type = data.get('report_type', 'weekly')
    start_date_str = data.get('start_date')
    end_date_str = data.get('end_date')
    send_email = data.get('send_email', False)

    if not start_date_str or not end_date_str:
        return jsonify({'error': 'start_date y end_date son requeridos'}), 400

    try:
        start_date = _parse_date(start_date_str, 'start_date')
        end_date = _parse_date(end_date_str, 'end_date')

        if start_date > end_date:
            return jsonify({'error': 'start_date no puede ser mayor que end_date'}), 400

        from app.tasks.report_tasks import generate_pdf_report_task

        task = generate_pdf_report_task.delay(
            user_id=current_user.id,
            report_type=report_type,
            start_date_str=start_date_str,
            end_date_str=end_date_str,
            send_email=send_email,
            user_email=current_user.email if send_email else None
        )

        return jsonify({
            'status': 'processing',
            'task_id': task.id,
            'message': 'Generacion de PDF en proceso.',
            'report_type': report_type,
            'period': f"{start_date_str} a {end_date_str}"
        }), 202
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400
    except Exception as exc:
        return jsonify({'error': f'Error al generar el PDF: {str(exc)}'}), 500


@reports_bp.route('/export/csv', methods=['GET', 'POST'])
@jwt_required()
def export_csv():
    """Export expenses to CSV"""
    data = _get_payload()
    start_date_str = request.args.get('start_date') or data.get('start_date')
    end_date_str = request.args.get('end_date') or data.get('end_date')
    include_categories = request.args.get('include_categories', None)
    if include_categories is None:
        include_categories = data.get('include_categories', True)
    include_categories = str(include_categories).lower() not in {'0', 'false', 'no'}

    query = Expense.query.filter_by(
        user_id=current_user.id,
        is_deleted=False
    )

    if start_date_str:
        start_date = _parse_date(start_date_str, 'start_date')
        query = query.filter(Expense.expense_date >= start_date)

    if end_date_str:
        end_date = _parse_date(end_date_str, 'end_date')
        query = query.filter(Expense.expense_date <= end_date)

    expenses = query.order_by(Expense.expense_date.asc(), Expense.created_at.asc()).all()

    output = io.StringIO()
    writer = csv.writer(output)

    headers = ['Fecha', 'Hora', 'Categoria', 'Monto', 'Moneda', 'Descripcion', 'Tags', 'Recurrente', 'ID', 'Creado']
    if not include_categories:
        headers.remove('Categoria')
    writer.writerow(headers)

    currency_code = current_user.profile.currency_code if current_user.profile else 'USD'

    for expense in expenses:
        row = [
            expense.expense_date.isoformat(),
            expense.expense_time.strftime('%H:%M') if expense.expense_time else '',
            expense.category.name if expense.category else 'Sin categoria',
            f"{float(expense.amount):.2f}",
            currency_code,
            expense.description or '',
            ', '.join(expense.tags) if expense.tags else '',
            'Si' if expense.is_recurring else 'No',
            expense.id,
            expense.created_at.isoformat() if expense.created_at else ''
        ]

        if not include_categories:
            row.pop(2)

        writer.writerow(row)

    output.seek(0)

    filename = (
        f"gastos_{start_date_str}_{end_date_str}.csv"
        if start_date_str and end_date_str
        else f"gastos_{date.today().isoformat()}.csv"
    )

    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8-sig')),
        mimetype='text/csv',
        as_attachment=True,
        download_name=filename
    )


@reports_bp.route('/export/google-sheets', methods=['POST'])
@jwt_required()
def export_google_sheets():
    """Export to Google Sheets"""
    return jsonify({
        'message': 'Google Sheets export no esta implementado todavia',
        'status': 'pending'
    }), 501
