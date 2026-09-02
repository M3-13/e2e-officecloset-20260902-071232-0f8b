"""Tests for the outfit routes.

Each test provisions its own user and clothing items directly in the database,
then exercises the routes with a freshly signed JWT for that user.
"""

import pytest
from fastapi.testclient import TestClient

from app.core.database import SessionLocal
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models import ClothingItem, User


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def _create_user(email: str) -> int:
    with SessionLocal() as db:
        user = User(email=email, hashed_password=hash_password("password123"))
        db.add(user)
        db.commit()
        db.refresh(user)
        return user.id


def _create_item(user_id: int, name: str, category: str = "oberteile") -> int:
    with SessionLocal() as db:
        item = ClothingItem(
            user_id=user_id,
            name=name,
            category=category,
            image_path=f"{name}.jpg",
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item.id


def _auth(user_id: int) -> dict:
    return {"Authorization": f"Bearer {create_access_token(user_id)}"}


def test_create_outfit(client: TestClient) -> None:
    user_id = _create_user("create@example.com")
    item_ids = [_create_item(user_id, "Shirt"), _create_item(user_id, "Hose", "unterteile")]

    response = client.post(
        "/api/outfits",
        json={"name": "Alltag", "item_ids": item_ids},
        headers=_auth(user_id),
    )

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Alltag"
    assert {i["id"] for i in body["items"]} == set(item_ids)


def test_list_outfits(client: TestClient) -> None:
    user_id = _create_user("list@example.com")
    item_id = _create_item(user_id, "Kleid", "kleider")

    created = client.post(
        "/api/outfits",
        json={"name": "Rot", "item_ids": [item_id]},
        headers=_auth(user_id),
    ).json()

    response = client.get("/api/outfits", headers=_auth(user_id))

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["id"] == created["id"]
    assert [i["id"] for i in body[0]["items"]] == [item_id]


def test_get_outfit(client: TestClient) -> None:
    user_id = _create_user("get@example.com")
    item_id = _create_item(user_id, "Schuhe", "schuhe")
    created = client.post(
        "/api/outfits",
        json={"name": "Gala", "item_ids": [item_id]},
        headers=_auth(user_id),
    ).json()

    response = client.get(f"/api/outfits/{created['id']}", headers=_auth(user_id))

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == created["id"]
    assert [i["id"] for i in body["items"]] == [item_id]


def test_update_outfit_recombines(client: TestClient) -> None:
    user_id = _create_user("update@example.com")
    item_a = _create_item(user_id, "Alt")
    item_b = _create_item(user_id, "Neu")
    created = client.post(
        "/api/outfits",
        json={"name": "Vorher", "item_ids": [item_a]},
        headers=_auth(user_id),
    ).json()

    response = client.patch(
        f"/api/outfits/{created['id']}",
        json={"name": "Nachher", "item_ids": [item_b]},
        headers=_auth(user_id),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Nachher"
    assert [i["id"] for i in body["items"]] == [item_b]


def test_delete_outfit(client: TestClient) -> None:
    user_id = _create_user("delete@example.com")
    item_id = _create_item(user_id, "Jacke")
    created = client.post(
        "/api/outfits",
        json={"name": "Weg", "item_ids": [item_id]},
        headers=_auth(user_id),
    ).json()

    response = client.delete(f"/api/outfits/{created['id']}", headers=_auth(user_id))

    assert response.status_code == 204
    assert client.get(f"/api/outfits/{created['id']}", headers=_auth(user_id)).status_code == 404


def test_isolation_between_two_users(client: TestClient) -> None:
    user_a = _create_user("iso-a@example.com")
    user_b = _create_user("iso-b@example.com")
    item_a = _create_item(user_a, "Von A")
    _create_item(user_b, "Von B")

    outfit_a = client.post(
        "/api/outfits",
        json={"name": "A's Outfit", "item_ids": [item_a]},
        headers=_auth(user_a),
    ).json()

    # B cannot open A's outfit.
    assert client.get(f"/api/outfits/{outfit_a['id']}", headers=_auth(user_b)).status_code == 404
    # A does not see any of B's data; A's list only contains A's own outfit.
    list_a = client.get("/api/outfits", headers=_auth(user_a)).json()
    assert [o["id"] for o in list_a] == [outfit_a["id"]]


def test_foreign_outfit_id_returns_404(client: TestClient) -> None:
    user_a = _create_user("foreign-a@example.com")
    user_b = _create_user("foreign-b@example.com")
    item_b = _create_item(user_b, "B's Item")
    outfit_b = client.post(
        "/api/outfits",
        json={"name": "B's Outfit", "item_ids": [item_b]},
        headers=_auth(user_b),
    ).json()

    assert client.get(f"/api/outfits/{outfit_b['id']}", headers=_auth(user_a)).status_code == 404
    assert (
        client.patch(
            f"/api/outfits/{outfit_b['id']}",
            json={"name": "Hijack", "item_ids": [item_b]},
            headers=_auth(user_a),
        ).status_code
        == 404
    )
    assert client.delete(f"/api/outfits/{outfit_b['id']}", headers=_auth(user_a)).status_code == 404


def test_nonexistent_outfit_id_returns_404(client: TestClient) -> None:
    user_id = _create_user("missing@example.com")

    assert client.get("/api/outfits/999999", headers=_auth(user_id)).status_code == 404


def test_foreign_item_id_returns_400(client: TestClient) -> None:
    user_a = _create_user("item-a@example.com")
    user_b = _create_user("item-b@example.com")
    item_b = _create_item(user_b, "B's Item")

    response = client.post(
        "/api/outfits",
        json={"name": "Betrug", "item_ids": [item_b]},
        headers=_auth(user_a),
    )

    assert response.status_code == 400


def test_missing_item_id_returns_400(client: TestClient) -> None:
    user_id = _create_user("noitem@example.com")

    response = client.post(
        "/api/outfits",
        json={"name": "Geist", "item_ids": [999999]},
        headers=_auth(user_id),
    )

    assert response.status_code == 400


def test_unauthenticated_returns_401(client: TestClient) -> None:
    assert client.get("/api/outfits").status_code == 401
    assert client.post("/api/outfits", json={"name": "x", "item_ids": []}).status_code == 401
    assert client.get("/api/outfits/1").status_code == 401
    assert client.patch("/api/outfits/1", json={"name": "x", "item_ids": []}).status_code == 401
    assert client.delete("/api/outfits/1").status_code == 401
