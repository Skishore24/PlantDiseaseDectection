import os
import json
import logging
from typing import Optional, Dict, Any

from app.db.mongo import get_db
from app.schemas.user import UserCreate
from app.core.security import get_password_hash, verify_password

logger = logging.getLogger(__name__)

# Persistent local user store file
USERS_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "logs", "users_store.json")
os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)


def _load_local_users() -> Dict[str, Dict[str, Any]]:
    """Loads local user database from JSON file."""
    if not os.path.exists(USERS_FILE):
        return {}
    try:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed loading local users file: {e}")
        return {}


def _save_local_user(user_dict: Dict[str, Any]):
    """Saves user data to local persistent JSON file."""
    try:
        users = _load_local_users()
        email = user_dict["email"].lower().strip()
        users[email] = user_dict
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(users, f, indent=2)
        logger.info(f"✅ Saved user locally to {USERS_FILE}: {email}")
    except Exception as e:
        logger.error(f"Failed saving local user: {e}")


class UserService:

    def get_collection(self):
        try:
            db = get_db()
            return db["users"] if db is not None else None
        except Exception:
            return None

    # ─────────────────────────────────────────────
    # GET USER BY EMAIL
    # ─────────────────────────────────────────────
    def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        email = email.lower().strip()
        col = self.get_collection()

        if col is not None:
            try:
                user = col.find_one({"email": email})
                if user:
                    user["id"] = str(user.pop("_id"))
                    user.pop("hashed_password", None)
                    return user
            except Exception as e:
                logger.warning(f"MongoDB query failed in get_by_email: {e}")

        # Check local persistent file store
        local_users = _load_local_users()
        user = local_users.get(email)
        if user:
            result = {k: v for k, v in user.items() if k != "hashed_password"}
            result["id"] = user.get("id", email)
            return result

        return None

    # ─────────────────────────────────────────────
    # CREATE USER
    # ─────────────────────────────────────────────
    def create(self, user_in: UserCreate) -> Dict[str, Any]:
        email = user_in.email.lower().strip()
        local_users = _load_local_users()

        # Check if user exists locally or in MongoDB
        if email in local_users:
            raise ValueError("User already exists")

        col = self.get_collection()
        if col is not None:
            try:
                if col.find_one({"email": email}):
                    raise ValueError("User already exists")
            except ValueError:
                raise
            except Exception as e:
                logger.warning(f"MongoDB check failed in create: {e}")

        hashed = get_password_hash(user_in.password)
        user_data = {
            "id":              email,
            "email":           email,
            "name":            (user_in.name or "").strip(),
            "role":            user_in.role or "User",
            "company":         user_in.company or "",
            "hashed_password": hashed,
            "is_active":       True,
        }

        # Guaranteed instant persistence to local file
        _save_local_user(user_data)

        # Sync to MongoDB if available
        if col is not None:
            try:
                db_data = dict(user_data)
                db_data.pop("id", None)
                result = col.insert_one(db_data)
                user_data["id"] = str(result.inserted_id)
                logger.info(f"User synced to MongoDB: {email}")
            except Exception as e:
                logger.warning(f"Failed MongoDB insert for user: {e}")

        return {k: v for k, v in user_data.items() if k != "hashed_password"}

    # ─────────────────────────────────────────────
    # AUTHENTICATE
    # ─────────────────────────────────────────────
    def authenticate(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        email = email.lower().strip()
        col = self.get_collection()

        # 1. Try MongoDB Atlas authentication
        if col is not None:
            try:
                user = col.find_one({"email": email})
                if user and verify_password(password, user.get("hashed_password", "")):
                    logger.info(f"Auth success via MongoDB: {email}")
                    return {
                        "id":      str(user["_id"]),
                        "email":   user["email"],
                        "name":    user.get("name", ""),
                        "role":    user.get("role", "User"),
                        "company": user.get("company", ""),
                    }
            except Exception as e:
                logger.warning(f"MongoDB auth query failed: {e}")

        # 2. Fallback to local persistent file store
        local_users = _load_local_users()
        user = local_users.get(email)
        if user:
            if verify_password(password, user.get("hashed_password", "")):
                logger.info(f"Auth success via local store: {email}")
                
                # Proactively sync user to MongoDB if MongoDB became available
                if col is not None:
                    try:
                        if not col.find_one({"email": email}):
                            db_data = dict(user)
                            db_data.pop("id", None)
                            col.insert_one(db_data)
                            logger.info(f"Synced local user to MongoDB: {email}")
                    except Exception:
                        pass

                return {
                    "id":      user.get("id", email),
                    "email":   user["email"],
                    "name":    user.get("name", ""),
                    "role":    user.get("role", "User"),
                    "company": user.get("company", ""),
                }

        return None


# Singleton instance
user_service = UserService()