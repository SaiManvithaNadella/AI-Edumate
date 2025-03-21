# backend/tests/test_quiz.py

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_token():
    response = client.post("/auth/signup", json={"email": "quiz@example.com", "password": "password123"})
    return response.json().get("access_token")

def test_generate_quiz():
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}
    module_content = "Module content dummy text for quiz."
    response = client.post("/quiz/", json={"module_content": module_content}, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "Quiz Questions" in data.get("quiz", "")
