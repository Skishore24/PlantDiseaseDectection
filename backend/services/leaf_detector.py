"""
LeafGuard AI — OpenCV Plant Leaf Localization Service
Detects, filters, and localizes plant foliage within real-time camera frames.
Implements color space segmentation, morphological filtering, geometric heuristics,
and image quality assessment (blur, exposure, size).
"""

import logging
from typing import Dict, Any, Optional, Tuple, List
import numpy as np
import cv2

logger = logging.getLogger("leafguard.leaf_detector")


class LeafDetectionResult:
    """Structured result of plant leaf localization and quality assessment."""

    def __init__(
        self,
        detected: bool,
        x: int = 0,
        y: int = 0,
        width: int = 0,
        height: int = 0,
        confidence: float = 0.0,
        area_percentage: float = 0.0,
        quality: Optional[Dict[str, Any]] = None,
        guidance: Optional[str] = None,
        multiple_candidates: bool = False,
    ):
        self.detected = detected
        self.x = int(x)
        self.y = int(y)
        self.width = int(width)
        self.height = int(height)
        self.confidence = round(float(confidence), 2)
        self.area_percentage = round(float(area_percentage), 1)
        self.quality = quality or {}
        self.guidance = guidance
        self.multiple_candidates = multiple_candidates

    def to_dict(self) -> Dict[str, Any]:
        """Serializes detection result to JSON-compliant dictionary."""
        if not self.detected:
            return {
                "detected": False,
                "confidence": 0.0,
                "quality": self.quality,
                "guidance": self.guidance or "No leaf detected. Place a leaf inside the scanner.",
                "multiple_candidates": self.multiple_candidates,
            }

        return {
            "detected": True,
            "x": self.x,
            "y": self.y,
            "width": self.width,
            "height": self.height,
            "confidence": self.confidence,
            "area_percentage": self.area_percentage,
            "quality": self.quality,
            "guidance": self.guidance,
            "multiple_candidates": self.multiple_candidates,
        }


class LeafDetector:
    """
    OpenCV-powered Computer Vision Foliage Localizer.
    Performs vegetation color segmentation, morphological cleaning,
    contour filtering, candidate scoring, and quality checks.
    """

    def __init__(
        self,
        min_area_fraction: float = 0.025,  # Min 2.5% of frame
        max_area_fraction: float = 0.94,   # Max 94% of frame
        min_aspect_ratio: float = 0.20,
        max_aspect_ratio: float = 5.0,
        min_solidity: float = 0.35,
        blur_threshold: float = 45.0,
        min_brightness: float = 38.0,
        max_brightness: float = 245.0,
    ):
        self.min_area_fraction = min_area_fraction
        self.max_area_fraction = max_area_fraction
        self.min_aspect_ratio = min_aspect_ratio
        self.max_aspect_ratio = max_aspect_ratio
        self.min_solidity = min_solidity
        self.blur_threshold = blur_threshold
        self.min_brightness = min_brightness
        self.max_brightness = max_brightness

    def assess_frame_quality(self, img_bgr: np.ndarray) -> Dict[str, Any]:
        """
        Calculates Laplacian variance for blur and mean luminance for exposure.
        """
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape

        # 1. Blur Detection via Laplacian variance
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        is_blurry = laplacian_var < self.blur_threshold

        # 2. Exposure / Lighting Analysis
        mean_brightness = float(np.mean(gray))
        if mean_brightness < self.min_brightness:
            exposure_status = "Too dark"
        elif mean_brightness > self.max_brightness:
            exposure_status = "Too bright"
        else:
            exposure_status = "Optimal"

        # 3. Contrast evaluation
        contrast = float(np.std(gray))

        return {
            "laplacian_variance": round(laplacian_var, 1),
            "is_blurry": is_blurry,
            "brightness": round(mean_brightness, 1),
            "exposure_status": exposure_status,
            "contrast": round(contrast, 1),
            "sharpness_score": min(100.0, round((laplacian_var / 300.0) * 100.0, 1)),
        }

    def segment_foliage_mask(self, img_bgr: np.ndarray) -> np.ndarray:
        """
        Segments vegetation using multi-range HSV color filtering
        combined with the Excess Green Index (ExG = 2*G - R - B).
        """
        hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)

        # Range 1: Healthy green / yellow-green foliage
        lower_green = np.array([24, 25, 25])
        upper_green = np.array([92, 255, 255])
        mask_green = cv2.inRange(hsv, lower_green, upper_green)

        # Range 2: Chlorosis / Yellow halos / Mild blight
        lower_yellow = np.array([12, 30, 30])
        upper_yellow = np.array([25, 255, 255])
        mask_yellow = cv2.inRange(hsv, lower_yellow, upper_yellow)

        # Range 3: Brown / Necrotic lesion / Rust tissue
        lower_brown = np.array([5, 40, 25])
        upper_brown = np.array([20, 220, 210])
        mask_brown = cv2.inRange(hsv, lower_brown, upper_brown)

        # Combine HSV vegetation ranges
        hsv_foliage_mask = cv2.bitwise_or(mask_green, mask_yellow)
        hsv_foliage_mask = cv2.bitwise_or(hsv_foliage_mask, mask_brown)

        # Agronomic Excess Green Index (ExG = 2G - R - B)
        # Accurately isolates plant foliage against diverse backgrounds
        b, g, r = cv2.split(img_bgr.astype(np.int16))
        exg = 2 * g - r - b
        exg_mask = np.uint8(np.where(exg > 15, 255, 0))

        # Union of HSV mask and ExG mask
        combined_mask = cv2.bitwise_or(hsv_foliage_mask, exg_mask)

        # Smooth and close holes (veins, spots) with morphological operations
        kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        kernel_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))

        smoothed = cv2.GaussianBlur(combined_mask, (5, 5), 0)
        _, thresh = cv2.threshold(smoothed, 127, 255, cv2.THRESH_BINARY)
        closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel_close, iterations=2)
        cleaned = cv2.morphologyEx(closed, cv2.MORPH_OPEN, kernel_open, iterations=1)

        return cleaned

    def detect(self, img_bgr: np.ndarray) -> LeafDetectionResult:
        """
        Executes complete leaf localization pipeline on a BGR image frame:
        1. Pre-flight quality assessment (blur, brightness)
        2. Foliage color segmentation & morphological smoothing
        3. Contour extraction and geometric filtering
        4. Candidate ranking and center-weighted selection
        5. Guidance determination
        """
        if img_bgr is None or img_bgr.size == 0:
            return LeafDetectionResult(detected=False, guidance="Invalid camera frame.")

        h, w = img_bgr.shape[:2]
        frame_area = float(h * w)

        # 1. Quality inspection
        quality = self.assess_frame_quality(img_bgr)
        is_blurry = quality["is_blurry"]
        exposure_status = quality["exposure_status"]

        # Initial quality guidance flags
        guidance: Optional[str] = None
        if exposure_status == "Too dark":
            guidance = "Too dark. Improve lighting."
        elif exposure_status == "Too bright":
            guidance = "Too bright. Avoid direct glare."

        # 2. Foliage segmentation
        foliage_mask = self.segment_foliage_mask(img_bgr)

        # 3. Find external contours
        contours, _ = cv2.findContours(
            foliage_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        min_area = frame_area * self.min_area_fraction
        max_area = frame_area * self.max_area_fraction

        frame_cx = w / 2.0
        frame_cy = h / 2.0
        max_dist = np.hypot(frame_cx, frame_cy)

        valid_candidates: List[Dict[str, Any]] = []

        for cnt in contours:
            area = float(cv2.contourArea(cnt))
            if area < min_area or area > max_area:
                continue

            bx, by, bw, bh = cv2.boundingRect(cnt)
            if bw < 25 or bh < 25:
                continue

            aspect_ratio = float(bw) / float(bh)
            if aspect_ratio < self.min_aspect_ratio or aspect_ratio > self.max_aspect_ratio:
                continue

            # Extent (rectangularity)
            rect_area = float(bw * bh)
            extent = area / rect_area if rect_area > 0 else 0.0

            # Solidity
            hull = cv2.convexHull(cnt)
            hull_area = float(cv2.contourArea(hull))
            solidity = area / hull_area if hull_area > 0 else 0.0

            if solidity < self.min_solidity:
                continue

            # Distance from frame center
            box_cx = bx + (bw / 2.0)
            box_cy = by + (bh / 2.0)
            dist_to_center = np.hypot(box_cx - frame_cx, box_cy - frame_cy)
            norm_dist = dist_to_center / max_dist if max_dist > 0 else 0.0

            # Foliage density inside bounding box
            roi_mask = foliage_mask[by : by + bh, bx : bx + bw]
            mask_density = float(cv2.countNonZero(roi_mask)) / rect_area if rect_area > 0 else 0.0

            # Heuristic Score: balanced blend of area, centeredness, solidity, and density
            area_score = min(1.0, area / (frame_area * 0.40))
            center_score = max(0.0, 1.0 - norm_dist)
            heuristic_score = (
                (area_score * 0.35)
                + (center_score * 0.35)
                + (solidity * 0.15)
                + (mask_density * 0.15)
            )

            # Pad bounding box slightly (5%) to capture leaf margins for disease classification
            pad_x = int(bw * 0.04)
            pad_y = int(bh * 0.04)
            final_x = max(0, bx - pad_x)
            final_y = max(0, by - pad_y)
            final_w = min(w - final_x, bw + (pad_x * 2))
            final_h = min(h - final_y, bh + (pad_y * 2))

            valid_candidates.append({
                "contour": cnt,
                "area": area,
                "area_pct": (area / frame_area) * 100.0,
                "bbox": (final_x, final_y, final_w, final_h),
                "solidity": solidity,
                "extent": extent,
                "score": heuristic_score,
                "norm_dist": norm_dist,
            })

        # No valid leaf candidates found
        if not valid_candidates:
            # Check if any small green contours exist to give "Move closer" guidance
            small_contours = [c for c in contours if cv2.contourArea(c) > (frame_area * 0.005)]
            if small_contours and not guidance:
                guidance = "Move closer to the leaf."

            return LeafDetectionResult(
                detected=False,
                quality=quality,
                guidance=guidance or "No leaf detected. Place a leaf inside the scanner.",
                multiple_candidates=False,
            )

        # Sort candidates by heuristic score descending
        valid_candidates.sort(key=lambda c: c["score"], reverse=True)
        best = valid_candidates[0]

        # Check for multiple competing leaf candidates
        multiple_leaves = False
        if len(valid_candidates) > 1:
            second_best = valid_candidates[1]
            if second_best["area"] > (best["area"] * 0.50):
                multiple_leaves = True
                if not guidance:
                    guidance = "Multiple leaves detected. Place one leaf in front of the camera."

        # Area occupancy check
        if best["area_pct"] < 6.0 and not guidance:
            guidance = "Move closer to the leaf."

        # Blur check for detected leaf
        if is_blurry and not guidance:
            guidance = "Image blurry. Hold camera steady."

        # Calculate localized leaf detection confidence
        raw_conf = (
            0.50
            + (best["solidity"] * 0.20)
            + ((1.0 - best["norm_dist"]) * 0.15)
            + (min(1.0, best["area_pct"] / 25.0) * 0.15)
        )
        conf = min(0.98, max(0.65, raw_conf))

        fx, fy, fw, fh = best["bbox"]

        return LeafDetectionResult(
            detected=True,
            x=fx,
            y=fy,
            width=fw,
            height=fh,
            confidence=conf,
            area_percentage=best["area_pct"],
            quality=quality,
            guidance=guidance,
            multiple_candidates=multiple_leaves,
        )

    def crop_leaf(
        self,
        img_bgr: np.ndarray,
        x: int,
        y: int,
        width: int,
        height: int,
        target_size: Tuple[int, int] = (224, 224)
    ) -> np.ndarray:
        """
        Crops the localized leaf region and resizes it with bilinear interpolation
        to target dimensions (224, 224) for neural disease classification.
        """
        h, w = img_bgr.shape[:2]

        # Clamp bounding box coordinates within image boundaries
        clamped_x = max(0, min(x, w - 1))
        clamped_y = max(0, min(y, h - 1))
        clamped_w = max(1, min(width, w - clamped_x))
        clamped_h = max(1, min(height, h - clamped_y))

        cropped = img_bgr[clamped_y : clamped_y + clamped_h, clamped_x : clamped_x + clamped_w]

        if cropped.size == 0:
            # Fallback to entire image if crop fails
            cropped = cv2.resize(img_bgr, target_size, interpolation=cv2.INTER_LINEAR)
        else:
            cropped = cv2.resize(cropped, target_size, interpolation=cv2.INTER_LINEAR)

        return cropped


# ─────────────────────────────────────────────────────────────
# Modular Factory / Standalone Function for Pluggable Detectors
# ─────────────────────────────────────────────────────────────
leaf_detector = LeafDetector()


def detect_leaf(frame: np.ndarray) -> LeafDetectionResult:
    """
    Modular leaf localization interface.
    Allows drop-in replacement with YOLO or custom detectors in the future
    while maintaining the exact same downstream signature.
    """
    return leaf_detector.detect(frame)
