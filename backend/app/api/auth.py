from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
import logging

from app.core.config import settings
from app.core.security import create_access_token
from app.services.user_service import user_service
from app.schemas.user import Token, User, UserCreate, LoginResponse
from app.api.deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Authenticate user and return JWT + user profile."""
    try:
        user = user_service.authenticate(form_data.username, form_data.password)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token = create_access_token(
            subject=user["email"],
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )

        logger.info(f"Login success: {user['email']}")

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id":      str(user.get("_id", user.get("id", user["email"]))),
                "name":    user.get("name", user["email"].split("@")[0]),
                "email":   user["email"],
                "role":    user.get("role", "User"),
                "company": user.get("company", ""),
            },
        }

    except HTTPException:
        raise
    except Exception:
        logger.exception("Login failed")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/signup", response_model=User)
async def signup(user_in: UserCreate):
    """Register a new user."""
    try:
        existing = user_service.get_by_email(user_in.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists",
            )

        user = user_service.create(user_in)
        logger.info(f"User registered: {user_in.email}")
        return user

    except HTTPException:
        raise
    except Exception:
        logger.exception("Signup failed")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/me", response_model=User)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user