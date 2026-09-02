"""Tests for registration, login, rate limiting and account deletion."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.rate_limit import limiter
from app.main import app
from app.models import ClothingItem, Outfit, User


@pytest.fixture(autouse=True)
def _reset_rate_limiter() -> None:
    limiter.reset()
    yield


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def _register(client: TestClient, email: str, password: str):
    return client.post("/api/auth/register", json={"email": email, "password": password})


def test_register_success(client: TestClient) -> None:
    res = _register(client, "new@example.com", "password123")
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == "new@example.com"
    assert data["id"] > 0


def test_register_duplicate_email(client: TestClient) -> None:
    assert _register(client, "dup@example.com", "password123").status_code == 201
    assert _register(client, "dup@example.com", "password123").status_code == 409


def test_register_short_password(client: TestClient) -> None:
    assert _register(client, "short@example.com", "short").status_code == 400


def test_login_ok(client: TestClient) -> None:
    _register(client, "login@example.com", "password123")
    res = client.post(
        "/api/auth/login",
        json={"email": "login@example.com", "password": "password123"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["token_type"] == "bearer"
    assert data["access_token"]


def test_login_wrong_password(client: TestClient) -> None:
    _register(client, "wrong@example.com", "password123")
    res = client.post(
        "/api/auth/login",
        json={"email": "wrong@example.com", "password": "nope"},
    )
    assert res.status_code == 401


def test_rate_limit_429(client: TestClient) -> None:
    for i in range(10):
        assert _register(client, f"rl{i}@example.com", "password123").status_code == 201
    res = _register(client, "rl10@example.com", "password123")
    assert res.status_code == 429


def test_delete_account_removes_data(client: TestClient, tmp_path, monkeypatch) -> None:
    upload_dir = tmp_path / "uploads"
    upload_dir.mkdir()
    monkeypatch.setenv("UPLOAD_DIR", str(upload_dir))

    _register(client, "del@example.com", "password123")
    login_res = client.post(
        "/api/auth/login",
        json={"email": "del@example.com", "password": "password123"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    image_path = "dress.png"
    (upload_dir / image_path).write_bytes(b"fake-image")

    db: Session = SessionLocal()
    user = db.query(User).filter(User.email == "del@example.com").first()
    user_id = user.id
    db.add(ClothingItem(user_id=user.id, name="Dress", category="kleider", image_path=image_path))
    db.add(Outfit(user_id=user.id, name="My outfit"))
    db.commit()
    db.close()

    res = client.delete("/api/auth/me", headers=headers)
    assert res.status_code == 204

    assert not (upload_dir / image_path).exists()

    db = SessionLocal()
    assert db.query(User).filter(User.email == "del@example.com").first() is None
    assert db.query(ClothingItem).filter(ClothingItem.user_id == user_id).count() == 0
    assert db.query(Outfit).filter(Outfit.user_id == user_id).count() == 0
    db.close()


def test_delete_account_requires_auth(client: TestClient) -> None:
    assert client.delete("/api/auth/me").status_code == 401
