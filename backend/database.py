import os
import json
import time
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, PyMongoError
from backend.config import settings
import certifi

logger = logging.getLogger("leafguard.database")

# Safe local store paths for offline/local development fallback
def _get_local_store_path(filename: str) -> str:
    log_dir = os.path.join(os.path.dirname(__file__), "logs")
    try:
        os.makedirs(log_dir, exist_ok=True)
        return os.path.join(log_dir, filename)
    except Exception:
        import tempfile
        return os.path.join(tempfile.gettempdir(), filename)


class DatabaseManager:
    def __init__(self):
        self.client: Optional[MongoClient] = None
        self.db = None
        self.last_attempt_time = 0
        self.retry_cooldown_seconds = 5

    def connect(self, force: bool = False) -> bool:
        """
        Connect to MongoDB Atlas with auto-retry safety and SSL fallback.
        """
        if self.db is not None and not force:
            try:
                self.client.admin.command("ping")
                return True
            except Exception:
                logger.warning("Active MongoDB connection dropped. Reconnecting...")
                self.client = None
                self.db = None

        if not settings.MONGO_URI:
            logger.info("MONGO_URI is not set. Operating in local storage mode.")
            return False

        now = time.time()
        if not force and (now - self.last_attempt_time) < self.retry_cooldown_seconds:
            return False

        self.last_attempt_time = now

        try:
            logger.info("Connecting to MongoDB...")
            conn_kwargs: Dict[str, Any] = {
                "serverSelectionTimeoutMS": 5000,
                "connectTimeoutMS": 5000,
                "socketTimeoutMS": 10000,
            }

            if (
                settings.MONGO_URI.startswith("mongodb+srv://")
                or "tls=" in settings.MONGO_URI
                or "ssl=true" in settings.MONGO_URI.lower()
            ):
                try:
                    conn_kwargs["tlsCAFile"] = certifi.where()
                except Exception:
                    pass

            try:
                self.client = MongoClient(settings.MONGO_URI, **conn_kwargs)
                self.client.admin.command("ping")
            except Exception as ssl_err:
                logger.warning(f"Standard SSL connection failed: {ssl_err}. Retrying with relaxed cert validation...")
                conn_kwargs["tlsAllowInvalidCertificates"] = True
                self.client = MongoClient(settings.MONGO_URI, **conn_kwargs)
                self.client.admin.command("ping")

            self.db = self.client[settings.DATABASE_NAME]

            # Ensure optimal database indexes
            try:
                self.db["predictions"].create_index([("user_id", 1), ("created_at", -1)])
                self.db["users"].create_index("email", unique=True)
            except Exception as idx_err:
                logger.warning(f"Index creation notice: {idx_err}")

            logger.info(f"MongoDB connected successfully: '{settings.DATABASE_NAME}'")
            return True

        except ConnectionFailure as e:
            logger.warning(f"MongoDB connection failed: {e}")
            self.client = None
            self.db = None
            return False
        except Exception as e:
            logger.warning(f"MongoDB unexpected connection error: {e}")
            self.client = None
            self.db = None
            return False

    def close(self):
        """Close MongoDB connection gracefully."""
        if self.client:
            try:
                self.client.close()
                logger.info("MongoDB connection closed.")
            except Exception as e:
                logger.warning(f"Error closing MongoDB: {e}")
            finally:
                self.client = None
                self.db = None

    def get_collection(self, collection_name: str):
        if self.db is None:
            self.connect()
        if self.db is not None:
            try:
                return self.db[collection_name]
            except Exception:
                return None
        return None


db_manager = DatabaseManager()


# ─────────────────────────────────────────────────────────────
# Local Persistent Fallback Store (Local JSON Storage)
# ─────────────────────────────────────────────────────────────
def load_local_json(filename: str) -> List[Dict[str, Any]]:
    filepath = _get_local_store_path(filename)
    if not os.path.exists(filepath):
        return []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading local JSON {filename}: {e}")
        return []


def save_local_json(filename: str, data: Any):
    filepath = _get_local_store_path(filename)
    try:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)
    except Exception as e:
        logger.error(f"Error saving local JSON {filename}: {e}")
