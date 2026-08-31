import os
import io
import uuid
import tempfile
import logging
from typing import Tuple
from PIL import Image, UnidentifiedImageError
from fastapi import UploadFile, HTTPException, status
import numpy as np
from backend.config import settings

logger = logging.getLogger("leafguard.image_service")

# Strictly supported image formats and declared MIME types
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_PIL_FORMATS = {"JPEG", "PNG", "WEBP"}
TARGET_IMAGE_SIZE = (224, 224)


class ImageService:
    @staticmethod
    async def validate_and_read(file: UploadFile) -> Tuple[bytes, str]:
        """
        Validates content type, file extension, file size, Pillow format decoding,
        and ensures the payload is a valid RGB image.
        Returns: (image_bytes, safe_filename)
        """
        # 1. Validate file extension
        filename = file.filename or "upload.jpg"
        ext = os.path.splitext(filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file extension '{ext}'. Allowed extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )

        # 2. Strict MIME type check
        content_type = (file.content_type or "").lower().strip()
        if content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported MIME type '{content_type}'. Allowed types: {', '.join(sorted(ALLOWED_MIME_TYPES))}"
            )

        # 3. Read bytes and check size
        contents = await file.read()
        if not contents:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty."
            )

        max_size = getattr(settings, "MAX_UPLOAD_SIZE_BYTES", 10 * 1024 * 1024)
        if len(contents) > max_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds the {max_size // (1024 * 1024)} MB limit."
            )

        # 4. Strict Pillow validation & format decoding
        try:
            with Image.open(io.BytesIO(contents)) as pil_img:
                img_format = pil_img.format
                if img_format not in ALLOWED_PIL_FORMATS:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Image format '{img_format}' is not supported. Please upload a JPEG, PNG, or WEBP image."
                    )
                # Verify structural integrity
                pil_img.verify()
        except HTTPException:
            raise
        except (UnidentifiedImageError, Exception) as e:
            logger.warning(f"Image integrity verification failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Corrupted or invalid image file. Please upload a clear photo in JPG, PNG, or WEBP format."
            )

        # Generate unique safe filename
        safe_filename = f"{uuid.uuid4().hex}{ext}"
        return contents, safe_filename

    @staticmethod
    def preprocess_image(image_bytes: bytes) -> np.ndarray:
        """
        Canonical Image Preprocessing Pipeline for EfficientNetB0:
        1. Opens validated image bytes.
        2. Converts to 3-channel RGB.
        3. Resizes to (224, 224) using bilinear interpolation.
        4. Casts to float32 NumPy array with shape (1, 224, 224, 3) in range [0, 255].
        """
        try:
            with Image.open(io.BytesIO(image_bytes)) as pil_img:
                rgb_img = pil_img.convert("RGB").resize(TARGET_IMAGE_SIZE, Image.Resampling.BILINEAR)
                img_array = np.array(rgb_img, dtype=np.float32)

                # Validate dimensions
                if img_array.shape != (224, 224, 3):
                    raise ValueError(f"Unexpected image array shape {img_array.shape}")

                # Expand batch dimension: (1, 224, 224, 3)
                img_batch = np.expand_dims(img_array, axis=0)
                return img_batch
        except Exception as e:
            logger.error(f"Image preprocessing error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to preprocess image for neural model inference."
            )

    @staticmethod
    def create_temporary_file(image_bytes: bytes, filename: str) -> str:
        """Creates a temporary file on disk for processing."""
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, filename)
        with open(temp_path, "wb") as f:
            f.write(image_bytes)
        return temp_path

    @staticmethod
    def bytes_to_pil(image_bytes: bytes) -> Image.Image:
        """Converts image bytes to a PIL Image in RGB format."""
        return Image.open(io.BytesIO(image_bytes)).convert("RGB")

    @staticmethod
    def pil_to_bytes(pil_img: Image.Image, format: str = "JPEG") -> bytes:
        """Converts a PIL Image to encoded image bytes."""
        buf = io.BytesIO()
        pil_img.save(buf, format=format)
        return buf.getvalue()

    @staticmethod
    def bytes_to_base64_data_url(image_bytes: bytes, mime: str = "image/jpeg") -> str:
        """Encodes image bytes into a data URL base64 string."""
        import base64
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        return f"data:{mime};base64,{b64}"

    @staticmethod
    def base64_data_url_to_bytes(data_url: str) -> bytes:
        """Decodes a base64 data URL string into raw image bytes."""
        import base64
        if "," in data_url:
            data_url = data_url.split(",", 1)[1]
        return base64.b64decode(data_url)

    @staticmethod
    def bytes_to_numpy_rgb(image_bytes: bytes) -> np.ndarray:
        """Converts raw image bytes to an RGB uint8 NumPy array."""
        with Image.open(io.BytesIO(image_bytes)) as pil_img:
            return np.array(pil_img.convert("RGB"))

    @staticmethod
    def numpy_rgb_to_bytes(arr: np.ndarray, format: str = "JPEG") -> bytes:
        """Converts an RGB NumPy array to encoded image bytes."""
        buf = io.BytesIO()
        pil_img = Image.fromarray(np.uint8(arr))
        pil_img.save(buf, format=format)
        return buf.getvalue()

    @staticmethod
    def cleanup_temporary_file(file_path: str):
        """Safely removes a temporary file from disk."""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            logger.warning(f"Failed to remove temporary file {file_path}: {e}")


image_service = ImageService()

