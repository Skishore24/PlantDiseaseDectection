import os
import sys
from pathlib import Path

# Resolve paths
API_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = API_DIR.parent
BACKEND_DIR = PROJECT_ROOT / "backend"

for path in [str(PROJECT_ROOT), str(BACKEND_DIR), str(API_DIR)]:
    if path not in sys.path:
        sys.path.insert(0, path)

try:
    from backend.app import app
except ImportError:
    from app import app  # type: ignore

app = app
