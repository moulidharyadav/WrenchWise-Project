import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import engine, Base, AsyncSessionLocal
from app.layers.l6_enterprise_data.repository import BankingRepository

@pytest.fixture(autouse=True, scope="function")
async def init_test_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as session:
        repo = BankingRepository(session)
        await repo.seed_synthetic_data_if_empty()
    yield

@pytest.mark.asyncio
async def test_auth_login_successful():
    """Test valid credentials authenticate successfully and return JWT."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/auth/login", json={
            "username": "aarav_patel",
            "password": "Patel@2026!"
        })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "aarav_patel"
    assert data["user"]["role"] == "CUSTOMER"

@pytest.mark.asyncio
async def test_auth_login_invalid_credentials():
    """Test invalid credentials are strictly rejected with 401."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/auth/login", json={
            "username": "aarav_patel",
            "password": "WrongPassword123!"
        })
    assert res.status_code == 401
    assert "Invalid username or password" in res.json()["detail"]

@pytest.mark.asyncio
async def test_auth_me_protected_route():
    """Test /api/auth/me rejects unauthenticated request and accepts valid token."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Unauthenticated check
        unauth_res = await ac.get("/api/auth/me")
        assert unauth_res.status_code == 401

        # Authenticate first
        login_res = await ac.post("/api/auth/login", json={
            "username": "admin_operator",
            "password": "Admin@2026!"
        })
        token = login_res.json()["access_token"]

        # Authenticated check
        me_res = await ac.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert me_res.status_code == 200
        assert me_res.json()["username"] == "admin_operator"
        assert me_res.json()["role"] == "ADMIN"

@pytest.mark.asyncio
async def test_auth_logout_revocation():
    """Test logout revokes the token so subsequent /api/auth/me requests fail."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_res = await ac.post("/api/auth/login", json={
            "username": "compliance_officer",
            "password": "Compliance@2026!"
        })
        token = login_res.json()["access_token"]

        # Verify active
        me_res = await ac.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_res.status_code == 200

        # Logout
        logout_res = await ac.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
        assert logout_res.status_code == 200
        assert logout_res.json()["status"] == "SUCCESS"

        # Verify revoked
        me_after_res = await ac.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_after_res.status_code == 401

@pytest.mark.asyncio
async def test_test_accounts_endpoint():
    """Verify test-accounts helper endpoint lists simulated banking roles."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/auth/test-accounts")
        assert res.status_code == 200
        data = res.json()
        assert data["environment"] == "SIMULATED_BANKING_DEVELOPMENT"
        assert len(data["accounts"]) >= 3
