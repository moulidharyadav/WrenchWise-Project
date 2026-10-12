from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# ==============================================================================
# AUTH & USER SCHEMAS
# ==============================================================================

class UserRegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    email: str = Field(description="User corporate or retail email")
    password: str = Field(min_length=6, description="Raw password to be bcrypt hashed")
    role: Optional[str] = "CUSTOMER"  # CUSTOMER, TELLER, COMPLIANCE_OFFICER, ADMIN
    customer_id: Optional[str] = None

class UserLoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    customer_id: Optional[str]
    is_active: bool
    created_at: datetime

# ==============================================================================
# ACCOUNTS SCHEMAS
# ==============================================================================

class AccountCreateRequest(BaseModel):
    customer_id: str
    account_type: str = "CHECKING"  # CHECKING, SAVINGS, SALARY, TERM_DEPOSIT
    currency: str = "USD"
    initial_deposit: float = Field(default=0.0, ge=0.0)
    daily_limit: Optional[float] = 25000.0

class AccountResponse(BaseModel):
    account_number: str
    customer_id: str
    account_type: str
    currency: str
    balance: float
    available_balance: float
    hold_amount: float
    daily_limit: float
    status: str

class CustomerResponse(BaseModel):
    id: str
    cif: str
    full_name: str
    email: str
    phone: str
    segment: str
    kyc_tier: str
    kyc_status: str
    credit_bureau_score: int

# ==============================================================================
# TRANSACTION & OPERATIONS SCHEMAS
# ==============================================================================

class DepositRequest(BaseModel):
    account_number: str
    amount: float = Field(gt=0, description="Deposit amount must be strictly positive")
    currency: Optional[str] = "USD"
    channel: Optional[str] = "BRANCH"
    narrative: Optional[str] = "Branch Counter Deposit"
    idempotency_key: Optional[str] = None

class WithdrawRequest(BaseModel):
    account_number: str
    amount: float = Field(gt=0, description="Withdrawal amount must be strictly positive")
    currency: Optional[str] = "USD"
    channel: Optional[str] = "BRANCH"
    narrative: Optional[str] = "Counter Cash Withdrawal"
    idempotency_key: Optional[str] = None

class TransferRequest(BaseModel):
    source_account: str
    destination_account: str
    counterparty_name: Optional[str] = "Account Beneficiary"
    amount: float = Field(gt=0, description="Transfer amount must be strictly positive")
    currency: Optional[str] = "USD"
    category: Optional[str] = "TRANSFER"
    channel: Optional[str] = "WEB"
    idempotency_key: Optional[str] = None
    narrative: Optional[str] = "Digital Banking Transfer"

class TransactionResponse(BaseModel):
    id: str
    trace_id: Optional[str]
    idempotency_key: Optional[str]
    source_account: str
    destination_account: Optional[str]
    counterparty_name: Optional[str]
    amount: float
    currency: str
    direction: str
    category: str
    channel: str
    status: str
    fraud_risk_score: float
    risk_level: str
    created_at: datetime
    cleared_at: Optional[datetime] = None
    failure_reason: Optional[str] = None

class TransactionPaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[TransactionResponse]

# ==============================================================================
# DOUBLE-ENTRY LEDGER & RECONCILIATION SCHEMAS
# ==============================================================================

class JournalLegResponse(BaseModel):
    id: str
    journal_entry_id: str
    account_number: str
    direction: str  # DEBIT or CREDIT
    amount: float
    currency: str
    running_balance_after: float

class JournalEntryResponse(BaseModel):
    id: str
    reference_number: str
    transaction_id: Optional[str]
    narrative: str
    total_amount: float
    currency: str
    posted_at: datetime
    is_balanced: bool
    reconciled: bool
    legs: List[JournalLegResponse] = []

class ReconciliationReportResponse(BaseModel):
    reconciliation_timestamp: str
    total_accounts_audited: int
    total_journal_entries_audited: int
    total_system_debits: float
    total_system_credits: float
    is_ledger_balanced: bool
    discrepancies_found: int
    discrepancy_details: List[str]
    status: str

# ==============================================================================
# LOANS & HITL SCHEMAS
# ==============================================================================

class LoanSubmitRequest(BaseModel):
    account_number: str
    requested_amount: float = Field(gt=0)
    purpose: Optional[str] = "PERSONAL"
    tenure_months: int = Field(default=24, ge=6, le=84)

class LoanResponse(BaseModel):
    id: str
    customer_id: str
    account_number: str
    requested_amount: float
    approved_amount: float
    tenure_months: int
    interest_rate: float
    monthly_emi: float
    dti_ratio: float
    credit_bureau_score: int
    status: str
    decision_reasoning: Optional[str]

class HITLDecisionRequest(BaseModel):
    decision: str = Field(description="APPROVE or REJECT")
    reviewer_notes: Optional[str] = "Manual operational override"
    reviewed_by: Optional[str] = "COMPLIANCE_OFFICER_01"
