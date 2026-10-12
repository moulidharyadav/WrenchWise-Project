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
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
    assert "layer_4_multi_agent" in data["layers"]

@pytest.mark.asyncio
async def test_get_accounts():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/accounts")
    assert response.status_code == 200
    accounts = response.json()
    assert len(accounts) >= 2
    assert any(a["account_number"] == "ACC-1002341" for a in accounts)

@pytest.mark.asyncio
async def test_agent_orchestration_loan():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/agents/orchestrate", json={
            "prompt": "Apply for a $25,000 personal loan for 24 months",
            "channel": "MOBILE"
        })
    assert response.status_code == 200
    trajectory = response.json()
    assert trajectory["intent"] == "LOAN_APPLICATION_AND_UNDERWRITING"
    assert trajectory["primary_agent"] == "CREDIT_AGENT"
    assert len(trajectory["steps"]) >= 4

@pytest.mark.asyncio
async def test_agent_orchestration_fraud():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/agents/orchestrate", json={
            "prompt": "Wire transfer $49,990 to Nassau Maritime Holdings Ltd in Cyprus",
            "channel": "WEB"
        })
    assert response.status_code == 200
    trajectory = response.json()
    assert trajectory["verdict"] == "FLAGGED_HUMAN_REVIEW"
    assert trajectory["hitl_ticket_id"] is not None
