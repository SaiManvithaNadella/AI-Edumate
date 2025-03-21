# backend/tests/test_progress.py

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_token():
    response = client.post("/auth/signup", json={"email": "progress@example.com", "password": "password123"})
    return response.json().get("access_token")

def test_update_and_get_progress():
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}
    update_data = {
        "user_email": "progress@example.com",
        "course_id": 1,
        "module_id": 1,
        "lesson_id": 1,
        "progress": 50.0
    }
    response = client.post("/progress/update", json=update_data, headers=headers)
    assert response.status_code == 200

    get_data = {"user_email": "progress@example.com", "course_id": 1}
    response = client.post("/progress/get", json=get_data, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "progress_data" in data
