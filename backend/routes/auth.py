import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from pydantic import BaseModel, EmailStr, Field

from backend.config import settings
from backend.utils.security import (
    get_password_hash,
    verify_password,
    verify_dummy_password,
    validate_password_strength,
)
from backend.utils.auth import create_access_token, get_current_user
from backend.utils.rate_limiter import auth_security_tracker
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


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)


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


def update_user_field(email: str, updates: Dict[str, Any]):
    email_clean = email.lower().strip()
    # 1. Update locally
    local_users = load_local_json("users_store.json")
    if isinstance(local_users, dict) and email_clean in local_users:
        local_users[email_clean].update(updates)
        save_local_json("users_store.json", local_users)

    # 2. Update in MongoDB
    coll = db_manager.get_collection("users")
    if coll is not None:
        try:
            coll.update_one({"email": email_clean}, {"$set": updates})
        except Exception as e:
            logger.warning(f"MongoDB update error: {e}")


# ─────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────
@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegisterRequest, request: Request):
    """
    Register a new user with strict password validation and security hashing.
    """
    client_ip = request.client.host if request.client else "unknown"

    # Enforce strict password strength criteria
    is_valid_pw, pw_message = validate_password_strength(user_in.password)
    if not is_valid_pw:
        logger.warning(f"Registration rejected due to weak password from IP {client_ip}: {pw_message}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=pw_message
        )

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
        "company": user_in.company.strip() if user_in.company else "",
        "hashed_password": hashed_pw,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login": datetime.now(timezone.utc).isoformat(),
    }

    save_user(user_record)
    logger.info(f"✅ User registered successfully: {user_in.email} from IP {client_ip}")

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
    request: Request,
    response: Response,
):
    """
    Authenticate user with brute-force defense, account lockout, and timing attack protection.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"

    # Enforce IP login attempt velocity
    ip_allowed, remaining_ip_tries = auth_security_tracker.is_ip_allowed(client_ip)
    if not ip_allowed:
        logger.warning(f"🚨 Auth IP rate limit triggered for {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts from this network. Please wait a minute before retrying."
        )

    email = None
    password = None

    # Parse JSON or form data
    try:
        body = await request.json()
        if isinstance(body, dict):
            email = body.get("email") or body.get("username")
            password = body.get("password")
    except Exception:
        pass

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

    email_clean = str(email).lower().strip()

    # Check if account is currently locked out
    is_locked, remaining_seconds = auth_security_tracker.is_locked(email_clean)
    if is_locked:
        minutes = max(1, (remaining_seconds + 59) // 60)
        logger.warning(f"Blocked login attempt on locked account '{email_clean}' from IP {client_ip}")
        response.headers["Retry-After"] = str(remaining_seconds)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Account temporarily locked due to multiple failed attempts. Please try again in {minutes} minute{'s' if minutes != 1 else ''}."
        )

    user = find_user_by_email(email_clean)

    # Timing attack protection: run dummy verification if user is not in database
    if not user:
        verify_dummy_password(password)
        count, lockout_sec = auth_security_tracker.record_failed_attempt(email_clean)
        logger.warning(f"Failed login attempt for non-existent account: '{email_clean}' from IP {client_ip} (Attempt {count})")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify password
    is_valid = verify_password(password, user.get("hashed_password", ""))
    if not is_valid:
        count, lockout_sec = auth_security_tracker.record_failed_attempt(email_clean)
        logger.warning(f"Failed login attempt for: '{email_clean}' from IP {client_ip} (Attempt {count}/5)")

        if lockout_sec:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Account has been temporarily locked for 15 minutes due to 5 consecutive failed login attempts.",
                headers={"Retry-After": str(lockout_sec)}
            )

        remaining_tries = max(1, 5 - count)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Incorrect email or password. ({remaining_tries} attempt{'s' if remaining_tries != 1 else ''} remaining before temporary lockout)",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Authentication Successful: Reset lockout attempt counter
    auth_security_tracker.reset_attempts(email_clean)

    # Record login telemetry
    now_iso = datetime.now(timezone.utc).isoformat()
    update_user_field(email_clean, {"last_login": now_iso})

    token = create_access_token(
        subject=user["email"],
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    logger.info(f"✅ User authenticated successfully: {user['email']} from IP {client_ip}")
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


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Secure password change endpoint requiring old password verification and strength enforcement.
    """
    email = current_user["email"].lower().strip()
    user = find_user_by_email(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found."
        )

    # Verify current password
    if not verify_password(data.current_password, user.get("hashed_password", "")):
        logger.warning(f"Password change rejected: incorrect current password for {email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password."
        )

    # Validate new password strength
    is_valid_pw, pw_message = validate_password_strength(data.new_password)
    if not is_valid_pw:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=pw_message
        )

    # Prevent reusing the exact same password
    if verify_password(data.new_password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from your current password."
        )

    # Hash and update password
    new_hash = get_password_hash(data.new_password)
    update_user_field(email, {
        "hashed_password": new_hash,
        "password_changed_at": datetime.now(timezone.utc).isoformat()
    })

    logger.info(f"🔑 Password updated successfully for user: {email}")

    # Generate new token
    new_token = create_access_token(
        subject=email,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {
        "message": "Password changed successfully.",
        "access_token": new_token,
        "token_type": "bearer"
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
