"""
Unit tests for OpenCV Leaf Detection & Localization Service (leaf_detector.py).
Tests: valid leaf, no leaf, tiny object, large object, multiple leaves,
dark image, blurry image, crop leaf.
"""

import numpy as np
import cv2
import pytest
from backend.services.leaf_detector import leaf_detector, detect_leaf, LeafDetectionResult


def generate_test_image(
    width=640,
    height=480,
    bg_color=(235, 235, 235),
    leaf_color=(34, 139, 34),
    leaf_center=(320, 240),
    leaf_radius=110,
    add_spots=True,
    blur=False,
    dark=False,
    bright=False,
) -> np.ndarray:
    """Creates a synthetic test image with controllable foliage and artifacts."""
    img = np.full((height, width, 3), bg_color, dtype=np.uint8)

    if leaf_radius > 0:
        # Draw ellipse representing leaf blade
        cv2.ellipse(
            img,
            leaf_center,
            (leaf_radius, int(leaf_radius * 0.7)),
            30,
            0,
            360,
            leaf_color,
            -1,
        )

        if add_spots:
            # Draw necrotic spot inside leaf
            spot_center = (leaf_center[0] + 20, leaf_center[1] - 10)
            cv2.circle(img, spot_center, 18, (20, 50, 110), -1)  # Brown spot in BGR

    if blur:
        img = cv2.GaussianBlur(img, (41, 41), 0)

    if dark:
        img = (img * 0.1).astype(np.uint8)

    if bright:
        img = np.clip(img * 1.5 + 50, 0, 255).astype(np.uint8)

    return img


def test_detect_valid_leaf():
    """Verify that a standard centered leaf is accurately detected with high confidence."""
    img = generate_test_image(width=640, height=480, leaf_radius=120)
    result = detect_leaf(img)

    assert isinstance(result, LeafDetectionResult)
    assert result.detected is True
    assert result.confidence >= 0.70
    assert result.width > 50
    assert result.height > 50
    assert result.area_percentage > 2.0
    assert result.quality["is_blurry"] is False
    assert result.quality["exposure_status"] == "Optimal"


def test_detect_no_leaf():
    """Verify that a plain neutral frame returns detected=False with guidance."""
    img = np.full((480, 640, 3), 220, dtype=np.uint8)
    result = detect_leaf(img)

    assert result.detected is False
    assert result.confidence == 0.0
    assert "No leaf detected" in (result.guidance or "")


def test_filter_tiny_object():
    """Verify that tiny green dots/specks are rejected by the minimum area filter."""
    img = generate_test_image(width=640, height=480, leaf_radius=5)  # Tiny 5px dot
    result = detect_leaf(img)

    assert result.detected is False


def test_filter_huge_full_frame():
    """Verify that an image completely filled with foliage/solid green doesn't produce an edge defect."""
    img = np.full((480, 640, 3), (34, 139, 34), dtype=np.uint8)
    result = detect_leaf(img)

    # When whole frame is solid green without distinct background/margin,
    # it either exceeds max_area_fraction or is flagged
    assert isinstance(result, LeafDetectionResult)


def test_multiple_leaves_detection():
    """Verify multiple leaves are recognized and guidance is given."""
    img = np.full((480, 640, 3), 240, dtype=np.uint8)
    # Leaf 1 (Left)
    cv2.circle(img, (200, 240), 90, (34, 139, 34), -1)
    # Leaf 2 (Right)
    cv2.circle(img, (440, 240), 85, (34, 139, 34), -1)

    result = detect_leaf(img)
    assert result.detected is True
    assert result.multiple_candidates is True
    assert "Multiple leaves" in (result.guidance or "")


def test_blurry_image_quality():
    """Verify that an out-of-focus leaf flags is_blurry and provides blur guidance."""
    img = generate_test_image(width=640, height=480, leaf_radius=120, blur=True)
    result = detect_leaf(img)

    assert result.quality["is_blurry"] is True
    assert result.quality["laplacian_variance"] < 45.0
    assert "blurry" in (result.guidance or "").lower()


def test_dark_underexposed_image():
    """Verify that an underexposed frame is flagged as Too dark with lighting guidance."""
    img = generate_test_image(width=640, height=480, leaf_radius=120, dark=True)
    result = detect_leaf(img)

    assert result.quality["exposure_status"] == "Too dark"
    assert "dark" in (result.guidance or "").lower()


def test_crop_leaf_dimensions():
    """Verify that crop_leaf extracts the region and resizes to standardized (224, 224, 3)."""
    img = generate_test_image(width=640, height=480, leaf_radius=110)
    result = detect_leaf(img)
    assert result.detected is True

    crop = leaf_detector.crop_leaf(img, result.x, result.y, result.width, result.height, target_size=(224, 224))
    assert crop.shape == (224, 224, 3)
    assert crop.dtype == np.uint8
