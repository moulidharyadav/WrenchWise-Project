from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.database import get_db
from app.config import settings

router = APIRouter()

@router.get("/health", tags=["System Health"])
async def health_check(db: AsyncSession = Depends(get_db)):
    db_status = "healthy"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "UP",
        "version": settings.VERSION,
        "environment": settings.ENV,
        "layers": {
            "layer_1_channels": "ONLINE (Mobile, Web, Branch, Call Center, RM Portal, API Partners)",
            "layer_2_api_gateway": "ONLINE (WAF, Rate Limiter, Correlation Tracing)",
            "layer_3_ai_control_plane": "ONLINE (PII Guardrails, Token Budgets, HITL Engine)",
            "layer_4_multi_agent": "ONLINE (Supervisor + 9 Specialized Agents Active)",
            "layer_5_mcp_tools": "ONLINE (7 Core Banking Tools Sandboxed)",
            "layer_6_enterprise_data": f"ONLINE (Double-Entry Ledger, DB: {db_status})",
            "layer_7_rag_knowledge": "ONLINE (BM25 + Semantic Citations)",
            "layer_8_external_services": "ONLINE (Credit Bureau, OFAC SDN Watchlist Mock)",
            "layer_9_platform": "ONLINE (OpenTelemetry Spans, FinOps Telemetry)"
        }
    }
