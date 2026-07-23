from fastapi import APIRouter
from app.db.mongo import mongo_db
from app.services.prediction_service import prediction_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health")
async def health_check():
    model_status = prediction_service.get_model_status()
    db_status = "disconnected"
    
    try:
        if mongo_db.db is not None:
            mongo_db.db.command("ping")
            db_status = "connected"
    except Exception as e:
        logger.error(f"DB health check failed: {e}")

    return {
        "status": "ok",
        "db": db_status,
        "model_status": model_status
    }