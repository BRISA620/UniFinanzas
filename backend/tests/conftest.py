import pytest
from app import create_app
from app.extensions import db as _db

@pytest.fixture(scope='session')
def app():
    """Create application for testing."""
    app = create_app('testing')
    return app

@pytest.fixture(scope='session')
def db(app):
    """Create database tables."""
    with app.app_context():
        _db.create_all()
        yield _db
        _db.drop_all()

@pytest.fixture(scope='function')
def session(db):
    """Create a new database session for each test."""
    connection = db.engine.connect()
    transaction = connection.begin()

    options = dict(bind=connection, binds={})
    session = db.create_scoped_session(options=options)

    db.session = session

    yield session

    transaction.rollback()
    connection.close()
    session.remove()

@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """Create CLI runner."""
    return app.test_cli_runner()
