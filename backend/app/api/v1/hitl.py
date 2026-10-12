from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime
from app.database import get_db
from app.models.hitl import HITLApproval
from app.schemas.banking import HITLDecisionRequest

router = APIRouter()

@router.get("/hitl/tickets", tags=["Human-in-the-Loop (HITL)"])
async def get_hitl_tickets(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(HITLApproval).order_by(HITLApproval.created_at.desc())
    )
    tickets = result.scalars().all()
    return tickets

@router.post("/hitl/tickets/{ticket_id}/decision", tags=["Human-in-the-Loop (HITL)"])
async def review_hitl_ticket(
    ticket_id: str,
    req: HITLDecisionRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(HITLApproval).where(HITLApproval.id == ticket_id)
    )
    ticket = result.scalars().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="HITL ticket not found")

    ticket.status = "APPROVED" if req.decision.upper() == "APPROVE" else "REJECTED"
    ticket.reviewed_by = req.reviewed_by or "SUPERVISOR_OFFICER"
    ticket.reviewer_notes = req.reviewer_notes or "Human signoff processed."
    ticket.resolved_at = datetime.utcnow()

    await db.commit()
    await db.refresh(ticket)

    return {
        "success": True,
        "ticket_id": ticket.id,
        "status": ticket.status,
        "reviewed_by": ticket.reviewed_by,
        "resolved_at": ticket.resolved_at
    }
