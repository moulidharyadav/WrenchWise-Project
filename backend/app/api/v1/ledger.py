from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any, Optional
from app.database import get_db
from app.layers.l6_enterprise_data.repository import BankingRepository
from app.core.events import event_bus
from app.schemas.banking import (
    JournalEntryResponse,
    JournalLegResponse,
    ReconciliationReportResponse
)

router = APIRouter()

@router.get("/ledger/entries", response_model=List[JournalEntryResponse], tags=["Transactions & Double-Entry Ledger"])
async def get_ledger_journal_entries(
    limit: int = Query(50, ge=1, le=200, description="Max entries to return"),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns full double-entry general ledger journal entries complete with balanced DEBIT and CREDIT legs.
    """
    repo = BankingRepository(db)
    raw_entries = await repo.get_journal_entries_with_legs(limit=limit)

    output = []
    for item in raw_entries:
        e = item["entry"]
        legs = item["legs"]
        output.append(JournalEntryResponse(
            id=e.id,
            reference_number=e.reference_number,
            transaction_id=e.transaction_id,
            narrative=e.narrative,
            total_amount=e.total_amount,
            currency=e.currency,
            posted_at=e.posted_at,
            is_balanced=e.is_balanced,
            reconciled=e.reconciled,
            legs=[
                JournalLegResponse(
                    id=l.id,
                    journal_entry_id=l.journal_entry_id,
                    account_number=l.account_number,
                    direction=l.direction,
                    amount=l.amount,
                    currency=l.currency,
                    running_balance_after=l.running_balance_after
                )
                for l in legs
            ]
        ))
    return output

@router.post("/ledger/reconcile", response_model=ReconciliationReportResponse, tags=["Transactions & Double-Entry Ledger"])
async def trigger_reconciliation_audit(db: AsyncSession = Depends(get_db)):
    """
    Executes real-time mathematical reconciliation audit:
    1. Verifies system-wide: sum(DEBIT legs) == sum(CREDIT legs).
    2. Verifies account-level: stored Account balance == net sum of Journal legs.
    Publishes an audit event to the event bus.
    """
    repo = BankingRepository(db)
    report = await repo.reconcile_double_entry_ledger()

    # Publish audit event
    await event_bus.publish("ledger.reconciled", {
        "is_balanced": report["is_ledger_balanced"],
        "discrepancies": report["discrepancies_found"],
        "status": report["status"]
    }, correlation_id=f"audit-{report['reconciliation_timestamp']}")

    return ReconciliationReportResponse(**report)

@router.get("/ledger/reconcile/latest", response_model=ReconciliationReportResponse, tags=["Transactions & Double-Entry Ledger"])
async def get_latest_reconciliation(db: AsyncSession = Depends(get_db)):
    repo = BankingRepository(db)
    report = await repo.reconcile_double_entry_ledger()
    return ReconciliationReportResponse(**report)

@router.get("/ledger/events", tags=["Transactions & Double-Entry Ledger"])
async def get_event_bus_stream(limit: int = Query(50, ge=1, le=100)):
    """
    Retrieves recent event-driven background events, including correlation IDs, retry counts, and payloads.
    """
    return {
        "total_buffered": len(event_bus.event_log),
        "events": event_bus.get_event_history(limit=limit)
    }

@router.get("/ledger/dlq", tags=["Transactions & Double-Entry Ledger"])
async def get_dead_letter_queue():
    """
    Returns events that exhausted maximum retries and were routed to the Dead-Letter Queue (DLQ).
    """
    return {
        "dlq_count": len(event_bus.dead_letter_queue),
        "dlq_events": event_bus.get_dlq_events()
    }
