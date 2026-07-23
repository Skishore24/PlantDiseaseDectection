# app/api/history.py
from fastapi import APIRouter, Depends, Query
from typing import Optional, List, Dict, Any
import logging

from app.core.security import decode_token
from app.services.prediction_service import prediction_service
from fastapi.security import OAuth2PasswordBearer

logger = logging.getLogger(__name__)

router = APIRouter(tags=["History"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


@router.get("/history")
async def get_history(
    limit: int = Query(20, ge=1, le=100),
    token: Optional[str] = Depends(oauth2_scheme)
):
    """
    Returns recent scan history. If user token is supplied, filters by user.
    """
    user_id = None
    if token:
        payload = decode_token(token)
        if payload and "sub" in payload:
            user_id = payload["sub"]

    try:
        history = prediction_service.get_user_history(user_id=user_id, limit=limit)
        return {"history": history}
    except Exception as e:
        logger.error(f"Error loading history: {e}")
        return {"history": []}
