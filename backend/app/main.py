from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, AsyncSessionLocal
from app.layers.l6_enterprise_data.repository import BankingRepository
from app.core.events import event_bus
from app.api.websockets import manager

# Routers
from app.api.v1.auth import router as auth_router
from app.api.v1.health import router as health_router
from app.api.v1.accounts import router as accounts_router
from app.api.v1.transactions import router as transactions_router
from app.api.v1.ledger import router as ledger_router
from app.api.v1.agents import router as agents_router
from app.api.v1.hitl import router as hitl_router
from app.api.v1.rag import router as rag_router
from app.api.v1.telemetry import router as telemetry_router
from app.api.v1.mcp import router as mcp_router
from app.api.v1.models import router as models_router
from app.api.v1.external_services import router as external_services_router
from app.api.websockets import router as ws_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Wire EventBus WebSocket live broadcaster
    event_bus.set_websocket_broadcaster(manager.broadcast)

    # 2. Startup: Create tables in SQLite / PostgreSQL
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # 3. Seed initial synthetic banking data
    async with AsyncSessionLocal() as session:
        repo = BankingRepository(session)
        await repo.seed_synthetic_data_if_empty()
        
    print(f"[{settings.PROJECT_NAME}] Initialized. Database tables, EventBus broadcaster, users, and synthetic enterprise data ready.")
    yield
    # Shutdown
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise Simulated Real-Time Banking Platform with 9-Layer Multi-Agent Architecture",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.api_v2_compat import router as unified_api_router

# Core & Layer Routers (Mount at both /api and /api/v1 for 100% interoperability)
for pfx in ["/api", settings.API_V1_STR]:
    app.include_router(auth_router, prefix=pfx)
    app.include_router(health_router, prefix=pfx)
    app.include_router(accounts_router, prefix=pfx)
    app.include_router(transactions_router, prefix=pfx)
    app.include_router(ledger_router, prefix=pfx)
    app.include_router(agents_router, prefix=pfx)
    app.include_router(hitl_router, prefix=pfx)
    app.include_router(rag_router, prefix=pfx)
    app.include_router(telemetry_router, prefix=pfx)
    app.include_router(mcp_router, prefix=pfx)
    app.include_router(models_router, prefix=pfx)
    app.include_router(external_services_router, prefix=pfx)

# Unified Architecture API Router (All standard /api/... endpoints specified in prompt)
app.include_router(unified_api_router, prefix="/api")
app.include_router(unified_api_router, prefix=settings.API_V1_STR)

app.include_router(ws_router)

@app.get("/")
async def root():
    return {
        "system": settings.PROJECT_NAME,
        "status": "OPERATIONAL",
        "api_docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }

@app.get("/health")
async def health_convenience():
    return {
        "status": "UP",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "CONNECTED",
        "event_bus": "READY"
    }
