from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any, Optional
from app.database import get_db
from app.layers.l4_orchestrator.orchestrator import MultiAgentOrchestrator
from app.layers.l4_orchestrator.supervisor import SupervisorOrchestrator
from app.layers.l5_mcp_tools.tool_registry import MCPToolRegistry
from app.models.hitl import HITLApproval
from app.schemas.agents import AgentPromptRequest, AgentTrajectoryResponse, AgentCatalogItem

router = APIRouter()

@router.get("/agents/catalog", response_model=List[AgentCatalogItem], tags=["Multi-Agent System"])
async def get_agent_catalog():
    return MultiAgentOrchestrator.get_agent_catalog()

@router.post("/agents/orchestrate", response_model=AgentTrajectoryResponse, tags=["Multi-Agent System"])
async def run_orchestration(req: AgentPromptRequest, db: AsyncSession = Depends(get_db)):
    trajectory = await MultiAgentOrchestrator.orchestrate(
        prompt=req.prompt,
        channel=req.channel or "WEB",
        account_number=req.account_number or "ACC-1002341",
        customer_id=req.customer_id or "CUST-8801",
        model_override=req.model_override
    )

    # If Human-In-The-Loop review is required, persist HITL approval ticket to database
    if trajectory.verdict == "FLAGGED_HUMAN_REVIEW" and trajectory.hitl_ticket_id:
        hitl_entry = HITLApproval(
            id=trajectory.hitl_ticket_id,
            ticket_number=trajectory.hitl_ticket_id,
            category="FRAUD_OR_SANCTIONS_ALERT",
            reference_id=trajectory.trace_id,
            amount=49990.0,
            risk_score=99.0,
            reason="High risk fraud velocity and OFAC watchlist match. Autonomous freeze triggered.",
            status="PENDING_REVIEW"
        )
        db.add(hitl_entry)
        await db.commit()

    return trajectory

@router.get("/agents/scenarios", tags=["Multi-Agent System"])
async def get_demonstration_scenarios():
    """
    Returns the 7 demonstration scenarios with pre-configured prompts and expected agents.
    """
    return [
        {
            "id": "scenario_account_inquiry",
            "title": "Account Inquiry",
            "prompt": "What is my current checking account balance and recent transactions?",
            "expected_intent": "ACCOUNT_INQUIRY",
            "participating_agents": ["CUSTOMER_AGENT"],
            "description": "Queries authorized customer profile and Core Banking ledger without invoking unauthorized tools."
        },
        {
            "id": "scenario_product_request",
            "title": "Product Information Request",
            "prompt": "Show me high-yield savings accounts and certificate of deposit interest rates.",
            "expected_intent": "PRODUCT_INFORMATION_REQUEST",
            "participating_agents": ["BANKING_PRODUCT_AGENT", "RESEARCH_AGENT"],
            "description": "Searches product catalog and benchmarks published APYs."
        },
        {
            "id": "scenario_loan_simulation",
            "title": "Loan Eligibility Simulation",
            "prompt": "Apply for a $25,000 personal loan for 24 months",
            "expected_intent": "LOAN_APPLICATION_AND_UNDERWRITING",
            "participating_agents": ["CUSTOMER_AGENT", "BANKING_PRODUCT_AGENT", "CREDIT_AGENT", "COMPLIANCE_AGENT"],
            "description": "Multi-agent underwriting: queries credit bureau score, verifies DTI ratios, and computes EMI schedule."
        },
        {
            "id": "scenario_suspicious_transfer",
            "title": "Suspicious Transaction Investigation",
            "prompt": "Wire transfer $49,990 to Nassau Maritime Holdings Ltd in Cyprus",
            "expected_intent": "SUSPICIOUS_TRANSACTION_INVESTIGATION",
            "participating_agents": ["CUSTOMER_AGENT", "RISK_FRAUD_AGENT", "COMPLIANCE_AGENT", "NOTIFICATION_AGENT"],
            "description": "Anomaly detection: impossible travel velocity anomaly triggers OFAC hit and HITL freeze ticket."
        },
        {
            "id": "scenario_compliance_policy",
            "title": "Compliance Policy Question",
            "prompt": "What are our FATF Recommendation 16 and AML wire transfer reporting requirements?",
            "expected_intent": "COMPLIANCE_POLICY_QUESTION",
            "participating_agents": ["COMPLIANCE_AGENT", "RESEARCH_AGENT"],
            "description": "Retrieves statutory compliance policies and Basel III / FATF citations via BM25 RAG."
        },
        {
            "id": "scenario_document_summary",
            "title": "Document Summarization",
            "prompt": "Ingest and summarize the employee W2 payslip: Employer TechGlobal Inc, Monthly Gross $8,500 USD, Tax Withheld $1,820 USD.",
            "expected_intent": "DOCUMENT_SUMMARIZATION",
            "participating_agents": ["DOCUMENT_AGENT"],
            "description": "Extracts structured financial fields and verifies document authenticity."
        },
        {
            "id": "scenario_notification_alert",
            "title": "Notification Generation",
            "prompt": "Send urgent security alert: unauthorized login attempt detected from unrecognized IP.",
            "expected_intent": "NOTIFICATION_GENERATION",
            "participating_agents": ["NOTIFICATION_AGENT"],
            "description": "Dispatches security notifications across SMS, Push Notification, and Email with delivery receipts."
        }
    ]

@router.post("/agents/cancel/{workflow_id}", tags=["Multi-Agent System"])
async def cancel_agent_workflow(workflow_id: str):
    """
    Cancels an active multi-agent workflow.
    """
    success = SupervisorOrchestrator.cancel_workflow(workflow_id)
    return {"workflow_id": workflow_id, "cancelled": success}

@router.get("/agents/tools", tags=["Multi-Agent System"])
async def list_registered_tools():
    """
    Lists all sandboxed tools registered in the Layer 5 MCP Tool Registry along with authorized agent mappings.
    """
    return MCPToolRegistry.get_available_tools()

@router.get("/agents/tool-calls", tags=["Multi-Agent System"])
async def list_tool_audit_calls(limit: int = Query(50, ge=1, le=200)):
    """
    Returns audit log of all tool executions, verifying least privilege and schema validation.
    """
    return MCPToolRegistry.get_tool_audit_log(limit=limit)
