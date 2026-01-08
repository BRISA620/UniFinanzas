import re


def validate_password_strength(password):
    """Validate password strength"""
    issues = []

    if len(password) < 8:
        issues.append("Password must be at least 8 characters long")

    if not re.search(r'[A-Z]', password):
        issues.append("Password must contain at least one uppercase letter")

    if not re.search(r'[a-z]', password):
        issues.append("Password must contain at least one lowercase letter")

    if not re.search(r'\d', password):
        issues.append("Password must contain at least one number")

    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        issues.append("Password must contain at least one special character")

    return {
        'valid': len(issues) == 0,
        'issues': issues
    }


def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_currency_code(code):
    """Validate ISO 4217 currency code"""
    valid_codes = ['MXN', 'USD', 'EUR', 'GBP', 'CAD', 'ARS', 'CLP', 'COP', 'PEN', 'BRL']
    return code.upper() in valid_codes


def sanitize_string(value, max_length=500):
    """Sanitize string input"""
    if not value:
        return value

    # Remove potential XSS
    value = value.replace('<', '&lt;').replace('>', '&gt;')
    value = value.replace('"', '&quot;').replace("'", '&#39;')

    # Truncate if needed
    if len(value) > max_length:
        value = value[:max_length]

    return value.strip()
