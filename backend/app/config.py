from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "Wrench Wise AI Banking Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENV: str = "development"
    DEBUG: bool = True
    
    # Layer 2: Security & Auth
    SECRET_KEY: str = "enterprise_super_secret_jwt_key_9921_banking_auth_token"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ]
    
    # Layer 6: Enterprise Database
    # Uses SQLite file fallback for clean local runs, can switch to postgresql+asyncpg
    DATABASE_URL: str = "sqlite+aiosqlite:///./banking.db"
    
    # Event Bus / Streaming (Redis or local memory fallback)
    REDIS_URL: str = "redis://localhost:6379/0"
    USE_LOCAL_EVENT_BUS: bool = True
    
    # Layer 3: AI Gateway & Experimental Model Settings
    DEFAULT_MODEL: str = "gemini-2.5-pro-experimental"
    FALLBACK_MODEL: str = "deterministic-banking-expert"
    ENABLE_LLM_API: bool = False
    LLM_API_KEY: str = ""
    
    # FinOps & Guardrail Thresholds
    TOKEN_BUDGET_DAILY: int = 500000
    HITL_AMOUNT_THRESHOLD: float = 25000.0  # Sensitive transactions > $25,000 trigger HITL approval
    FRAUD_CRITICAL_THRESHOLD: float = 75.0  # Fraud score >= 75 triggers immediate freeze & HITL

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow"
    )

settings = Settings()
