"""
Unit tests for Camera API Endpoints (backend/routes/camera.py).
Tests:
- GET /api/v1/camera/status
- POST /api/v1/camera/analyze (valid leaf, no leaf, invalid frame, unauthorized)
- POST /api/v1/camera/save (saving to history database)
"""

import io
import base64
import numpy as np
import cv2
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from unittest.mock import patch

from backend.app import app
from backend.utils.auth import create_access_token

client = TestClient(app)


def get_auth_headers(email: str = "camera_tester@leafguard.ai"):
    """Generates valid JWT auth bearer header for test client."""
    token = create_access_token(email)
    return {"Authorization": f"Bearer {token}"}


def create_mock_camera_frame_bytes(
    width=640,
    height=480,
    has_leaf=True,
    is_blurry=False,
    is_dark=False,
) -> bytes:
    """Generates encoded JPEG bytes simulating camera feed."""
    img = np.full((height, width, 3), 210, dtype=np.uint8)

    if has_leaf:
        # Draw green leaf
        cv2.circle(img, (width // 2, height // 2), 120, (34, 139, 34), -1)
        # Draw necrotic spot
        cv2.circle(img, (width // 2 + 20, height // 2 - 15), 18, (20, 50, 110), -1)

    if is_blurry:
        img = cv2.GaussianBlur(img, (45, 45), 0)

    if is_dark:
        img = (img * 0.1).astype(np.uint8)

    success, buffer = cv2.imencode(".jpg", img)
    return buffer.tobytes()


def test_camera_status():
    """Verify camera service status and hardware acceleration report."""
    res = client.get("/api/v1/camera/status")
    assert res.status_code == 200
    data = res.json()
    assert data["service"] == "LiveLeafScanner"
    assert "camera_confidence_threshold" in data
    assert "device" in data
    assert data["num_classes"] == 38


def test_camera_analyze_unauthorized():
    """Verify that unauthenticated camera analysis requests are rejected."""
    frame_bytes = create_mock_camera_frame_bytes(has_leaf=True)
    res = client.post(
        "/api/v1/camera/analyze",
        files={"file": ("frame.jpg", frame_bytes, "image/jpeg")},
    )
    assert res.status_code == 401


def test_camera_analyze_valid_leaf():
    """Verify camera frame analysis with a detected leaf."""
    headers = get_auth_headers()
    frame_bytes = create_mock_camera_frame_bytes(has_leaf=True)

    res = client.post(
        "/api/v1/camera/analyze",
        headers=headers,
        files={"file": ("frame.jpg", frame_bytes, "image/jpeg")},
    )

    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["leaf_detected"] is True
    assert data["bounding_box"] is not None
    assert data["bounding_box"]["width"] > 0
    assert data["bounding_box"]["height"] > 0
    assert "performance" in data
    assert data["performance"]["detection_ms"] >= 0.0
    assert "device" in data["performance"]


def test_camera_analyze_no_leaf():
    """Verify camera frame analysis when no leaf is in view."""
    headers = get_auth_headers()
    frame_bytes = create_mock_camera_frame_bytes(has_leaf=False)

    res = client.post(
        "/api/v1/camera/analyze",
        headers=headers,
        files={"file": ("frame.jpg", frame_bytes, "image/jpeg")},
    )

    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["leaf_detected"] is False
    assert data["bounding_box"] is None
    assert "No leaf detected" in (data["guidance"] or "")


def test_camera_analyze_base64_payload():
    """Verify camera frame analysis when image is sent as a base64 string."""
    headers = get_auth_headers()
    frame_bytes = create_mock_camera_frame_bytes(has_leaf=True)
    b64_str = f"data:image/jpeg;base64,{base64.b64encode(frame_bytes).decode('utf-8')}"

    res = client.post(
        "/api/v1/camera/analyze",
        headers=headers,
        data={"image_base64": b64_str},
    )

    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["leaf_detected"] is True


def test_camera_analyze_empty_payload():
    """Verify 400 Bad Request if no file or base64 is provided."""
    headers = get_auth_headers()
    res = client.post("/api/v1/camera/analyze", headers=headers)
    assert res.status_code == 400


def test_camera_save_scan():
    """Verify saving a confirmed live camera scan to user history."""
    headers = get_auth_headers()
    frame_bytes = create_mock_camera_frame_bytes(has_leaf=True)
    b64_str = f"data:image/jpeg;base64,{base64.b64encode(frame_bytes).decode('utf-8')}"

    payload = {
        "image_base64": b64_str,
        "bounding_box": {"x": 100, "y": 100, "width": 200, "height": 200},
        "class_name": "Tomato___Early_blight",
    }

    res = client.post("/api/v1/camera/save", headers=headers, json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "id" in data
    assert data["record"]["plant"] == "Tomato"
    assert data["record"]["disease"] == "Early Blight"
    assert "cv_analysis" in data
    assert "disease_info" in data
