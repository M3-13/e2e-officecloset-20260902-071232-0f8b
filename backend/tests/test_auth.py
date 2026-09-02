"""Tests for the auth routes (register and login)."""

from fastapi.testclient import TestClient

from app.main import app


def test_register_returns_201_with_id_and_email():
    with TestClient(app) as client:
        response = client.post(
            "/api/auth/register",
            json={"email": "new@example.com", "password": "secret123"},
        )

    assert response.status_code == 201
    body = response.json()
    assert body["id"] is not None
    assert body["email"] == "new@example.com"


def test_register_duplicate_returns_409():
    with TestClient(app) as client:
        payload = {"email": "dup@example.com", "password": "secret123"}
        first = client.post("/api/auth/register", json=payload)
        second = client.post("/api/auth/register", json=payload)

    assert first.status_code == 201
    assert second.status_code == 409
    assert "detail" in second.json()


def test_login_returns_200_with_access_token():
    with TestClient(app) as client:
        client.post(
            "/api/auth/register",
            json={"email": "login@example.com", "password": "secret123"},
        )
        response = client.post(
            "/api/auth/login",
            json={"email": "login@example.com", "password": "secret123"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["access_token"]
    assert body["token_type"] == "bearer"


def test_login_wrong_password_returns_401():
    with TestClient(app) as client:
        client.post(
            "/api/auth/register",
            json={"email": "badpw@example.com", "password": "secret123"},
        )
        response = client.post(
            "/api/auth/login",
            json={"email": "badpw@example.com", "password": "wrong"},
        )

    assert response.status_code == 401
    assert "detail" in response.json()
