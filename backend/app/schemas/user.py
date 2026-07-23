from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


# ─────────────────────────────────────────────
# BASE USER
# ─────────────────────────────────────────────
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = Field(default=None, max_length=100)
    role: Optional[str] = Field(default="User", max_length=50)
    company: Optional[str] = Field(default=None, max_length=100)
    is_active: bool = True


# ─────────────────────────────────────────────
# CREATE USER (Registration input)
# ─────────────────────────────────────────────
class UserCreate(UserBase):
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)
    name: str = Field(min_length=2, max_length=100)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if " " in v:
            raise ValueError("Password cannot contain spaces")
        return v

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str):
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()


# ─────────────────────────────────────────────
# UPDATE USER
# ─────────────────────────────────────────────
class UserUpdate(UserBase):
    password: Optional[str] = Field(default=None, min_length=8, max_length=100)


# ─────────────────────────────────────────────
# USER PROFILE (safe to return in responses)
# ─────────────────────────────────────────────
class UserProfile(BaseModel):
    id: str
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = "User"
    company: Optional[str] = None


# ─────────────────────────────────────────────
# RESPONSE USER (legacy compat)
# ─────────────────────────────────────────────
class User(BaseModel):
    id: str
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = "User"
    company: Optional[str] = None
    is_active: bool = True

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# TOKEN RESPONSE (legacy — token only)
# ─────────────────────────────────────────────
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ─────────────────────────────────────────────
# LOGIN RESPONSE (token + user profile)
# ─────────────────────────────────────────────
class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile


# ─────────────────────────────────────────────
# TOKEN PAYLOAD
# ─────────────────────────────────────────────
class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
    type: Optional[str] = None