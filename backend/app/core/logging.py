import logging
import os
from logging.handlers import RotatingFileHandler

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────
LOG_DIR = "logs"
LOG_FILE = os.path.join(LOG_DIR, "app.log")

os.makedirs(LOG_DIR, exist_ok=True)


def setup_logging():
    """
    Configure application-wide logging.
    """

    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    # Prevent duplicate logs
    if logger.handlers:
        return

    # ─────────────────────────────
    # FORMAT
    # ─────────────────────────────
    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
    )

    # ─────────────────────────────
    # FILE HANDLER (ROTATING)
    # ─────────────────────────────
    file_handler = RotatingFileHandler(
        LOG_FILE,
        maxBytes=5 * 1024 * 1024,  # 5MB
        backupCount=3,
        encoding="utf-8"
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)

    # ─────────────────────────────
    # CONSOLE HANDLER
    # ─────────────────────────────
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)

    # ─────────────────────────────
    # ADD HANDLERS
    # ─────────────────────────────
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    logger.info("✅ Logging initialized")