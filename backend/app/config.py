# backend/app/config.py

import os

# Secret key for JWT tokens
SECRET_KEY = os.environ.get("SECRET_KEY", "supersecretkey")

# Algorithm for JWT
ALGORITHM = "HS256"

# Database URL for SQLite
SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./app.db")
