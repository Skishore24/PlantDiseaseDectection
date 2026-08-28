import os
import sys
import socket
import uvicorn
from pathlib import Path

# Ensure UTF-8 output encoding for Windows terminals
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure root workspace directory is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


def find_available_port(start_port=8000, max_attempts=20):
    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    return start_port


if __name__ == "__main__":
    port = find_available_port(8000)
    print("==================================================")
    print("🌿 LeafGuard AI Backend API Server Starting...")
    print(f"API Endpoint: http://127.0.0.1:{port}/api/v1")
    print(f"Swagger Docs: http://127.0.0.1:{port}/api/v1/docs")
    print("==================================================")
    uvicorn.run("backend.app:app", host="127.0.0.1", port=port, reload=True)
