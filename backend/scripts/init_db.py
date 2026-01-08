#!/usr/bin/env python
"""Initialize the database with tables and seed data."""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from app import create_app
from app.extensions import db

def init_database():
    """Initialize database tables."""
    app = create_app('development')

    with app.app_context():
        print("Creating database tables...")
        db.create_all()
        print("Database tables created successfully!")

if __name__ == '__main__':
    init_database()
