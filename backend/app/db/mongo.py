from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, PyMongoError
from app.core.config import settings
import certifi
import logging
import time

logger = logging.getLogger(__name__)


class MongoDB:
    def __init__(self):
        self.client: MongoClient = None
        self.db = None
        self.last_attempt_time = 0
        self.retry_cooldown_seconds = 5  # Cooldown between reconnection attempts if Atlas is provisioning

    def connect(self, force: bool = False) -> bool:
        """
        Establish MongoDB connection with auto-retry safety.
        """
        if self.db is not None and not force:
            try:
                # Quick ping to verify active topology
                self.client.admin.command("ping")
                return True
            except Exception:
                logger.warning("⚠️ Active MongoDB connection lost. Reconnecting...")
                self.client = None
                self.db = None

        # Prevent hammering DNS when cluster is provisioning
        now = time.time()
        if not force and (now - self.last_attempt_time) < self.retry_cooldown_seconds:
            return False

        self.last_attempt_time = now

        try:
            logger.info("🔌 Connecting to MongoDB Atlas...")

            conn_kwargs = {
                "serverSelectionTimeoutMS": 5000,
                "connectTimeoutMS": 5000,
                "socketTimeoutMS": 10000,
            }

            if settings.MONGO_URI.startswith("mongodb+srv://") or "tls=" in settings.MONGO_URI or "ssl=true" in settings.MONGO_URI.lower():
                try:
                    conn_kwargs["tlsCAFile"] = certifi.where()
                except Exception:
                    pass

            try:
                self.client = MongoClient(settings.MONGO_URI, **conn_kwargs)
                self.client.admin.command("ping")
            except Exception as ssl_err:
                logger.warning(f"Standard SSL connection failed: {ssl_err}. Retrying with tlsAllowInvalidCertificates=True...")
                conn_kwargs["tlsAllowInvalidCertificates"] = True
                self.client = MongoClient(settings.MONGO_URI, **conn_kwargs)
                self.client.admin.command("ping")

            self.db = self.client[settings.DATABASE_NAME]

            # Create Indexes for maximum query performance
            try:
                self.db["predictions"].create_index([("user_id", 1), ("timestamp", -1)])
                self.db["users"].create_index("email", unique=True)
            except Exception as idx_err:
                logger.warning(f"Index creation warning: {idx_err}")

            logger.info(f"✅ MongoDB Atlas Connected Successfully: database '{settings.DATABASE_NAME}'")
            return True

        except ConnectionFailure as e:
            logger.warning(f"⚠️ MongoDB Atlas unavailable (provisioning or network issue): {e}")
            self.client = None
            self.db = None
            return False

        except Exception as e:
            logger.warning(f"⚠️ MongoDB Atlas connection error: {e}")
            self.client = None
            self.db = None
            return False

    def close(self):
        """
        Close MongoDB connection safely.
        """
        if self.client:
            try:
                self.client.close()
                logger.info("🔌 MongoDB connection closed")
            except Exception as e:
                logger.warning(f"Error closing MongoDB: {e}")
            finally:
                self.client = None
                self.db = None


# Singleton instance
mongo_db = MongoDB()


def get_db():
    """
    Safe DB getter with automatic auto-reconnect.
    """
    if mongo_db.db is None:
        mongo_db.connect()

    return mongo_db.db