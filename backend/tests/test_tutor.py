# backend/tests/test_tutor.py

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_tutor():
    # Signup to get a token
    response = client.post("/auth/signup", json={"email": "tutor@example.com", "password": "password123"})
    token = response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    tutor_response = client.post("/tutor/ask", json={"query": "What is AI?"}, headers=headers)
    assert tutor_response.status_code == 200
    data = tutor_response.json()
    assert "AI Tutor Response" in data.get("answer", "")
