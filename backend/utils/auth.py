from datetime import datetime, timedelta
from typing import Any, Union, Optional, Dict
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from backend.config import settings
from backend.database import db_manager, load_local_json

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)


def create_access_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a signed JWT access token."""
    expire = datetime.utcnow() + (
        expires_delta
        if expires_delta
        else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    to_encode = {
        "sub": str(subject),
        "exp": expire,
        "type": "access"
    }

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return encoded_jwt


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Safely decode and validate a JWT access token."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def get_current_user(token: Optional[str] = Depends(reusable_oauth2)) -> Dict[str, Any]:
    """FastAPI dependency to retrieve the authenticated user from JWT."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Lookup user from MongoDB
    coll = db_manager.get_collection("users")
    if coll is not None:
        try:
            user = coll.find_one({"email": email.lower().strip()})
            if user:
                user["id"] = str(user.pop("_id"))
                user.pop("hashed_password", None)
                return user
        except Exception:
            pass

    # Lookup user from local store fallback
    local_users = load_local_json("users_store.json")
    if isinstance(local_users, dict):
        user = local_users.get(email.lower().strip())
        if user:
            clean = {k: v for k, v in user.items() if k != "hashed_password"}
            clean["id"] = clean.get("id", email)
            return clean

    # Return standard user context if valid JWT but not yet in storage
    return {
        "id": email,
        "email": email,
        "name": email.split("@")[0],
        "role": "User",
        "company": "",
    }
