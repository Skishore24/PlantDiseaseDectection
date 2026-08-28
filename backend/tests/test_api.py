import io
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app)


def create_test_image_bytes(format="JPEG", size=(224, 224), color=(34, 139, 34)):
    """Helper to generate a valid RGB test image in memory."""
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(buf, format=format)
    buf.seek(0)
    return buf.getvalue()


# ─────────────────────────────────────────────────────────────
# 1. Health Endpoint Tests
# ─────────────────────────────────────────────────────────────
def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "LeafGuard AI"
    assert "model" in data
    assert "disclaimer" in data


def test_root_status():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "LeafGuard AI"
    assert data["status"] == "online"


# ─────────────────────────────────────────────────────────────
# 2. Authentication Flow Tests
# ─────────────────────────────────────────────────────────────
@pytest.fixture(scope="module")
def auth_token():
    """Register/Login a test user and return the JWT bearer token."""
    email = "tester_agronomist@leafguard.ai"
    password = "StrongPassword123!"

    # Register
    reg_res = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Alex Agronomist",
            "email": email,
            "password": password,
            "role": "Lead Agronomist",
            "company": "GreenField Labs"
        }
    )

    if reg_res.status_code == 201:
        token = reg_res.json()["access_token"]
    else:
        # If already exists, login
        login_res = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password}
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]

    return token


def test_auth_me_endpoint(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "tester_agronomist@leafguard.ai"
    assert data["name"] == "Alex Agronomist"


def test_auth_unauthorized_access():
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


# ─────────────────────────────────────────────────────────────
# 3. Leaf Prediction & Image Validation Tests
# ─────────────────────────────────────────────────────────────
def test_predict_valid_image(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    img_bytes = create_test_image_bytes(format="JPEG")

    files = {
        "file": ("test_leaf.jpg", img_bytes, "image/jpeg")
    }

    response = client.post("/api/v1/predict", headers=headers, files=files)
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert "prediction" in data
    assert "plant" in data["prediction"]
    assert "disease" in data["prediction"]
    assert "class_name" in data["prediction"]
    assert "confidence" in data["prediction"]
    assert "severity" in data["prediction"]

    assert "top_predictions" in data
    assert len(data["top_predictions"]) >= 1
    assert "disease_info" in data
    assert "description" in data["disease_info"]
    assert "treatment" in data["disease_info"]
    assert "symptoms" in data["disease_info"]
    assert "prevention" in data["disease_info"]
    assert "disclaimer" in data


def test_predict_invalid_extension(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    files = {
        "file": ("document.pdf", b"%PDF-1.4 dummy file", "application/pdf")
    }
    response = client.post("/api/v1/predict", headers=headers, files=files)
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]


def test_predict_corrupted_image(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    files = {
        "file": ("fake.jpg", b"This is not a real JPEG image binary", "image/jpeg")
    }
    response = client.post("/api/v1/predict", headers=headers, files=files)
    assert response.status_code == 400
    assert "Corrupted or invalid image" in response.json()["detail"]


# ─────────────────────────────────────────────────────────────
# 4. History & Telemetry Tests
# ─────────────────────────────────────────────────────────────
def test_history_lifecycle(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}

    # Fetch history
    res = client.get("/api/v1/history", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "history" in data
    assert "total" in data

    if data["history"]:
        item = data["history"][0]
        item_id = item.get("id") or item.get("_id")

        # Fetch single
        single_res = client.get(f"/api/v1/history/{item_id}", headers=headers)
        assert single_res.status_code == 200
        assert single_res.json()["plant"] == item["plant"]

        # Delete single
        del_res = client.delete(f"/api/v1/history/{item_id}", headers=headers)
        assert del_res.status_code == 200
        assert del_res.json()["success"] is True


def test_analytics_endpoints(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}

    # Stats
    stats_res = client.get("/api/v1/stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "total_scans" in stats
    assert "top_disease" in stats

    # Analytics
    analytics_res = client.get("/api/v1/analytics", headers=headers)
    assert analytics_res.status_code == 200
    analytics = analytics_res.json()
    assert "totalScans" in analytics
    assert "healthyRatio" in analytics
    assert "weeklyActivity" in analytics
    assert "diseaseDistribution" in analytics
