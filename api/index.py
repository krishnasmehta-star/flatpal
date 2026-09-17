# Vercel Python serverless entry point. Routes /api/* to the FastAPI app in backend/.
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
from server import app  # noqa: E402,F401
