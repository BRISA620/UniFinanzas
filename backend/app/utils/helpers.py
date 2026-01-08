from datetime import date, timedelta
from decimal import Decimal


def get_week_bounds(reference_date=None, closing_day=0):
    """Get start and end of week based on closing day"""
    if reference_date is None:
        reference_date = date.today()

    # Calculate days since closing day
    days_since_closing = (reference_date.weekday() - closing_day) % 7
    week_start = reference_date - timedelta(days=days_since_closing)
    week_end = week_start + timedelta(days=6)

    return week_start, week_end


def get_month_bounds(year=None, month=None):
    """Get start and end of month"""
    if year is None or month is None:
        today = date.today()
        year = today.year
        month = today.month

    month_start = date(year, month, 1)

    if month == 12:
        month_end = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        month_end = date(year, month + 1, 1) - timedelta(days=1)

    return month_start, month_end


def format_currency(amount, currency_code='MXN'):
    """Format amount as currency"""
    if isinstance(amount, Decimal):
        amount = float(amount)

    symbols = {
        'MXN': '$',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'CAD': 'C$',
        'ARS': '$',
        'CLP': '$',
        'COP': '$',
        'PEN': 'S/',
        'BRL': 'R$'
    }

    symbol = symbols.get(currency_code, '$')
    return f"{symbol}{amount:,.2f}"


def calculate_percentage(part, whole):
    """Calculate percentage safely"""
    if whole == 0:
        return 0
    return round((float(part) / float(whole)) * 100, 2)


def days_between(start_date, end_date):
    """Calculate days between two dates"""
    if isinstance(start_date, str):
        start_date = date.fromisoformat(start_date)
    if isinstance(end_date, str):
        end_date = date.fromisoformat(end_date)

    return (end_date - start_date).days
