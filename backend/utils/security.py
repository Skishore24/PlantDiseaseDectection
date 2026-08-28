import re
import bcrypt
import logging
from typing import Tuple

logger = logging.getLogger("leafguard.security")

# Pre-computed bcrypt hash used for constant-time dummy verification
# Prevents user enumeration via timing attack when looking up non-existent accounts
DUMMY_PASSWORD_HASH = "$2b$12$uE0Jgq0Rk3F2Lw1BfEaBieF6Dsk6WjJjZlU3gB5nE5Gk1N2o3P4qS"

COMMON_WEAK_PASSWORDS = {
    "password", "password123", "12345678", "123456789", "qwerty123",
    "admin123", "leafguard123", "plantai123", "welcome123", "letmein123"
}


def get_password_hash(password: str) -> str:
    """Hash a password securely using bcrypt."""
    pw_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a bcrypt hashed password."""
    try:
        pw_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pw_bytes, hash_bytes)
    except Exception as e:
        logger.warning(f"Password verification error: {e}")
        return False


def verify_dummy_password(plain_password: str) -> bool:
    """
    Executes a dummy bcrypt check against a fixed hash.
    Ensures identical response timing for non-existent users, neutralizing timing attacks.
    """
    try:
        pw_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = DUMMY_PASSWORD_HASH.encode("utf-8")
        bcrypt.checkpw(pw_bytes, hash_bytes)
    except Exception:
        pass
    return False


def validate_password_strength(password: str) -> Tuple[bool, str]:
    """
    Enforces enterprise password complexity policies:
    - Minimum 8 characters, maximum 100 characters
    - At least 1 lowercase letter
    - At least 1 uppercase letter
    - At least 1 digit
    - At least 1 special character
    - Not a known weak/common password
    """
    if not password or len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if len(password) > 100:
        return False, "Password cannot exceed 100 characters."
    if password.lower() in COMMON_WEAK_PASSWORDS:
        return False, "This password is too common or easily guessable. Please choose a stronger password."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter (a-z)."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter (A-Z)."
    if not re.search(r"\d", password):
        return False, "Password must contain at least one number (0-9)."
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{}|;:,.<>?/~`]", password):
        return False, "Password must contain at least one special character (e.g. !@#$%^&*)."

    return True, "Password meets all security criteria."
