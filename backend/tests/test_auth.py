# backend/tests/test_auth.py

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_signup_and_login():
    signup_response = client.post("/auth/signup", json={"email": "test@example.com", "password": "testpassword"})
    assert signup_response.status_code == 200
    token = signup_response.json().get("access_token")
    assert token

    login_response = client.post("/auth/login", json={"email": "test@example.com", "password": "testpassword"})
    assert login_response.status_code == 200
    token = login_response.json().get("access_token")
    assert token
