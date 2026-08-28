import os
import io
import uuid
import tempfile
import logging
from typing import Tuple
from PIL import Image, UnidentifiedImageError
from fastapi import UploadFile, HTTPException, status
import numpy as np

logger = logging.getLogger("leafguard.image_service")

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
TARGET_IMAGE_SIZE = (224, 224)


class ImageService:
    @staticmethod
    async def validate_and_read(file: UploadFile) -> Tuple[bytes, str]:
        """
        Validates content type, file extension, file size, and verifies that the byte payload
        is indeed a legitimate image using Pillow.
        Returns (image_bytes, clean_filename).
        """
        # 1. Validate file extension
        filename = file.filename or "upload.jpg"
        ext = os.path.splitext(filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )

        # 2. Validate MIME type header
        if file.content_type and not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is not a recognized image type."
            )

        # 3. Read bytes and check size
        contents = await file.read()
        if not contents:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty."
            )

        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File size exceeds the 10 MB limit."
            )

        # 4. Strict Pillow validation (do not trust extensions or mime headers alone)
        try:
            with Image.open(io.BytesIO(contents)) as pil_img:
                pil_img.verify()  # Verifies file integrity
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
        Opens verified image bytes, converts to RGB, resizes to 224x224,
        and returns a normalized numpy array of shape (1, 224, 224, 3) for inference.
        """
        try:
            with Image.open(io.BytesIO(image_bytes)) as pil_img:
                rgb_img = pil_img.convert("RGB").resize(TARGET_IMAGE_SIZE, Image.Resampling.BILINEAR)
                img_array = np.array(rgb_img, dtype=np.float32)
                
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
        """
        Creates a temporary file on disk for processing, returning the absolute path.
        """
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, filename)
        with open(temp_path, "wb") as f:
            f.write(image_bytes)
        return temp_path

    @staticmethod
    def cleanup_temporary_file(file_path: str):
        """Safely removes a temporary file from disk."""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            logger.warning(f"Failed to remove temporary file {file_path}: {e}")


image_service = ImageService()
