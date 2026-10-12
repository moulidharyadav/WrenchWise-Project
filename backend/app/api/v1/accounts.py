from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.database import get_db
from app.layers.l6_enterprise_data.repository import BankingRepository
from app.schemas.banking import AccountResponse, AccountCreateRequest
from app.core.security import get_optional_current_user, get_current_user
from app.models.users import User

router = APIRouter(prefix="/accounts", tags=["Accounts & Balances"])

@router.get("", response_model=List[AccountResponse])
async def get_accounts(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    repo = BankingRepository(db)
    accounts = await repo.list_accounts()
    
    # If authenticated customer, filter to customer's own accounts
    if current_user and current_user.role == "CUSTOMER" and current_user.customer_id:
        user_accounts = [a for a in accounts if a.customer_id == current_user.customer_id]
        if user_accounts:
            accounts = user_accounts

    return [
        AccountResponse(
            account_number=a.account_number,
            customer_id=a.customer_id,
            account_type=a.account_type,
            currency=a.currency,
            balance=a.balance,
            available_balance=a.available_balance,
            hold_amount=a.hold_amount,
            daily_limit=a.daily_limit,
            status=a.status
        )
        for a in accounts
    ]

@router.post("/create", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
async def create_new_account(
    req: AccountCreateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    repo = BankingRepository(db)
    success, msg, account = await repo.create_account(
        customer_id=req.customer_id,
        account_type=req.account_type,
        currency=req.currency,
        initial_deposit=req.initial_deposit,
        daily_limit=req.daily_limit or 25000.0
    )
    if not success:
        raise HTTPException(status_code=400, detail=msg)

    return AccountResponse(
        account_number=account.account_number,
        customer_id=account.customer_id,
        account_type=account.account_type,
        currency=account.currency,
        balance=account.balance,
        available_balance=account.available_balance,
        hold_amount=account.hold_amount,
        daily_limit=account.daily_limit,
        status=account.status
    )

@router.get("/{account_number}", response_model=AccountResponse)
async def get_account_by_number(
    account_number: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    repo = BankingRepository(db)
    acc = await repo.get_account(account_number)
    if not acc:
        raise HTTPException(status_code=404, detail=f"Account '{account_number}' not found.")

    return AccountResponse(
        account_number=acc.account_number,
        customer_id=acc.customer_id,
        account_type=acc.account_type,
        currency=acc.currency,
        balance=acc.balance,
        available_balance=acc.available_balance,
        hold_amount=acc.hold_amount,
        daily_limit=acc.daily_limit,
        status=acc.status
    )

@router.get("/{account_number}/balance")
async def get_account_balance(
    account_number: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    repo = BankingRepository(db)
    acc = await repo.get_account(account_number)
    if not acc:
        raise HTTPException(status_code=404, detail=f"Account '{account_number}' not found.")

    return {
        "account_number": acc.account_number,
        "currency": acc.currency,
        "cleared_balance": acc.balance,
        "available_balance": acc.available_balance,
        "hold_amount": acc.hold_amount,
        "daily_limit_remaining": acc.daily_limit,
        "status": acc.status
    }
