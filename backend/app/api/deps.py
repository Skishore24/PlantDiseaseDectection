from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import logging

from app.core.config import settings
from app.core.security import decode_token
from app.services.user_service import user_service

logger = logging.getLogger(__name__)

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


def get_current_user(token: str = Depends(reusable_oauth2)):
    payload = decode_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid token"
        )

    email = payload.get("sub")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid token payload"
        )

    user = user_service.get_by_email(email)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user