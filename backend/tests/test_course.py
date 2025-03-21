# backend/tests/test_course.py

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_token():
    response = client.post("/auth/signup", json={"email": "course@example.com", "password": "password123"})
    return response.json().get("access_token")

def test_generate_outline():
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post("/course/outline", json={"topic": "Data Science"}, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "Course Title" in data.get("course_outline", "")

def test_generate_content():
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post("/course/content", json={"course_name": "Data Science 101", "module_name": "Introduction", "lesson_name": "Basics"}, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "Course:" in data.get("content", "")
