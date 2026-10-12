import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import engine, Base, AsyncSessionLocal
from app.layers.l6_enterprise_data.repository import BankingRepository

@pytest.fixture(autouse=True, scope="function")
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as session:
        repo = BankingRepository(session)
        await repo.seed_synthetic_data_if_empty()
    yield

@pytest.mark.asyncio
async def test_system_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Health
        res = await ac.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "UP"
        assert "Wrench Wise" in data["product"]
        assert len(data["layers"]) == 9

        # 2. Status
        res = await ac.get("/api/system/status")
        assert res.status_code == 200
        assert res.json()["status"] == "ALL_9_LAYERS_OPERATIONAL"

        # 3. Metrics
        res = await ac.get("/api/system/metrics")
        assert res.status_code == 200
        assert "p50_latency_ms" in res.json()

@pytest.mark.asyncio
async def test_dashboard_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/dashboard/summary")
        assert res.status_code == 200
        data = res.json()
        assert data["total_customers"] >= 5
        assert data["total_transactions"] >= 100
        assert data["total_deposits"] > 0
        assert "channel_distribution" in data

        res2 = await ac.get("/api/dashboard/activity")
        assert res2.status_code == 200
        assert "recent_transactions" in res2.json()

@pytest.mark.asyncio
async def test_customers_and_accounts():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/customers")
        assert res.status_code == 200
        custs = res.json()
        assert len(custs) >= 5
        assert any(c["id"] == "CUST-8801" for c in custs)

        res2 = await ac.get("/api/customers/CUST-8801")
        assert res2.status_code == 200
        assert res2.json()["customer"]["full_name"] == "Aarav Patel"

        res3 = await ac.get("/api/customers/CUST-8801/accounts")
        assert res3.status_code == 200
        assert len(res3.json()) >= 2

        res4 = await ac.get("/api/accounts/ACC-1002341")
        assert res4.status_code == 200
        assert res4.json()["balance"] > 0

@pytest.mark.asyncio
async def test_transactions_and_simulation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/transactions?limit=10")
        assert res.status_code == 200
        assert res.json()["total"] >= 1
        assert len(res.json()["items"]) >= 1

        # Simulate Deposit
        res_dep = await ac.post("/api/transactions/simulate", json={
            "type": "DEPOSIT",
            "account_number": "ACC-1002341",
            "amount": 500.0,
            "channel": "WEB",
            "counterparty_name": "Test ACH Deposit"
        })
        assert res_dep.status_code == 200
        assert res_dep.json()["success"] is True

@pytest.mark.asyncio
async def test_multi_agent_chat():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/agents/chat", json={
            "message": "What is my checking balance and recent activity?",
            "channel": "WEB",
            "customer_id": "CUST-8801",
            "account_number": "ACC-1002341"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["intent"] == "ACCOUNT_INQUIRY"
        assert len(data["steps"]) >= 1

        # Check runs list
        res_runs = await ac.get("/api/agents/runs")
        assert res_runs.status_code == 200
        assert len(res_runs.json()) >= 1

@pytest.mark.asyncio
async def test_loans_assessment():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/loans/assess", json={
            "customer_id": "CUST-8801",
            "account_number": "ACC-1002341",
            "requested_amount": 15000.0,
            "tenure_months": 24,
            "monthly_income": 9500.0,
            "existing_debt": 500.0
        })
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "APPROVED"
        assert data["monthly_emi"] > 0

@pytest.mark.asyncio
async def test_tools_and_knowledge():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Tools
        res = await ac.get("/api/tools")
        assert res.status_code == 200
        assert res.json()["total_tools"] >= 7

        # Knowledge Search
        res_k = await ac.post("/api/knowledge/search", json={
            "query": "FATF wire transfer regulations",
            "top_k": 2
        })
        assert res_k.status_code == 200
        assert len(res_k.json()["results"]) >= 1

        # Audit Logs
        res_audit = await ac.get("/api/audit/logs")
        assert res_audit.status_code == 200
