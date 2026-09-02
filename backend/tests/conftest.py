"""Test configuration.

Sets the environment BEFORE the application package is imported so the SQLAlchemy
engine binds to a throwaway database instead of the dev ``dev.db``, and provides a
non-secret JWT key for tests.
"""

import os
import tempfile

os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/test.db"
os.environ.setdefault("JWT_SECRET", "test-secret-key-not-a-real-secret")
