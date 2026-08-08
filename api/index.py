import os
import sys
from pathlib import Path

# Resolve paths: __file__ is inside api/ directory
API_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = API_DIR.parent
BACKEND_DIR = PROJECT_ROOT / "backend"

for path in [str(BACKEND_DIR), str(PROJECT_ROOT), str(API_DIR)]:
    if path not in sys.path:
        sys.path.insert(0, path)

try:
    from app.main import app
except ImportError:
    from backend.app.main import app

# Expose app for Vercel Serverless Function engine
app = app

