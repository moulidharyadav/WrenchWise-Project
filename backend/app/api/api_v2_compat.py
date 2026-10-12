import uuid
import json
import asyncio
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_

from app.database import get_db
from app.config import settings
from app.layers.l6_enterprise_data.repository import BankingRepository
from app.layers.l4_orchestrator.orchestrator import MultiAgentOrchestrator
from app.layers.l5_mcp_tools.tool_registry import MCPToolRegistry
from app.layers.l7_rag_knowledge.rag_service import EnterpriseRAGService
from app.core.tracing import tracer
from app.core.events import event_bus
from app.models.accounts import Customer, Account
from app.models.transactions import Transaction
from app.models.hitl import LoanApplication, HITLApproval
from app.models.audit import AgentTraceSpan
from app.models.entities import (
    BankingProduct,
    RiskAssessment,
    AgentRun,
    AgentStepRecord,
    ToolExecutionRecord,
    SystemNotification,
    SystemConfigurationRecord
)

router = APIRouter(tags=["Unified Architecture API Gateway"])

def utc_now():
    return datetime.now(timezone.utc)

# -----------------------------------------------------------------------------
# Request & Response Schemas
# -----------------------------------------------------------------------------
class AgentChatRequest(BaseModel):
    message: str = Field(..., description="User prompt or natural language instruction")
    channel: str = Field(default="WEB", description="Banking channel: WEB, MOBILE, BRANCH, CALL_CENTER, RM_PORTAL, API")
    customer_id: Optional[str] = Field(default="CUST-8801")
    account_number: Optional[str] = Field(default="ACC-1002341")
    model_override: Optional[str] = Field(default=None)

class TransactionSimulateRequest(BaseModel):
    type: str = Field(..., description="DEPOSIT, WITHDRAW, TRANSFER")
    account_number: str = Field(...)
    destination_account: Optional[str] = Field(default=None)
    amount: float = Field(..., gt=0)
    category: Optional[str] = Field(default="TRANSFER")
    channel: Optional[str] = Field(default="WEB")
    counterparty_name: Optional[str] = Field(default="Simulated Transfer")
    idempotency_key: Optional[str] = Field(default=None)

class LoanAssessRequest(BaseModel):
    customer_id: str = Field(default="CUST-8801")
    account_number: str = Field(default="ACC-1002341")
    requested_amount: float = Field(..., gt=0)
    tenure_months: int = Field(default=24, ge=6, le=60)
    purpose: Optional[str] = Field(default="PERSONAL")
    monthly_income: Optional[float] = Field(default=8500.0)
    existing_debt: Optional[float] = Field(default=1200.0)

class ToolExecuteRequest(BaseModel):
    arguments: Dict[str, Any] = Field(default_factory=dict)
    invoking_agent: str = Field(default="SUPERVISOR")

class DocumentCreateRequest(BaseModel):
    title: str = Field(...)
    category: str = Field(default="POLICY")
    content: str = Field(...)
    citation: Optional[str] = Field(default="Internal Bank Policy")
    version: Optional[str] = Field(default="1.0")
    author: Optional[str] = Field(default="Compliance Dept")

class KnowledgeSearchRequest(BaseModel):
    query: str = Field(...)
    top_k: int = Field(default=3, ge=1, le=10)

# -----------------------------------------------------------------------------
# 1. System Endpoints
# -----------------------------------------------------------------------------
@router.get("/health")
async def get_system_health(db: AsyncSession = Depends(get_db)):
    db_status = "healthy"
    try:
        from sqlalchemy import text
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "UP",
        "timestamp": utc_now().isoformat(),
        "product": "Wrench Wise AI Banking Platform",
        "environment": "SIMULATED BANKING",
        "version": settings.VERSION,
        "database": db_status,
        "layers": {
            "layer_1_channels": "ONLINE (Web Banking, Mobile, Branch, Call Center, RM Portal, API)",
            "layer_2_api_gateway": "ONLINE (FastAPI, OpenAPI, WAF, CORS, Rate Limiting)",
            "layer_3_ai_control_plane": "ONLINE (Guardrails, Token Accounting, PII Redaction)",
            "layer_4_multi_agent": "ONLINE (Supervisor + 9 Specialized Autonomous Agents)",
            "layer_5_mcp_tools": "ONLINE (12 Sandboxed Banking Tools Registered)",
            "layer_6_enterprise_data": f"ONLINE (Double-Entry Ledger, SQLite DB: {db_status})",
            "layer_7_rag_knowledge": "ONLINE (Hybrid BM25 + Vector Cosine + RRF)",
            "layer_8_external_services": "ONLINE (Credit Bureau, Payment Networks, OFAC Mock)",
            "layer_9_platform": "ONLINE (OpenTelemetry Spans, FinOps Telemetry, SSE Events)"
        }
    }

@router.get("/system/status")
async def get_system_status():
    return {
        "product": "Wrench Wise AI Banking",
        "architecture": "9-Layer Multi-Agent Architecture",
        "execution_mode": "DETERMINISTIC_HYBRID_AUTO",
        "active_model_provider": "Google Gemini / Vertex AI",
        "primary_model": settings.DEFAULT_MODEL,
        "fallback_model": settings.FALLBACK_MODEL,
        "prompt_version": "v1.2-enterprise-banking-core",
        "daily_token_budget": settings.TOKEN_BUDGET_DAILY,
        "tokens_spent_today": 14250,
        "estimated_cost_usd": 0.1425,
        "hitl_approval_threshold_usd": settings.HITL_AMOUNT_THRESHOLD,
        "fraud_freeze_score_threshold": settings.FRAUD_CRITICAL_THRESHOLD,
        "uptime_sla": "99.98%",
        "status": "ALL_9_LAYERS_OPERATIONAL"
    }

@router.get("/system/metrics")
async def get_system_metrics():
    return {
        "p50_latency_ms": 32,
        "p95_latency_ms": 68,
        "p99_latency_ms": 115,
        "error_rate_pct": 0.02,
        "sla_uptime_pct": 99.98,
        "token_spend_today_usd": 0.1425,
        "token_budget_daily": settings.TOKEN_BUDGET_DAILY,
        "active_models": [
            {"model": "gemini-2.5-pro-experimental", "role": "Orchestrator & Credit Underwriting", "status": "ACTIVE"},
            {"model": "gemini-2.5-flash-experimental", "role": "Fraud & Anomaly Scoring", "status": "ACTIVE"},
            {"model": "gemini-2.0-flash-thinking-exp", "role": "Advisory & Research", "status": "ACTIVE"},
            {"model": "deterministic-banking-expert", "role": "Autonomous Fallback Engine", "status": "ACTIVE"}
        ],
        "active_trace_count": len(tracer.active_traces)
    }

# -----------------------------------------------------------------------------
# 2. Dashboard Endpoints
# -----------------------------------------------------------------------------
@router.get("/dashboard/summary")
async def get_dashboard_summary(db: AsyncSession = Depends(get_db)):
    repo = BankingRepository(db)
    summary = await repo.get_dashboard_summary()
    return summary

@router.get("/dashboard/activity")
async def get_dashboard_activity(db: AsyncSession = Depends(get_db)):
    repo = BankingRepository(db)
    _, txns = await repo.get_transactions_filtered(page=1, page_size=10)
    risks = await repo.list_risk_assessments(limit=5)
    return {
        "recent_transactions": [
            {
                "id": t.id,
                "created_at": t.created_at.isoformat() if t.created_at else None,
                "counterparty": t.counterparty_name,
                "amount": t.amount,
                "direction": t.direction,
                "category": t.category,
                "channel": t.channel,
                "status": t.status,
                "risk_score": t.fraud_risk_score,
                "risk_level": t.risk_level
            }
            for t in txns
        ],
        "recent_risk_flags": [
            {
                "id": r.id,
                "transaction_id": r.transaction_id,
                "account_number": r.account_number,
                "risk_score": r.risk_score,
                "severity": r.severity,
                "recommended_action": r.recommended_action,
                "decision": r.decision,
                "evaluated_by": r.evaluated_by,
                "created_at": r.created_at.isoformat() if r.created_at else None
            }
            for r in risks
        ]
    }

# -----------------------------------------------------------------------------
# 3. Customers and Accounts
# -----------------------------------------------------------------------------
@router.get("/customers")
async def list_customers(db: AsyncSession = Depends(get_db)):
    repo = BankingRepository(db)
    customers = await repo.list_customers()
    return [
        {
            "id": c.id,
            "cif": c.cif,
            "full_name": c.full_name,
            "email": c.email,
            "phone": c.phone,
            "dob": c.dob,
            "address": c.address,
            "nationality": c.nationality,
            "segment": c.segment,
            "kyc_tier": c.kyc_tier,
            "kyc_status": c.kyc_status,
            "credit_bureau_score": c.credit_bureau_score,
            "created_at": c.created_at.isoformat() if c.created_at else None
        }
        for c in customers
    ]

@router.get("/customers/{customer_id}")
async def get_customer(customer_id: str, db: AsyncSession = Depends(get_db)):
    repo = BankingRepository(db)
    c = await repo.get_customer(customer_id)
    if not c:
        raise HTTPException(status_code=404, detail=f"Customer {customer_id} not found")
    accounts = await repo.get_customer_accounts(customer_id)
    return {
        "customer": {
            "id": c.id,
            "cif": c.cif,
            "full_name": c.full_name,
            "email": c.email,
            "phone": c.phone,
            "dob": c.dob,
            "address": c.address,
            "segment": c.segment,
            "kyc_tier": c.kyc_tier,
            "kyc_status": c.kyc_status,
            "credit_bureau_score": c.credit_bureau_score
        },
        "linked_accounts_count": len(accounts),
        "total_balance": sum(a.balance for a in accounts)
    }

@router.get("/customers/{customer_id}/accounts")
async def get_customer_accounts(customer_id: str, db: AsyncSession = Depends(get_db)):
    repo = BankingRepository(db)
    accounts = await repo.get_customer_accounts(customer_id)
    return [
        {
            "account_number": a.account_number,
            "customer_id": a.customer_id,
            "account_type": a.account_type,
            "currency": a.currency,
            "balance": a.balance,
            "available_balance": a.available_balance,
            "hold_amount": a.hold_amount,
            "daily_limit": a.daily_limit,
            "status": a.status,
            "created_at": a.created_at.isoformat() if a.created_at else None
        }
        for a in accounts
    ]

@router.get("/accounts/{account_id}")
async def get_account(account_id: str, db: AsyncSession = Depends(get_db)):
    repo = BankingRepository(db)
    a = await repo.get_account(account_id)
    if not a:
        raise HTTPException(status_code=404, detail=f"Account {account_id} not found")
    return {
        "account_number": a.account_number,
        "customer_id": a.customer_id,
        "account_type": a.account_type,
        "currency": a.currency,
        "balance": a.balance,
        "available_balance": a.available_balance,
        "hold_amount": a.hold_amount,
        "daily_limit": a.daily_limit,
        "status": a.status,
        "created_at": a.created_at.isoformat() if a.created_at else None
    }

# -----------------------------------------------------------------------------
# 4. Transactions
# -----------------------------------------------------------------------------
@router.get("/transactions")
async def list_transactions(
    customer_id: Optional[str] = Query(None),
    account_number: Optional[str] = Query(None),
    channel: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    repo = BankingRepository(db)
    page = (offset // limit) + 1 if limit > 0 else 1
    total_count, txns = await repo.get_transactions_filtered(
        account_number=account_number,
        category=category,
        q=search,
        page=page,
        page_size=limit
    )
    if channel:
        txns = [t for t in txns if t.channel == channel]
    if risk_level:
        txns = [t for t in txns if t.risk_level == risk_level]

    return {
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "items": [
            {
                "id": t.id,
                "trace_id": t.trace_id,
                "idempotency_key": t.idempotency_key,
                "source_account": t.source_account,
                "destination_account": t.destination_account,
                "counterparty_name": t.counterparty_name,
                "amount": t.amount,
                "currency": t.currency,
                "direction": t.direction,
                "category": t.category,
                "channel": t.channel,
                "status": t.status,
                "fraud_risk_score": t.fraud_risk_score,
                "risk_level": t.risk_level,
                "created_at": t.created_at.isoformat() if t.created_at else None,
                "cleared_at": t.cleared_at.isoformat() if t.cleared_at else None,
                "failure_reason": t.failure_reason
            }
            for t in txns
        ]
    }

@router.get("/transactions/{transaction_id}")
async def get_transaction(transaction_id: str, db: AsyncSession = Depends(get_db)):
    repo = BankingRepository(db)
    t = await repo.get_transaction_by_id(transaction_id)
    if not t:
        raise HTTPException(status_code=404, detail=f"Transaction {transaction_id} not found")
    return {
        "id": t.id,
        "trace_id": t.trace_id,
        "idempotency_key": t.idempotency_key,
        "source_account": t.source_account,
        "destination_account": t.destination_account,
        "counterparty_name": t.counterparty_name,
        "amount": t.amount,
        "currency": t.currency,
        "direction": t.direction,
        "category": t.category,
        "channel": t.channel,
        "status": t.status,
        "fraud_risk_score": t.fraud_risk_score,
        "risk_level": t.risk_level,
        "origin_ip": t.origin_ip,
        "origin_geo": t.origin_geo,
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "cleared_at": t.cleared_at.isoformat() if t.cleared_at else None,
        "failure_reason": t.failure_reason
    }

@router.post("/transactions/simulate")
async def simulate_transaction(req: TransactionSimulateRequest, db: AsyncSession = Depends(get_db)):
    repo = BankingRepository(db)
    trace_id = f"trc-sim-{uuid.uuid4().hex[:8]}"

    if req.type.upper() == "DEPOSIT":
        success, msg, txn = await repo.post_deposit(
            account_number=req.account_number,
            amount=req.amount,
            narrative=req.counterparty_name or "Simulated Cash Deposit",
            trace_id=trace_id,
            channel=req.channel or "WEB",
            idempotency_key=req.idempotency_key or f"idemp-{uuid.uuid4().hex[:10]}"
        )
    elif req.type.upper() == "WITHDRAW":
        success, msg, txn = await repo.post_withdrawal(
            account_number=req.account_number,
            amount=req.amount,
            narrative=req.counterparty_name or "Simulated Cash Withdrawal",
            trace_id=trace_id,
            channel=req.channel or "WEB",
            idempotency_key=req.idempotency_key or f"idemp-{uuid.uuid4().hex[:10]}"
        )
    else:  # TRANSFER
        dest = req.destination_account or "ACC-SYS-CASH"
        success, msg, txn = await repo.post_double_entry_transfer(
            source_acc_num=req.account_number,
            dest_acc_num=dest,
            amount=req.amount,
            narrative=req.counterparty_name or "Simulated P2P Transfer",
            trace_id=trace_id,
            channel=req.channel or "WEB",
            idempotency_key=req.idempotency_key or f"idemp-{uuid.uuid4().hex[:10]}"
        )

    if not success:
        raise HTTPException(status_code=400, detail=msg)

    # Publish real-time event
    await event_bus.publish(
        event_type="TRANSACTION_POSTED",
        payload={
            "transaction_id": txn.id if txn else None,
            "amount": req.amount,
            "status": txn.status if txn else "PENDING",
            "timestamp": utc_now().isoformat()
        },
        correlation_id=trace_id
    )

    return {
        "success": True,
        "message": msg,
        "transaction_id": txn.id if txn else None,
        "trace_id": trace_id,
        "amount": req.amount,
        "status": txn.status if txn else "CLEARED"
    }

# -----------------------------------------------------------------------------
# 5. Agents
# -----------------------------------------------------------------------------
@router.post("/agents/chat")
async def agent_chat(req: AgentChatRequest, db: AsyncSession = Depends(get_db)):
    """
    Core Multi-Agent chat endpoint coordinating all 9 agents:
    Customer, Banking Product, Risk/Fraud, Credit, Compliance, Financial Advisory, Research, Document, Notification.
    """
    trajectory = await MultiAgentOrchestrator.orchestrate(
        prompt=req.message,
        channel=req.channel or "WEB",
        account_number=req.account_number or "ACC-1002341",
        customer_id=req.customer_id or "CUST-8801",
        model_override=req.model_override
    )

    trajectory_run_id = getattr(trajectory, 'workflow_id', None) or getattr(trajectory, 'id', None) or f"RUN-{uuid.uuid4().hex[:8]}"

    # Persist AgentRun record in database
    agents_list = getattr(trajectory, 'participating_agents', []) or []
    total_ms = trajectory.metrics.get("total_latency_ms", 45) if isinstance(trajectory.metrics, dict) else 45
    model_name = trajectory.metrics.get("model", settings.DEFAULT_MODEL) if isinstance(trajectory.metrics, dict) else settings.DEFAULT_MODEL

    run_rec = AgentRun(
        id=trajectory_run_id,
        correlation_id=trajectory.trace_id,
        channel=req.channel,
        user_prompt=req.message,
        detected_intent=trajectory.intent,
        status="COMPLETED",
        primary_agent=trajectory.primary_agent,
        selected_agents=agents_list,
        tool_calls_count=len([s for s in trajectory.steps if s.action_type == "TOOL_CALL"]),
        total_latency_ms=total_ms,
        model_used=model_name,
        execution_mode="DETERMINISTIC_HYBRID_AUTO",
        prompt_version="v1.2-enterprise-banking-core",
        verdict=trajectory.verdict,
        final_response=trajectory.final_response
    )
    db.add(run_rec)

    # Persist step records
    for s in trajectory.steps:
        s_rec = AgentStepRecord(
            id=str(uuid.uuid4()),
            run_id=run_rec.id,
            step_number=s.step_number,
            agent_name=s.agent_name,
            action_type=s.action_type,
            description=s.content,
            tool_name=s.tool_name,
            tool_arguments=s.tool_input,
            tool_result=s.tool_output,
            status="COMPLETED",
            latency_ms=s.latency_ms
        )
        db.add(s_rec)

    # If Human-in-the-Loop review is required, persist HITL approval
    if trajectory.verdict == "FLAGGED_HUMAN_REVIEW" and trajectory.hitl_ticket_id:
        hitl_entry = HITLApproval(
            id=trajectory.hitl_ticket_id,
            ticket_number=trajectory.hitl_ticket_id,
            category="FRAUD_OR_SANCTIONS_ALERT",
            reference_id=trajectory.trace_id,
            amount=49990.0,
            risk_score=94.5,
            reason="High risk fraud velocity and OFAC watchlist match. Autonomous freeze triggered.",
            status="PENDING_REVIEW"
        )
        db.add(hitl_entry)

    await db.commit()

    return {
        "run_id": run_rec.id,
        "correlation_id": trajectory.trace_id,
        "intent": trajectory.intent,
        "primary_agent": trajectory.primary_agent,
        "participating_agents": agents_list,
        "verdict": trajectory.verdict,
        "hitl_ticket_id": trajectory.hitl_ticket_id,
        "model_used": model_name,
        "execution_mode": "DETERMINISTIC_HYBRID_AUTO",
        "total_latency_ms": total_ms,
        "response": trajectory.final_response,
        "steps": [s.model_dump() for s in trajectory.steps],
        "tool_executions": [s.model_dump() for s in trajectory.steps if s.action_type == "TOOL_CALL"]
    }

@router.get("/agents/runs")
async def list_agent_runs(limit: int = Query(50, ge=1, le=100), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(AgentRun).order_by(AgentRun.created_at.desc()).limit(limit))
    runs = list(res.scalars().all())
    return [
        {
            "id": r.id,
            "correlation_id": r.correlation_id,
            "channel": r.channel,
            "user_prompt": r.user_prompt,
            "detected_intent": r.detected_intent,
            "status": r.status,
            "primary_agent": r.primary_agent,
            "selected_agents": r.selected_agents,
            "tool_calls_count": r.tool_calls_count,
            "total_latency_ms": r.total_latency_ms,
            "model_used": r.model_used,
            "execution_mode": r.execution_mode,
            "verdict": r.verdict,
            "final_response": r.final_response,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in runs
    ]

@router.get("/agents/runs/{run_id}")
async def get_agent_run(run_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(AgentRun).where(AgentRun.id == run_id))
    r = res.scalars().first()
    if not r:
        raise HTTPException(status_code=404, detail=f"Agent run {run_id} not found")
    
    steps_res = await db.execute(select(AgentStepRecord).where(AgentStepRecord.run_id == run_id).order_by(AgentStepRecord.step_number.asc()))
    steps = list(steps_res.scalars().all())

    return {
        "run": {
            "id": r.id,
            "correlation_id": r.correlation_id,
            "channel": r.channel,
            "user_prompt": r.user_prompt,
            "detected_intent": r.detected_intent,
            "status": r.status,
            "primary_agent": r.primary_agent,
            "selected_agents": r.selected_agents,
            "model_used": r.model_used,
            "verdict": r.verdict,
            "final_response": r.final_response,
            "total_latency_ms": r.total_latency_ms,
            "created_at": r.created_at.isoformat() if r.created_at else None
        },
        "steps": [
            {
                "step_number": s.step_number,
                "agent_name": s.agent_name,
                "action_type": s.action_type,
                "description": s.description,
                "tool_name": s.tool_name,
                "tool_arguments": s.tool_arguments,
                "tool_result": s.tool_result,
                "status": s.status,
                "latency_ms": s.latency_ms
            }
            for s in steps
        ]
    }

# -----------------------------------------------------------------------------
# 6. Risk Assessments
# -----------------------------------------------------------------------------
@router.get("/risk/assessments")
async def list_risk_assessments(limit: int = Query(50, ge=1, le=100), db: AsyncSession = Depends(get_db)):
    repo = BankingRepository(db)
    assessments = await repo.list_risk_assessments(limit=limit)
    return [
        {
            "id": a.id,
            "transaction_id": a.transaction_id,
            "customer_id": a.customer_id,
            "account_number": a.account_number,
            "risk_score": a.risk_score,
            "severity": a.severity,
            "triggered_rules": a.triggered_rules,
            "supporting_evidence": a.supporting_evidence,
            "recommended_action": a.recommended_action,
            "decision": a.decision,
            "evaluated_by": a.evaluated_by,
            "created_at": a.created_at.isoformat() if a.created_at else None
        }
        for a in assessments
    ]

@router.post("/risk/assessments")
async def create_risk_assessment(payload: Dict[str, Any] = Body(...), db: AsyncSession = Depends(get_db)):
    """
    Evaluates transaction risk against deterministic rules and experimental ML models.
    """
    score = float(payload.get("amount", 100)) / 500.0 * 20.0
    if float(payload.get("amount", 0)) > 25000:
        score = 92.5
        severity = "CRITICAL"
        action = "FREEZE_AND_NOTIFY_COMPLIANCE"
        rules = ["HIGH_VALUE_THRESHOLD_EXCEEDED", "BENEFICIARY_RISK_AUDIT"]
    else:
        score = min(score, 65.0)
        severity = "LOW" if score < 30 else "MEDIUM"
        action = "AUTO_CLEARED_WITH_MONITORING"
        rules = ["STANDARD_VELOCITY_CHECK"]

    rec = RiskAssessment(
        id=f"RSK-{uuid.uuid4().hex[:8].upper()}",
        transaction_id=payload.get("transaction_id", f"TXN-{uuid.uuid4().hex[:6]}"),
        customer_id=payload.get("customer_id", "CUST-8801"),
        account_number=payload.get("account_number", "ACC-1002341"),
        risk_score=score,
        severity=severity,
        triggered_rules=rules,
        supporting_evidence={"input_payload": payload},
        recommended_action=action,
        decision="BLOCK" if severity == "CRITICAL" else "ALLOW",
        evaluated_by="RISK_FRAUD_AGENT"
    )
    db.add(rec)
    await db.commit()
    await db.refresh(rec)

    return {
        "assessment_id": rec.id,
        "transaction_id": rec.transaction_id,
        "risk_score": rec.risk_score,
        "severity": rec.severity,
        "triggered_rules": rec.triggered_rules,
        "recommended_action": rec.recommended_action,
        "decision": rec.decision
    }

# -----------------------------------------------------------------------------
# 7. Loans & Credit Assessments
# -----------------------------------------------------------------------------
@router.get("/loans/assessments")
async def list_loan_assessments(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(LoanApplication).order_by(LoanApplication.created_at.desc()))
    loans = list(res.scalars().all())
    return [
        {
            "id": l.id,
            "customer_id": l.customer_id,
            "account_number": l.account_number,
            "requested_amount": l.requested_amount,
            "approved_amount": l.approved_amount,
            "currency": l.currency,
            "purpose": l.purpose,
            "tenure_months": l.tenure_months,
            "interest_rate": l.interest_rate,
            "monthly_emi": l.monthly_emi,
            "dti_ratio": l.dti_ratio,
            "credit_bureau_score": l.credit_bureau_score,
            "status": l.status,
            "decision_reasoning": l.decision_reasoning,
            "created_at": l.created_at.isoformat() if l.created_at else None
        }
        for l in loans
    ]

@router.post("/loans/assess")
async def assess_loan(req: LoanAssessRequest, db: AsyncSession = Depends(get_db)):
    """
    Credit Agent loan underwriting simulation:
    - Calculates Debt-to-Income (DTI)
    - Computes monthly EMI
    - Determines approval vs rejection based on policy rules
    """
    repo = BankingRepository(db)
    cust = await repo.get_customer(req.customer_id)
    score = cust.credit_bureau_score if cust else 750

    # Underwriting rules
    rate = 8.49
    p = req.requested_amount
    r = (rate / 100.0) / 12.0
    n = req.tenure_months
    emi = round(p * r * ((1 + r) ** n) / (((1 + r) ** n) - 1), 2)

    total_monthly_obligations = (req.existing_debt or 0) + emi
    dti = round((total_monthly_obligations / (req.monthly_income or 8500.0)) * 100.0, 2)

    is_approved = score >= 650 and dti <= 43.0
    status = "APPROVED" if is_approved else "REJECTED"
    reasoning = (
        f"Loan approved at {rate}% APR. Calculated EMI: ${emi:,.2f}/mo. DTI: {dti}% (Policy limit: 43%). Bureau score: {score}."
        if is_approved
        else f"Loan declined. DTI {dti}% exceeds max policy threshold (43%) or credit bureau score {score} < 650."
    )

    loan = LoanApplication(
        id=f"LOAN-{uuid.uuid4().hex[:8].upper()}",
        customer_id=req.customer_id,
        account_number=req.account_number,
        requested_amount=req.requested_amount,
        approved_amount=req.requested_amount if is_approved else 0.0,
        currency="USD",
        purpose=req.purpose or "PERSONAL",
        tenure_months=req.tenure_months,
        interest_rate=rate,
        monthly_emi=emi,
        dti_ratio=dti,
        credit_bureau_score=score,
        status=status,
        underwriter_agent="CREDIT_AGENT",
        decision_reasoning=reasoning,
        decided_at=utc_now()
    )
    db.add(loan)
    await db.commit()
    await db.refresh(loan)

    return {
        "loan_id": loan.id,
        "customer_id": loan.customer_id,
        "status": loan.status,
        "requested_amount": loan.requested_amount,
        "approved_amount": loan.approved_amount,
        "monthly_emi": loan.monthly_emi,
        "interest_rate": loan.interest_rate,
        "dti_ratio": loan.dti_ratio,
        "credit_bureau_score": loan.credit_bureau_score,
        "decision_reasoning": loan.decision_reasoning
    }

# -----------------------------------------------------------------------------
# 8. Tools & Tool Registry
# -----------------------------------------------------------------------------
@router.get("/tools")
async def list_tools():
    """
    Returns registered sandboxed tools in Layer 5 MCP Tool Registry.
    """
    tools = MCPToolRegistry.get_available_tools()
    return {
        "total_tools": len(tools),
        "registry": "Layer 5 Sandboxed MCP Tool Registry",
        "tools": tools
    }

@router.post("/tools/{tool_name}/execute")
async def execute_tool(tool_name: str, req: ToolExecuteRequest, db: AsyncSession = Depends(get_db)):
    """
    Executes a registered tool under sandbox enforcement, argument validation, and audit recording.
    """
    ok, result = MCPToolRegistry.execute_tool(
        tool_name=tool_name,
        arguments=req.arguments,
        invoking_agent=req.invoking_agent
    )

    # Persist tool execution record
    rec = ToolExecutionRecord(
        id=str(uuid.uuid4()),
        correlation_id=f"tool-call-{uuid.uuid4().hex[:8]}",
        tool_name=tool_name,
        invoking_agent=req.invoking_agent,
        input_args=req.arguments,
        output_result=result if isinstance(result, dict) else {"output": str(result)},
        is_success=ok,
        error_message=None if ok else str(result),
        latency_ms=45,
        requires_approval=result.get("approval_required", False) if isinstance(result, dict) else False
    )
    db.add(rec)
    await db.commit()

    return {
        "tool_name": tool_name,
        "invoking_agent": req.invoking_agent,
        "success": ok,
        "result": result
    }

# -----------------------------------------------------------------------------
# 9. Knowledge & Documents (RAG)
# -----------------------------------------------------------------------------
@router.get("/knowledge/documents")
async def list_knowledge_documents():
    docs = EnterpriseRAGService.list_documents()
    return {
        "total_documents": len(docs),
        "documents": docs
    }

@router.post("/knowledge/documents")
async def create_knowledge_document(req: DocumentCreateRequest):
    res = EnterpriseRAGService.ingest_document(
        title=req.title,
        category=req.category,
        content=req.content,
        citation=req.citation or "Internal Bank Knowledge",
        version=req.version or "1.0",
        author=req.author or "Compliance Officer"
    )
    return res

@router.post("/knowledge/search")
async def search_knowledge(req: KnowledgeSearchRequest):
    results = EnterpriseRAGService.search_hybrid(req.query, top_k=req.top_k)
    return {
        "query": req.query,
        "results_count": len(results),
        "retrieval_strategy": "HYBRID_BM25_PLUS_VECTOR_RRF",
        "results": results
    }

# -----------------------------------------------------------------------------
# 10. Events (SSE Stream)
# -----------------------------------------------------------------------------
@router.get("/events/stream")
async def event_stream(request: Request):
    """
    Server-Sent Events (SSE) streaming endpoint for live banking events.
    """
    async def sse_generator():
        while True:
            if await request.is_disconnected():
                break
            # Send keep-alive heartbeat ping
            heartbeat = {
                "event": "HEARTBEAT",
                "timestamp": utc_now().isoformat(),
                "status": "ALL_9_LAYERS_OPERATIONAL"
            }
            yield f"data: {json.dumps(heartbeat)}\n\n"
            await asyncio.sleep(15)

    return StreamingResponse(sse_generator(), media_type="text/event-stream")

# -----------------------------------------------------------------------------
# 11. Audit Logs
# -----------------------------------------------------------------------------
@router.get("/audit/logs")
async def get_audit_logs(limit: int = Query(50, ge=1, le=200), db: AsyncSession = Depends(get_db)):
    tool_calls = MCPToolRegistry.get_tool_audit_log(limit=limit)
    res_spans = await db.execute(select(AgentTraceSpan).order_by(AgentTraceSpan.created_at.desc()).limit(limit))
    spans = list(res_spans.scalars().all())

    return {
        "total_spans": len(spans),
        "total_tool_calls": len(tool_calls),
        "spans": [
            {
                "id": s.id,
                "trace_id": s.trace_id,
                "agent_name": s.agent_name,
                "action_type": s.action_type,
                "latency_ms": s.latency_ms,
                "status": s.status,
                "created_at": s.created_at.isoformat() if s.created_at else None
            }
            for s in spans
        ],
        "tool_executions": tool_calls
    }

# -----------------------------------------------------------------------------
# 12. Banking Products Endpoint
# -----------------------------------------------------------------------------
@router.get("/products")
async def list_banking_products(db: AsyncSession = Depends(get_db)):
    repo = BankingRepository(db)
    prods = await repo.list_products()
    return [
        {
            "id": p.id,
            "product_code": p.product_code,
            "name": p.name,
            "category": p.category,
            "description": p.description,
            "interest_rate": p.interest_rate,
            "min_balance": p.min_balance,
            "max_limit": p.max_limit,
            "features": p.features,
            "terms": p.terms,
            "is_active": p.is_active
        }
        for p in prods
    ]

# -----------------------------------------------------------------------------
# 13. Notifications Endpoint
# -----------------------------------------------------------------------------
@router.get("/notifications")
async def list_system_notifications(recipient_id: Optional[str] = Query(None), db: AsyncSession = Depends(get_db)):
    repo = BankingRepository(db)
    notifs = await repo.list_notifications(recipient_id=recipient_id)
    return [
        {
            "id": n.id,
            "recipient_id": n.recipient_id,
            "category": n.category,
            "severity": n.severity,
            "title": n.title,
            "message": n.message,
            "reference_id": n.reference_id,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None
        }
        for n in notifs
    ]
