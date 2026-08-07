# app/api/history.py
from fastapi import APIRouter, Depends, Query
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
import logging

from app.core.security import decode_token
from app.services.prediction_service import prediction_service
from fastapi.security import OAuth2PasswordBearer

logger = logging.getLogger(__name__)

router = APIRouter(tags=["History"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


class DeleteBatchRequest(BaseModel):
    ids: List[str]


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


@router.delete("/history")
async def clear_history(token: Optional[str] = Depends(oauth2_scheme)):
    """
    Clears all scan history for the user from MongoDB and storage.
    """
    user_id = None
    if token:
        payload = decode_token(token)
        if payload and "sub" in payload:
            user_id = payload["sub"]
    prediction_service.clear_user_history(user_id=user_id)
    return {"status": "success", "message": "All history deleted from database"}


@router.post("/history/delete")
async def delete_batch(body: DeleteBatchRequest, token: Optional[str] = Depends(oauth2_scheme)):
    """
    Deletes multiple selected scan history records from MongoDB.
    """
    user_id = None
    if token:
        payload = decode_token(token)
        if payload and "sub" in payload:
            user_id = payload["sub"]
    deleted_count = prediction_service.delete_history_batch(target_ids=body.ids, user_id=user_id)
    return {"status": "success", "deleted_count": deleted_count}


@router.delete("/history/{item_id}")
async def delete_item(item_id: str, token: Optional[str] = Depends(oauth2_scheme)):
    """
    Deletes a single scan history record from MongoDB.
    """
    user_id = None
    if token:
        payload = decode_token(token)
        if payload and "sub" in payload:
            user_id = payload["sub"]
    prediction_service.delete_history_item(item_id, user_id=user_id)
    return {"status": "success"}

