import io
import uuid
import pytest
import numpy as np
from PIL import Image
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from backend.app import app
from backend.utils.security import validate_password_strength, verify_dummy_password
from backend.services.model_service import model_service
from backend.database import save_local_json

client = TestClient(app)


def create_test_image_bytes(format="JPEG", size=(224, 224), color=(34, 139, 34)):
    """Helper to generate a valid RGB test image in memory."""
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(buf, format=format)
    buf.seek(0)
    return buf.getvalue()


# ─────────────────────────────────────────────────────────────
# 1. Health & Root Endpoints
# ─────────────────────────────────────────────────────────────
def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "LeafGuard AI"
    assert "model" in data
    assert "database" in data
    assert "disclaimer" in data


def test_root_status():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "LeafGuard AI"
    assert data["status"] == "online"


# ─────────────────────────────────────────────────────────────
# 2. Authentication & Password Security
# ─────────────────────────────────────────────────────────────
def test_password_strength_validator():
    """Verify strict password complexity rules."""
    valid, msg = validate_password_strength("PlantPathology2026!#")
    assert valid is True

    valid, msg = validate_password_strength("Short1!")
    assert valid is False
    assert "at least 8 characters" in msg

    valid, msg = validate_password_strength("lowercase123!@#")
    assert valid is False
    assert "uppercase" in msg

    valid, msg = validate_password_strength("UPPERCASE123!@#")
    assert valid is False
    assert "lowercase" in msg

    valid, msg = validate_password_strength("NoNumbersHere!@#")
    assert valid is False
    assert "number" in msg

    valid, msg = validate_password_strength("NoSpecialChar123")
    assert valid is False
    assert "special character" in msg

    valid, msg = validate_password_strength("password123")
    assert valid is False
    assert "too common" in msg


def test_register_weak_password_rejected():
    """Ensure weak passwords are rejected during registration."""
    res = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Weak User",
            "email": "weak_user_1@example.com",
            "password": "weakpassword",
            "role": "Agronomist",
        }
    )
    assert res.status_code == 400
    assert "Password" in res.json()["detail"]


@pytest.fixture(scope="session")
def auth_token():
    """Register a fresh session test user with a strong password."""
    uid = uuid.uuid4().hex[:8]
    email = f"agronomist_{uid}@leafguard.ai"
    password = "StrongPassword2026!#"

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
    assert reg_res.status_code == 201
    return reg_res.json()["access_token"]


def test_auth_me_endpoint(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "leafguard.ai" in data["email"]
    assert data["name"] == "Alex Agronomist"


def test_auth_unauthorized_access():
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_account_lockout_after_consecutive_failures():
    """Verify that 5 consecutive failed logins triggers an account lockout (HTTP 429)."""
    uid = uuid.uuid4().hex[:8]
    target_email = f"lockout_{uid}@leafguard.ai"
    correct_password = "LockoutTargetPassword2026!"

    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Lockout Target",
            "email": target_email,
            "password": correct_password,
            "role": "Researcher",
        }
    )

    for _ in range(4):
        res = client.post(
            "/api/v1/auth/login",
            json={"email": target_email, "password": "WrongPassword999!"}
        )
        assert res.status_code == 401
        assert "remaining before" in res.json()["detail"]

    lockout_res = client.post(
        "/api/v1/auth/login",
        json={"email": target_email, "password": "WrongPassword999!"}
    )
    assert lockout_res.status_code == 429
    assert "locked" in lockout_res.json()["detail"].lower()


def test_change_password_endpoint():
    """Test authenticated password change endpoint with a dedicated user."""
    uid = uuid.uuid4().hex[:8]
    email = f"pw_changer_{uid}@leafguard.ai"
    old_pw = "OldPassword2026!#"
    new_pw = "BrandNewSecretPassword2026!#"

    # Register
    reg_res = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Password Changer",
            "email": email,
            "password": old_pw,
            "role": "Agronomist",
        }
    )
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Incorrect current password
    bad_old = client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={
            "current_password": "IncorrectOldPassword123!",
            "new_password": new_pw
        }
    )
    assert bad_old.status_code == 400
    assert "Incorrect current password" in bad_old.json()["detail"]

    # Valid change
    good_change = client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={
            "current_password": old_pw,
            "new_password": new_pw
        }
    )
    assert good_change.status_code == 200
    assert "successfully" in good_change.json()["message"]

    # Login with new password
    login_new = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": new_pw}
    )
    assert login_new.status_code == 200


# ─────────────────────────────────────────────────────────────
# 3. Image Validation & Prediction Fail-Safe Tests
# ─────────────────────────────────────────────────────────────
def test_predict_unauthenticated():
    img_bytes = create_test_image_bytes(format="JPEG")
    files = {"file": ("test_leaf.jpg", img_bytes, "image/jpeg")}
    res = client.post("/api/v1/predict", files=files)
    assert res.status_code == 401


def test_predict_invalid_extension(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    files = {"file": ("document.pdf", b"%PDF-1.4 dummy", "application/pdf")}
    res = client.post("/api/v1/predict", headers=headers, files=files)
    assert res.status_code == 400
    assert "Unsupported file extension" in res.json()["detail"]


def test_predict_invalid_mime_type(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    img_bytes = create_test_image_bytes(format="JPEG")
    files = {"file": ("leaf.jpg", img_bytes, "text/plain")}
    res = client.post("/api/v1/predict", headers=headers, files=files)
    assert res.status_code == 400
    assert "Unsupported MIME type" in res.json()["detail"]


def test_predict_corrupted_image(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    files = {"file": ("fake.jpg", b"corrupted data", "image/jpeg")}
    res = client.post("/api/v1/predict", headers=headers, files=files)
    assert res.status_code == 400
    assert "Corrupted or invalid image" in res.json()["detail"]


def test_predict_missing_model_returns_503(auth_token):
    """When ML model is not available, /predict MUST return HTTP 503 rather than fake data."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    img_bytes = create_test_image_bytes(format="JPEG")
    files = {"file": ("leaf.jpg", img_bytes, "image/jpeg")}

    with patch.object(model_service, "is_ready", return_value=False):
        res = client.post("/api/v1/predict", headers=headers, files=files)
        assert res.status_code == 503
        assert "unavailable" in res.json()["detail"].lower()


def test_predict_with_mocked_live_model(auth_token):
    """Test full prediction flow when a valid model is live."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    img_bytes = create_test_image_bytes(format="JPEG")
    files = {"file": ("leaf.jpg", img_bytes, "image/jpeg")}

    mock_top_3 = [
        {"class_name": "Tomato___Early_blight", "plant": "Tomato", "disease": "Early Blight", "confidence": 94.5},
        {"class_name": "Tomato___Late_blight", "plant": "Tomato", "disease": "Late Blight", "confidence": 3.2},
        {"class_name": "Tomato___healthy", "plant": "Tomato", "disease": "Healthy", "confidence": 1.1},
    ]

    with patch.object(model_service, "is_ready", return_value=True):
        with patch.object(model_service, "predict", return_value=("Tomato___Early_blight", 94.5, mock_top_3, True)):
            res = client.post("/api/v1/predict", headers=headers, files=files)
            assert res.status_code == 200
            data = res.json()
            assert data["success"] is True
            assert data["prediction"]["plant"] == "Tomato"
            assert data["prediction"]["disease"] == "Early Blight"
            assert data["prediction"]["confidence"] == 94.5
            assert data["prediction"]["is_low_confidence"] is False
            assert "disease_info" in data
            assert len(data["top_predictions"]) == 3


def test_predict_low_confidence_flagging(auth_token):
    """Test that predictions below threshold flag is_low_confidence = True."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    img_bytes = create_test_image_bytes(format="JPEG")
    files = {"file": ("leaf.jpg", img_bytes, "image/jpeg")}

    mock_top_3 = [
        {"class_name": "Tomato___Early_blight", "plant": "Tomato", "disease": "Early Blight", "confidence": 42.0},
        {"class_name": "Tomato___Late_blight", "plant": "Tomato", "disease": "Late Blight", "confidence": 38.0},
        {"class_name": "Tomato___healthy", "plant": "Tomato", "disease": "Healthy", "confidence": 15.0},
    ]

    with patch.object(model_service, "is_ready", return_value=True):
        with patch.object(model_service, "predict", return_value=("Tomato___Early_blight", 42.0, mock_top_3, True)):
            res = client.post("/api/v1/predict", headers=headers, files=files)
            assert res.status_code == 200
            data = res.json()
            assert data["prediction"]["is_low_confidence"] is True
            assert "Low-confidence result" in data["prediction"]["guidance"]


# ─────────────────────────────────────────────────────────────
# 4. History User-Isolation & Authorization Tests
# ─────────────────────────────────────────────────────────────
def test_history_user_isolation(auth_token):
    """Ensure User A cannot view User B's history record."""
    uid = uuid.uuid4().hex[:8]
    user_b_email = f"user_b_{uid}@leafguard.ai"

    # Register User B
    user_b_res = client.post(
        "/api/v1/auth/register",
        json={
            "name": "User Beta",
            "email": user_b_email,
            "password": "UserBetaSecurePassword2026!#",
            "role": "Farmer",
        }
    )
    user_b_token = user_b_res.json()["access_token"]

    # Inject a record for User B in local store
    record_b_id = f"record_b_{uid}"
    record_b = {
        "id": record_b_id,
        "user_id": user_b_email,
        "plant": "Potato",
        "disease": "Early Blight",
        "class_name": "Potato___Early_blight",
        "confidence": 95.0,
        "severity": "Moderate",
        "created_at": "2026-08-28T12:00:00Z"
    }
    save_local_json("history_store.json", [record_b])

    # User B can view it
    headers_b = {"Authorization": f"Bearer {user_b_token}"}
    res_b = client.get(f"/api/v1/history/{record_b_id}", headers=headers_b)
    assert res_b.status_code == 200

    # Primary user (User A) MUST NOT be able to view User B's record (HTTP 404)
    headers_a = {"Authorization": f"Bearer {auth_token}"}
    res_a = client.get(f"/api/v1/history/{record_b_id}", headers=headers_a)
    assert res_a.status_code == 404


# ─────────────────────────────────────────────────────────────
# 5. Analytics Telemetry Tests
# ─────────────────────────────────────────────────────────────
def test_analytics_and_stats(auth_token):
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
