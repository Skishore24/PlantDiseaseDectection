import logging
from datetime import timedelta
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field

from backend.config import settings
from backend.utils.security import get_password_hash, verify_password
from backend.utils.auth import create_access_token, get_current_user
from backend.database import db_manager, load_local_json, save_local_json

logger = logging.getLogger("leafguard.auth")

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ─────────────────────────────────────────────────────────────
# Pydantic Request / Response Schemas
# ─────────────────────────────────────────────────────────────
class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    role: Optional[str] = "Agronomist"
    company: Optional[str] = ""


class UserLoginRequest(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: str


class UserProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    company: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse


# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────
def find_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    email_clean = email.lower().strip()
    coll = db_manager.get_collection("users")
    if coll is not None:
        try:
            user = coll.find_one({"email": email_clean})
            if user:
                user["id"] = str(user.pop("_id"))
                return user
        except Exception as e:
            logger.warning(f"MongoDB user lookup error: {e}")

    # Local fallback
    local_users = load_local_json("users_store.json")
    if isinstance(local_users, dict) and email_clean in local_users:
        u = dict(local_users[email_clean])
        u["id"] = u.get("id", email_clean)
        return u

    return None


def save_user(user_data: Dict[str, Any]):
    email_clean = user_data["email"].lower().strip()
    # 1. Save locally
    local_users = load_local_json("users_store.json")
    if not isinstance(local_users, dict):
        local_users = {}
    local_users[email_clean] = user_data
    save_local_json("users_store.json", local_users)

    # 2. Save to MongoDB if online
    coll = db_manager.get_collection("users")
    if coll is not None:
        try:
            db_record = dict(user_data)
            db_record.pop("id", None)
            res = coll.insert_one(db_record)
            user_data["id"] = str(res.inserted_id)
        except Exception as e:
            logger.warning(f"MongoDB user save error: {e}")


# ─────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────
@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegisterRequest):
    """Register a new user and return JWT access token."""
    existing = find_user_by_email(user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    hashed_pw = get_password_hash(user_in.password)
    user_record = {
        "id": user_in.email.lower().strip(),
        "name": user_in.name.strip(),
        "email": user_in.email.lower().strip(),
        "role": user_in.role or "Agronomist",
        "company": user_in.company or "",
        "hashed_password": hashed_pw,
        "is_active": True,
    }

    save_user(user_record)
    logger.info(f"User registered successfully: {user_in.email}")

    token = create_access_token(
        subject=user_record["email"],
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_record.get("id", user_record["email"]),
            "name": user_record["name"],
            "email": user_record["email"],
            "role": user_record["role"],
            "company": user_record["company"]
        }
    }


@router.post("/login", response_model=AuthResponse)
async def login(
    request: Request
):
    """
    Authenticate user via JSON body or form urlencoded and return JWT.
    """
    email = None
    password = None

    # Check JSON payload first
    try:
        body = await request.json()
        if isinstance(body, dict):
            email = body.get("email") or body.get("username")
            password = body.get("password")
    except Exception:
        pass

    # If not JSON, check form data
    if not email or not password:
        try:
            form = await request.form()
            email = form.get("username") or form.get("email")
            password = form.get("password")
        except Exception:
            pass

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required."
        )

    user = find_user_by_email(email)
    if not user or not verify_password(password, user.get("hashed_password", "")):
        logger.warning(f"Failed login attempt for: {email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(
        subject=user["email"],
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    logger.info(f"User logged in: {user['email']}")
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.get("id", user["email"]),
            "name": user.get("name", user["email"].split("@")[0]),
            "email": user["email"],
            "role": user.get("role", "Agronomist"),
            "company": user.get("company", "")
        }
    }


@router.get("/me", response_model=UserProfileResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Retrieve the current authenticated user profile."""
    return {
        "id": str(current_user.get("id", current_user.get("email", ""))),
        "name": current_user.get("name", ""),
        "email": current_user.get("email", ""),
        "role": current_user.get("role", "Agronomist"),
        "company": current_user.get("company", "")
    }
