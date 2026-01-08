import pytest
from app.models import User

def test_register_success(client, session):
    """Test successful user registration."""
    response = client.post('/api/v1/auth/register', json={
        'email': 'newuser@test.com',
        'password': 'Test1234!'
    })

    assert response.status_code == 201
    data = response.get_json()
    assert 'access_token' in data
    assert 'refresh_token' in data
    assert data['user']['email'] == 'newuser@test.com'

def test_register_duplicate_email(client, session):
    """Test registration with duplicate email."""
    # First registration
    client.post('/api/v1/auth/register', json={
        'email': 'duplicate@test.com',
        'password': 'Test1234!'
    })

    # Second registration with same email
    response = client.post('/api/v1/auth/register', json={
        'email': 'duplicate@test.com',
        'password': 'Test1234!'
    })

    assert response.status_code == 409
    assert 'already registered' in response.get_json()['error']

def test_register_weak_password(client, session):
    """Test registration with weak password."""
    response = client.post('/api/v1/auth/register', json={
        'email': 'weak@test.com',
        'password': '123'
    })

    assert response.status_code == 400

def test_login_success(client, session):
    """Test successful login."""
    # Register first
    client.post('/api/v1/auth/register', json={
        'email': 'login@test.com',
        'password': 'Test1234!'
    })

    # Login
    response = client.post('/api/v1/auth/login', json={
        'email': 'login@test.com',
        'password': 'Test1234!'
    })

    assert response.status_code == 200
    data = response.get_json()
    assert 'access_token' in data

def test_login_invalid_credentials(client, session):
    """Test login with invalid credentials."""
    response = client.post('/api/v1/auth/login', json={
        'email': 'nonexistent@test.com',
        'password': 'WrongPass!'
    })

    assert response.status_code == 401
