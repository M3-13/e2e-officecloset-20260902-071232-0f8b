from fastapi.testclient import TestClient

from app.main import app
from app.routers import auth, outfits, wardrobe


def test_health_returns_ok() -> None:
    with TestClient(app) as client:
        response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_routers_are_registered() -> None:
    assert auth.router.prefix == "/api/auth"
    assert wardrobe.router.prefix == "/api/wardrobe"
    assert outfits.router.prefix == "/api/outfits"
