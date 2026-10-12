import time
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.layers.l6_enterprise_data.repository import BankingRepository
from app.core.security import verify_password, create_access_token, get_current_user, security_bearer
from app.schemas.banking import UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse
from app.models.users import User
from fastapi.security import HTTPAuthorizationCredentials
from typing import Optional, Dict

router = APIRouter(prefix="/auth", tags=["Authentication & Roles"])

# Token revocation blacklist (in-memory, token -> expire_timestamp)
REVOKED_TOKENS: Dict[str, float] = {}

# Simple in-memory IP rate limiter for login attempts (IP -> list of attempt timestamps)
LOGIN_ATTEMPTS: Dict[str, list] = {}
MAX_LOGIN_ATTEMPTS_PER_MINUTE = 10
RATE_LIMIT_WINDOW_SECONDS = 60

def check_login_rate_limit(request: Request):
    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()
    attempts = LOGIN_ATTEMPTS.get(client_ip, [])
    # Filter attempts within window
    attempts = [t for t in attempts if now - t < RATE_LIMIT_WINDOW_SECONDS]
    if len(attempts) >= MAX_LOGIN_ATTEMPTS_PER_MINUTE:
        LOGIN_ATTEMPTS[client_ip] = attempts
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many authentication attempts. Please wait 60 seconds before trying again."
        )
    attempts.append(now)
    LOGIN_ATTEMPTS[client_ip] = attempts

@router.post("/register", response_model=UserResponse)
async def register_user(req: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    repo = BankingRepository(db)
    existing = await repo.get_user_by_username(req.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{req.username}' is already registered."
        )

    user = await repo.create_user(
        username=req.username,
        email=req.email,
        raw_password=req.password,
        role=req.role or "CUSTOMER",
        customer_id=req.customer_id
    )
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        customer_id=user.customer_id,
        is_active=user.is_active,
        created_at=user.created_at
    )

@router.post("/login", response_model=TokenResponse)
async def login_user(req: UserLoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    # 1. Rate limiting protection
    check_login_rate_limit(request)

    repo = BankingRepository(db)
    # Check if user exists by username or email
    user = await repo.get_user_by_username(req.username)
    if not user and "@" in req.username:
        # Allow login via email as well
        from sqlalchemy import select
        res = await db.execute(select(User).where(User.email == req.username.lower()))
        user = res.scalars().first()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Please contact bank administration."
        )

    access_token = create_access_token(data={
        "sub": user.username,
        "user_id": user.id,
        "role": user.role,
        "customer_id": user.customer_id
    })

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "customer_id": user.customer_id
        }
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    current_user: User = Depends(get_current_user)
):
    if auth and auth.credentials in REVOKED_TOKENS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has been terminated or logged out. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        customer_id=current_user.customer_id,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )

@router.post("/logout")
async def logout_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)
):
    if auth and auth.credentials:
        REVOKED_TOKENS[auth.credentials] = time.time()
    return {"status": "SUCCESS", "message": "Successfully logged out. Session terminated."}

@router.get("/test-accounts")
async def get_test_accounts(db: AsyncSession = Depends(get_db)):
    """
    Development/Simulation helper endpoint displaying demo operator and customer accounts
    so evaluators can test role-based authentication instantly.
    """
    repo = BankingRepository(db)
    users = [
        {"username": "aarav_patel", "role": "CUSTOMER", "description": "Retail Banking Customer (ACC-1002341)", "email": "aarav.patel@wrenchwise.bank"},
        {"username": "teller_ops", "role": "TELLER", "description": "Branch Operations Officer", "email": "teller@wrenchwise.bank"},
        {"username": "compliance_officer", "role": "COMPLIANCE_OFFICER", "description": "Chief AML & Risk Compliance Officer", "email": "compliance@wrenchwise.bank"},
        {"username": "admin_operator", "role": "ADMIN", "description": "Platform Operations SRE / Administrator", "email": "admin@wrenchwise.bank"},
    ]
    return {
        "environment": "SIMULATED_BANKING_DEVELOPMENT",
        "notice": "This is a simulated enterprise banking environment. Passwords for seeded users are stored securely with bcrypt hashing.",
        "accounts": users
    }

