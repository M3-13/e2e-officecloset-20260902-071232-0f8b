"""Tests for the wardrobe routes (CRUD, filtering, isolation, upload limits)."""

import io

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.core.database import SessionLocal
from app.core.security import create_access_token
from app.main import app
from app.models import User


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("UPLOAD_DIR", str(tmp_path))
    with TestClient(app) as c:
        yield c


def _token_for(email: str) -> str:
    db = SessionLocal()
    try:
        user = User(email=email, hashed_password="x")
        db.add(user)
        db.commit()
        db.refresh(user)
        return create_access_token(user.id)
    finally:
        db.close()


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _png_bytes(size=(80, 60), color=(200, 30, 30)) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, format="PNG")
    return buf.getvalue()


def _create_item(client, token, name, category, png=None):
    return client.post(
        "/api/wardrobe/items",
        data={"name": name, "category": category},
        files={"image": ("img.png", png or _png_bytes(), "image/png")},
        headers=_auth(token),
    )


def test_create_and_list_item(client):
    token = _token_for("crud@example.com")

    created = _create_item(client, token, "Rotes Kleid", "kleider")
    assert created.status_code == 201
    item = created.json()
    assert item["name"] == "Rotes Kleid"
    assert item["category"] == "kleider"
    assert item["image_url"].startswith("/uploads/")

    listing = client.get("/api/wardrobe/items", headers=_auth(token))
    assert listing.status_code == 200
    assert [i["id"] for i in listing.json()] == [item["id"]]


def test_update_and_delete_item(client):
    token = _token_for("crud2@example.com")
    headers = _auth(token)
    item_id = _create_item(client, token, "Hemd", "oberteile").json()["id"]

    patched = client.patch(
        f"/api/wardrobe/items/{item_id}",
        json={"name": "Blaues Hemd", "category": "unterteile"},
        headers=headers,
    )
    assert patched.status_code == 200
    assert patched.json()["name"] == "Blaues Hemd"
    assert patched.json()["category"] == "unterteile"

    deleted = client.delete(f"/api/wardrobe/items/{item_id}", headers=headers)
    assert deleted.status_code == 204

    listing = client.get("/api/wardrobe/items", headers=headers)
    assert listing.json() == []


def test_category_filter(client):
    token = _token_for("filter@example.com")
    headers = _auth(token)
    _create_item(client, token, "T-Shirt", "oberteile")
    _create_item(client, token, "Sneaker", "schuhe")

    resp = client.get("/api/wardrobe/items", params={"category": "oberteile"}, headers=headers)
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 1
    assert items[0]["category"] == "oberteile"


def test_isolation_between_users(client):
    token_a = _token_for("owner-a@example.com")
    token_b = _token_for("owner-b@example.com")
    _create_item(client, token_a, "A", "kleider")
    _create_item(client, token_b, "B", "schuhe")

    items_a = client.get("/api/wardrobe/items", headers=_auth(token_a)).json()
    items_b = client.get("/api/wardrobe/items", headers=_auth(token_b)).json()

    assert len(items_a) == 1
    assert len(items_b) == 1
    assert items_a[0]["id"] != items_b[0]["id"]


def test_foreign_item_id_returns_404(client):
    token_owner = _token_for("owner@example.com")
    token_other = _token_for("other@example.com")
    item_id = _create_item(client, token_owner, "Privat", "accessoires").json()["id"]

    assert (
        client.patch(
            f"/api/wardrobe/items/{item_id}", json={"name": "x"}, headers=_auth(token_other)
        ).status_code
        == 404
    )
    assert (
        client.delete(f"/api/wardrobe/items/{item_id}", headers=_auth(token_other)).status_code
        == 404
    )
    assert client.get("/api/wardrobe/items", headers=_auth(token_other)).json() == []


def test_oversized_image_returns_413(client):
    token = _token_for("big@example.com")
    big = b"x" * (5 * 1024 * 1024 + 1024)
    resp = client.post(
        "/api/wardrobe/items",
        data={"name": "Big", "category": "kleider"},
        files={"image": ("big.jpg", big, "image/jpeg")},
        headers=_auth(token),
    )
    assert resp.status_code == 413


def test_post_validation_errors(client):
    token = _token_for("val@example.com")
    headers = _auth(token)

    missing_name = client.post(
        "/api/wardrobe/items",
        data={"category": "kleider"},
        files={"image": ("a.png", _png_bytes(), "image/png")},
        headers=headers,
    )
    assert missing_name.status_code == 400

    invalid_category = client.post(
        "/api/wardrobe/items",
        data={"name": "X", "category": "hosen"},
        files={"image": ("a.png", _png_bytes(), "image/png")},
        headers=headers,
    )
    assert invalid_category.status_code == 400

    unsupported_type = client.post(
        "/api/wardrobe/items",
        data={"name": "X", "category": "kleider"},
        files={"image": ("a.gif", _png_bytes(), "image/gif")},
        headers=headers,
    )
    assert unsupported_type.status_code == 400

    missing_image = client.post(
        "/api/wardrobe/items",
        data={"name": "X", "category": "kleider"},
        headers=headers,
    )
    assert missing_image.status_code == 400


def test_unauthenticated_returns_401(client):
    assert client.get("/api/wardrobe/items").status_code == 401
    assert client.post("/api/wardrobe/items").status_code == 401


def test_unauthenticated_oversized_upload_returns_401(client):
    big = b"x" * (5 * 1024 * 1024 + 1024)
    resp = client.post(
        "/api/wardrobe/items",
        data={"name": "Big", "category": "kleider"},
        files={"image": ("big.jpg", big, "image/jpeg")},
    )
    assert resp.status_code == 401
