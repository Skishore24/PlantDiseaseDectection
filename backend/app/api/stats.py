from fastapi import APIRouter
import logging

from app.services.prediction_service import prediction_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Statistics"])


@router.get("/stats")
def get_stats():
    try:
        data = prediction_service.get_stats()
        return {
            "total_scans": data.get("total_predictions", 0),
            "top_disease": data.get("top_disease"),
            "avg_confidence": data.get("avg_confidence")
        }
    except Exception as e:
        logger.error(f"Stats error: {e}")
        return {
            "total_scans": 0,
            "top_disease": None,
            "avg_confidence": None
        }


@router.get("/stats/analytics")
def get_analytics():
    try:
        return prediction_service.get_analytics_telemetry()
    except Exception as e:
        logger.error(f"Analytics telemetry error: {e}")
        return {
            "totalScans": 0,
            "healthyScans": 0,
            "diseasedScans": 0,
            "avgConfidence": 0.0,
            "topDisease": "None",
            "diseaseDistribution": [],
            "cropHealthRadar": [],
            "history": []
        }