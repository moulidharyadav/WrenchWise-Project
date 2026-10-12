from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from app.database import get_db
from app.layers.l6_enterprise_data.repository import BankingRepository
from app.layers.l2_gateway.gateway import APIGatewaySecurity
from app.schemas.banking import (
    DepositRequest,
    WithdrawRequest,
    TransferRequest,
    TransactionResponse,
    TransactionPaginatedResponse
)

router = APIRouter()

def _to_txn_response(t) -> TransactionResponse:
    return TransactionResponse(
        id=t.id,
        trace_id=t.trace_id,
        idempotency_key=t.idempotency_key,
        source_account=t.source_account,
        destination_account=t.destination_account,
        counterparty_name=t.counterparty_name,
        amount=t.amount,
        currency=t.currency,
        direction=t.direction,
        category=t.category,
        channel=t.channel,
        status=t.status,
        fraud_risk_score=t.fraud_risk_score,
        risk_level=t.risk_level,
        created_at=t.created_at,
        cleared_at=t.cleared_at,
        failure_reason=t.failure_reason
    )

# -----------------------------------------------------------------------------
# DEPOSITS (Double-Entry: ACC-SYS-CASH -> Account)
# -----------------------------------------------------------------------------
@router.post("/transactions/deposit", tags=["Transactions & Double-Entry Ledger"])
async def create_deposit(
    req: DepositRequest,
    x_idempotency_key: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    key = x_idempotency_key or req.idempotency_key
    repo = BankingRepository(db)

    # Layer 2 Gateway Inspection
    is_allowed, threat_msg, trace_id = APIGatewaySecurity.process_incoming_request(
        client_ip="127.0.0.1",
        path="/transactions/deposit",
        payload_str=f"{req.account_number} {req.amount}"
    )
    if not is_allowed:
        raise HTTPException(status_code=400, detail=threat_msg)

    success, msg, txn = await repo.post_deposit(
        account_number=req.account_number,
        amount=req.amount,
        narrative=req.narrative or "Branch Cash Deposit",
        trace_id=trace_id,
        channel=req.channel or "BRANCH",
        idempotency_key=key
    )

    if not success:
        raise HTTPException(status_code=400, detail=msg)

    return {
        "success": True,
        "message": msg,
        "transaction_id": txn.id,
        "trace_id": trace_id,
        "amount": txn.amount,
        "account_number": req.account_number,
        "status": txn.status
    }

# -----------------------------------------------------------------------------
# WITHDRAWALS (Double-Entry: Account -> ACC-SYS-CASH)
# -----------------------------------------------------------------------------
@router.post("/transactions/withdraw", tags=["Transactions & Double-Entry Ledger"])
async def create_withdrawal(
    req: WithdrawRequest,
    x_idempotency_key: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    key = x_idempotency_key or req.idempotency_key
    repo = BankingRepository(db)

    # Layer 2 Gateway Inspection
    is_allowed, threat_msg, trace_id = APIGatewaySecurity.process_incoming_request(
        client_ip="127.0.0.1",
        path="/transactions/withdraw",
        payload_str=f"{req.account_number} {req.amount}"
    )
    if not is_allowed:
        raise HTTPException(status_code=400, detail=threat_msg)

    success, msg, txn = await repo.post_withdrawal(
        account_number=req.account_number,
        amount=req.amount,
        narrative=req.narrative or "Counter Cash Withdrawal",
        trace_id=trace_id,
        channel=req.channel or "BRANCH",
        idempotency_key=key
    )

    if not success:
        raise HTTPException(status_code=400, detail=msg)

    return {
        "success": True,
        "message": msg,
        "transaction_id": txn.id,
        "trace_id": trace_id,
        "amount": txn.amount,
        "account_number": req.account_number,
        "status": txn.status
    }

# -----------------------------------------------------------------------------
# ACCOUNT-TO-ACCOUNT TRANSFERS
# -----------------------------------------------------------------------------
@router.post("/transactions/transfer", tags=["Transactions & Double-Entry Ledger"])
@router.post("/transfers", tags=["Transactions & Double-Entry Ledger"])
async def create_transfer(
    req: TransferRequest,
    x_idempotency_key: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    key = x_idempotency_key or req.idempotency_key
    repo = BankingRepository(db)

    # Layer 2 Security Processing
    is_allowed, threat_msg, trace_id = APIGatewaySecurity.process_incoming_request(
        client_ip="127.0.0.1",
        path="/transactions/transfer",
        payload_str=f"{req.source_account} {req.destination_account} {req.amount}"
    )
    if not is_allowed:
        raise HTTPException(status_code=400, detail=threat_msg)

    # Execute Double-Entry Posting
    success, msg, txn = await repo.post_double_entry_transfer(
        source_acc_num=req.source_account,
        dest_acc_num=req.destination_account,
        amount=req.amount,
        narrative=req.narrative or "Digital Banking Transfer",
        trace_id=trace_id,
        channel=req.channel or "WEB",
        idempotency_key=key
    )

    if not success:
        raise HTTPException(status_code=400, detail=msg)

    return {
        "success": True,
        "message": msg,
        "transaction_id": txn.id,
        "trace_id": trace_id,
        "amount": txn.amount,
        "source_account": req.source_account,
        "destination_account": req.destination_account,
        "status": txn.status
    }

# -----------------------------------------------------------------------------
# TRANSACTIONS LIST & SEARCH WITH PAGINATION
# -----------------------------------------------------------------------------
@router.get("/transactions", response_model=TransactionPaginatedResponse, tags=["Transactions & Double-Entry Ledger"])
async def get_transactions(
    account_number: Optional[str] = Query(None, description="Filter by account"),
    status: Optional[str] = Query(None, description="Filter by status (CLEARED, PENDING, REJECTED)"),
    category: Optional[str] = Query(None, description="Filter by category (TRANSFER, DEPOSIT, WITHDRAWAL)"),
    q: Optional[str] = Query(None, description="Search counterparty or account keyword"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    db: AsyncSession = Depends(get_db)
):
    repo = BankingRepository(db)
    total, items = await repo.get_transactions_filtered(
        account_number=account_number,
        status=status,
        category=category,
        q=q,
        page=page,
        page_size=page_size
    )

    return TransactionPaginatedResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[_to_txn_response(t) for t in items]
    )

# -----------------------------------------------------------------------------
# TRANSACTION DETAILS BY ID
# -----------------------------------------------------------------------------
@router.get("/transactions/{txn_id}", response_model=TransactionResponse, tags=["Transactions & Double-Entry Ledger"])
async def get_transaction_by_id(txn_id: str, db: AsyncSession = Depends(get_db)):
    repo = BankingRepository(db)
    txn = await repo.get_transaction_by_id(txn_id)
    if not txn:
        raise HTTPException(status_code=404, detail=f"Transaction {txn_id} not found.")
    return _to_txn_response(txn)
