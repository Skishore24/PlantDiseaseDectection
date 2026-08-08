import os
import uuid
import shutil
import logging
from typing import Optional

from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends

from app.services.prediction_service import prediction_service
from app.api.deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Predictions"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".jfif"}

try:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
except Exception:
    import tempfile
    UPLOAD_DIR = tempfile.gettempdir()


@router.post("/predict")
async def predict_api(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Run AI leaf disease diagnosis.
    Requires a valid JWT Bearer token.
    """
    user_id = current_user.get("email", "unknown")

    # ── Validate content type ─────────────────────
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are accepted",
        )

    # ── Validate file extension ───────────────────
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # ── Read and size-check ───────────────────────
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file")
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds 10 MB limit",
        )

    # Reset pointer after read
    file.file.seek(0)

    # ── Save temp file ────────────────────────────
    file_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, file_name)

    try:
        with open(file_path, "wb") as buf:
            shutil.copyfileobj(file.file, buf)

        logger.info(f"Image saved for inference: {file_name} (user={user_id})")

        # ── Run model ─────────────────────────────
        result = await prediction_service.create_prediction(
            img_path=file_path,
            user_id=user_id,
        )

        if isinstance(result, dict) and "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        logger.info(f"Prediction complete: {result.get('disease')} ({result.get('confidence')}%) user={user_id}")
        result["img_url"] = f"/uploads/{file_name}"
        return result

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception(f"Prediction failed for user={user_id}")
        raise HTTPException(status_code=500, detail="Internal model error")