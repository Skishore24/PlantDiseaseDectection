import io
import pytest
import numpy as np
from PIL import Image
from backend.services.cv_service import cv_service


def create_mock_leaf_image(color=(34, 139, 34), add_spot=True):
    """Generates a test RGB leaf image in memory."""
    img = Image.new("RGB", (224, 224), color=(240, 240, 240)) # Light background
    # Draw green leaf circle
    arr = np.array(img)
    center_y, center_x = 112, 112
    radius = 80
    y, x = np.ogrid[:224, :224]
    leaf_mask = ((x - center_x) ** 2 + (y - center_y) ** 2) <= radius ** 2
    arr[leaf_mask] = color

    if add_spot:
        # Add brown necrotic lesion spot
        spot_mask = ((x - 130) ** 2 + (y - 120) ** 2) <= 15 ** 2
        arr[spot_mask] = (110, 50, 20)

    buf = io.BytesIO()
    Image.fromarray(arr).save(buf, format="JPEG")
    return buf.getvalue()


def test_cv_quality_assessment():
    """Verify image sharpness, brightness, and foliage detection."""
    image_bytes = create_mock_leaf_image(color=(34, 139, 34), add_spot=True)
    quality = cv_service.assess_image_quality(image_bytes)

    assert "sharpness_score" in quality
    assert "is_blurry" in quality
    assert "brightness" in quality
    assert "foliage_coverage_percent" in quality
    assert quality["foliage_coverage_percent"] > 0
    assert quality["is_leaf_detected"] is True


def test_cv_lesion_analysis():
    """Verify lesion segmentation, spot count, and affected area percentage."""
    image_bytes = create_mock_leaf_image(color=(34, 139, 34), add_spot=True)
    analysis = cv_service.analyze_lesions(image_bytes, is_healthy=False)

    assert "affected_area_percentage" in analysis
    assert "foliage_health_score" in analysis
    assert "lesion_count" in analysis
    assert "segmented_overlay_url" in analysis
    assert analysis["segmented_overlay_url"].startswith("data:image/png;base64,")
    assert analysis["affected_area_percentage"] >= 0.0


def test_cv_healthy_leaf_suppression():
    """Verify healthy leaves report 0% affected area and 100 health score."""
    image_bytes = create_mock_leaf_image(color=(34, 139, 34), add_spot=False)
    analysis = cv_service.analyze_lesions(image_bytes, is_healthy=True)

    assert analysis["affected_area_percentage"] == 0.0
    assert analysis["foliage_health_score"] == 100.0
    assert analysis["lesion_count"] == 0


def test_cv_gradcam_generation():
    """Verify Grad-CAM attention heatmap generation fallback/saliency."""
    image_bytes = create_mock_leaf_image()
    gradcam_url = cv_service.generate_gradcam(image_bytes, model=None, top_class_idx=0)

    assert gradcam_url is not None
    assert gradcam_url.startswith("data:image/png;base64,")


def test_cv_full_suite():
    """Verify full suite execution."""
    image_bytes = create_mock_leaf_image()
    suite = cv_service.run_cv_suite(image_bytes, model=None, top_class_idx=0, is_healthy=False)

    assert "gradcam_heatmap_url" in suite
    assert "segmented_overlay_url" in suite
    assert "affected_area_percentage" in suite
    assert "image_quality" in suite
