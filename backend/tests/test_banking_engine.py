import pytest
import uuid
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
async def test_successful_deposit():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Initial balance
        acc_resp = await ac.get("/api/v1/accounts/ACC-1002341")
        assert acc_resp.status_code == 200
        initial_balance = acc_resp.json()["balance"]

        # Deposit $500
        dep_resp = await ac.post("/api/v1/transactions/deposit", json={
            "account_number": "ACC-1002341",
            "amount": 500.0,
            "narrative": "Branch Counter Cash Deposit"
        })
        assert dep_resp.status_code == 200
        dep_data = dep_resp.json()
        assert dep_data["success"] is True
        assert dep_data["amount"] == 500.0

        # Verify new balance
        acc_after = await ac.get("/api/v1/accounts/ACC-1002341")
        assert acc_after.json()["balance"] == round(initial_balance + 500.0, 2)

@pytest.mark.asyncio
async def test_successful_withdrawal():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        acc_resp = await ac.get("/api/v1/accounts/ACC-1002341")
        initial_balance = acc_resp.json()["balance"]

        # Withdraw $200
        wth_resp = await ac.post("/api/v1/transactions/withdraw", json={
            "account_number": "ACC-1002341",
            "amount": 200.0,
            "narrative": "ATM Cash Withdrawal"
        })
        assert wth_resp.status_code == 200
        assert wth_resp.json()["success"] is True

        acc_after = await ac.get("/api/v1/accounts/ACC-1002341")
        assert acc_after.json()["balance"] == round(initial_balance - 200.0, 2)

@pytest.mark.asyncio
async def test_insufficient_funds_rejection():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Account balance is ~48k, try to withdraw $999,999
        wth_resp = await ac.post("/api/v1/transactions/withdraw", json={
            "account_number": "ACC-1002341",
            "amount": 999999.0
        })
        assert wth_resp.status_code == 400
        assert "Insufficient funds" in wth_resp.json()["detail"]

        # Transfer insufficient funds
        trf_resp = await ac.post("/api/v1/transactions/transfer", json={
            "source_account": "ACC-1002341",
            "destination_account": "ACC-1002342",
            "amount": 888888.0
        })
        assert trf_resp.status_code == 400
        assert "Insufficient funds" in trf_resp.json()["detail"]

@pytest.mark.asyncio
async def test_invalid_account_handling():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/api/v1/transactions/transfer", json={
            "source_account": "ACC-DOES-NOT-EXIST",
            "destination_account": "ACC-1002342",
            "amount": 50.0
        })
        assert resp.status_code == 400
        assert "not found" in resp.json()["detail"]

@pytest.mark.asyncio
async def test_account_to_account_transfer():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        src_init = (await ac.get("/api/v1/accounts/ACC-1002341")).json()["balance"]
        dst_init = (await ac.get("/api/v1/accounts/ACC-1002342")).json()["balance"]

        transfer_amount = 750.25
        resp = await ac.post("/api/v1/transactions/transfer", json={
            "source_account": "ACC-1002341",
            "destination_account": "ACC-1002342",
            "amount": transfer_amount,
            "narrative": "Internal checking to savings rebalance"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True

        src_after = (await ac.get("/api/v1/accounts/ACC-1002341")).json()["balance"]
        dst_after = (await ac.get("/api/v1/accounts/ACC-1002342")).json()["balance"]

        assert round(src_after, 2) == round(src_init - transfer_amount, 2)
        assert round(dst_after, 2) == round(dst_init + transfer_amount, 2)

@pytest.mark.asyncio
async def test_idempotency_prevents_duplicate_transfer():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        idempotency_key = f"idemp-test-{uuid.uuid4().hex[:8]}"

        # First attempt should succeed
        resp1 = await ac.post("/api/v1/transactions/transfer", json={
            "source_account": "ACC-1002341",
            "destination_account": "ACC-1002342",
            "amount": 100.0,
            "idempotency_key": idempotency_key
        })
        assert resp1.status_code == 200

        # Immediate replay with same idempotency key must be rejected
        resp2 = await ac.post("/api/v1/transactions/transfer", json={
            "source_account": "ACC-1002341",
            "destination_account": "ACC-1002342",
            "amount": 100.0,
            "idempotency_key": idempotency_key
        })
        assert resp2.status_code == 400
        assert "Duplicate request" in resp2.json()["detail"]

@pytest.mark.asyncio
async def test_double_entry_balanced_legs():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/api/v1/ledger/entries?limit=10")
        assert resp.status_code == 200
        entries = resp.json()
        assert len(entries) > 0

        for entry in entries:
            assert entry["is_balanced"] is True
            legs = entry["legs"]
            assert len(legs) >= 2
            debit_sum = sum(l["amount"] for l in legs if l["direction"] == "DEBIT")
            credit_sum = sum(l["amount"] for l in legs if l["direction"] == "CREDIT")
            assert round(debit_sum, 2) == round(credit_sum, 2)

@pytest.mark.asyncio
async def test_reconciliation_audit():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/api/v1/ledger/reconcile")
        assert resp.status_code == 200
        report = resp.json()
        assert report["is_ledger_balanced"] is True
        assert report["discrepancies_found"] == 0
        assert report["status"] == "RECONCILED_CLEAN"
        assert round(report["total_system_debits"], 2) == round(report["total_system_credits"], 2)

@pytest.mark.asyncio
async def test_transaction_search_and_pagination():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/api/v1/transactions?page=1&page_size=5")
        assert resp.status_code == 200
        data = resp.json()
        assert "total" in data
        assert "items" in data
        assert data["page"] == 1
        assert data["page_size"] == 5

        # Filter by status
        resp_filtered = await ac.get("/api/v1/transactions?status=CLEARED")
        assert resp_filtered.status_code == 200
        assert all(t["status"] == "CLEARED" for t in resp_filtered.json()["items"])

@pytest.mark.asyncio
async def test_auth_and_rbac():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Login with seeded customer
        login_resp = await ac.post("/api/v1/auth/login", json={
            "username": "aarav_patel",
            "password": "Patel@2026!"
        })
        assert login_resp.status_code == 200
        token_data = login_resp.json()
        assert "access_token" in token_data
        token = token_data["access_token"]

        # Access /auth/me with bearer token
        me_resp = await ac.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_resp.status_code == 200
        me = me_resp.json()
        assert me["username"] == "aarav_patel"
        assert me["role"] == "CUSTOMER"

        # Unauthorized access without token
        bad_me = await ac.get("/api/v1/auth/me")
        assert bad_me.status_code == 401
