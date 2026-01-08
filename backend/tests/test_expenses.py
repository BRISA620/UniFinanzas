import pytest
from decimal import Decimal

def create_test_user(client):
    """Helper to create and login test user."""
    response = client.post('/api/v1/auth/register', json={
        'email': 'expense_test@test.com',
        'password': 'Test1234!'
    })
    data = response.get_json()
    return data['access_token'], data['user']['id']

def get_auth_header(token):
    """Get authorization header."""
    return {'Authorization': f'Bearer {token}'}

def test_create_expense(client, session):
    """Test creating an expense."""
    token, user_id = create_test_user(client)

    # Get categories
    cat_response = client.get('/api/v1/categories', headers=get_auth_header(token))
    categories = cat_response.get_json()['categories']

    # Create expense
    response = client.post('/api/v1/expenses',
        headers=get_auth_header(token),
        json={
            'amount': 150.50,
            'category_id': categories[0]['id'],
            'description': 'Test expense'
        }
    )

    assert response.status_code == 201
    data = response.get_json()
    assert data['expense']['amount'] == 150.50
    assert data['expense']['description'] == 'Test expense'

def test_quick_expense(client, session):
    """Test quick expense registration."""
    token, user_id = create_test_user(client)

    # Get categories
    cat_response = client.get('/api/v1/categories', headers=get_auth_header(token))
    categories = cat_response.get_json()['categories']

    # Quick expense
    response = client.post('/api/v1/expenses/quick',
        headers=get_auth_header(token),
        json={
            'amount': 99.99,
            'category_id': categories[0]['id'],
            'note': 'Quick note'
        }
    )

    assert response.status_code == 201
    data = response.get_json()
    assert data['success'] is True
    assert 'risk_indicator' in data

def test_list_expenses(client, session):
    """Test listing expenses."""
    token, user_id = create_test_user(client)

    response = client.get('/api/v1/expenses', headers=get_auth_header(token))

    assert response.status_code == 200
    data = response.get_json()
    assert 'expenses' in data
    assert 'pagination' in data

def test_delete_expense_requires_reason(client, session):
    """Test that deleting expense requires a reason."""
    token, user_id = create_test_user(client)

    # Get categories
    cat_response = client.get('/api/v1/categories', headers=get_auth_header(token))
    categories = cat_response.get_json()['categories']

    # Create expense
    create_response = client.post('/api/v1/expenses',
        headers=get_auth_header(token),
        json={
            'amount': 100,
            'category_id': categories[0]['id']
        }
    )
    expense_id = create_response.get_json()['expense']['id']

    # Try to delete without reason
    response = client.delete(f'/api/v1/expenses/{expense_id}',
        headers=get_auth_header(token),
        json={}
    )

    assert response.status_code == 400
    assert 'reason' in response.get_json()['error'].lower()
