"""
Pydantic schemas for MCP Tool Registry.
Enforces schema validation on arguments and outputs for all 12 banking tools.
"""
from typing import Dict, Any, List, Optional, Union
from pydantic import BaseModel, Field
from datetime import datetime

# -------------------------------------------------------------------------
# Tool Input/Output Schemas for the 12 Mandatory Banking Tools
# -------------------------------------------------------------------------

# 1. Account Tool
class AccountToolInput(BaseModel):
    account_number: str = Field(default="ACC-1002341", description="Account identifier")
    action: str = Field(default="GET_BALANCE", description="Action: GET_BALANCE, GET_DETAILS, LIST_ACCOUNTS")

class AccountToolOutput(BaseModel):
    account_number: str
    account_type: str = "CHECKING"
    currency: str = "USD"
    cleared_balance: float = 48500.50
    available_balance: float = 48500.50
    status: str = "ACTIVE"
    daily_limit: float = 25000.0

# 2. Loan Tool
class LoanToolInput(BaseModel):
    customer_id: str = Field(default="CUST-8801", description="Customer ID")
    loan_type: str = Field(default="PERSONAL_TERM", description="PERSONAL_TERM, AUTO, MORTGAGE")
    requested_amount: float = Field(default=25000.0, description="Principal requested in USD")
    tenure_months: int = Field(default=24, description="Tenure in months")

class LoanToolOutput(BaseModel):
    loan_type: str
    requested_amount: float
    tenure_months: int
    interest_rate_apr: float
    monthly_emi_usd: float
    total_repayment_usd: float
    underwriting_verdict: str
    max_eligible_limit: float

# 3. Credit Tool
class CreditToolInput(BaseModel):
    customer_id: str = Field(default="CUST-8801", description="Customer CIF")
    bureau: str = Field(default="EXPERIAN", description="Bureau: EXPERIAN, CIBIL, EQUIFAX")

class CreditToolOutput(BaseModel):
    customer_id: str
    bureau: str
    credit_score: int
    risk_grade: str
    delinquencies: int
    credit_utilization_pct: float
    recommended_max_credit: float

# 4. Payment Tool
class PaymentToolInput(BaseModel):
    source_account: str = Field(default="ACC-1002341", description="Originating account")
    destination_account: str = Field(default="ACC-2009812", description="Beneficiary account")
    amount: float = Field(default=500.0, ge=0.01, description="Transfer amount in USD")
    payment_network: str = Field(default="ACH", description="ACH, FEDWIRE, SWIFT")
    idempotency_key: Optional[str] = Field(default=None, description="Unique idempotency key")

class PaymentToolOutput(BaseModel):
    payment_id: str
    source_account: str
    destination_account: str
    amount: float
    payment_network: str
    status: str
    requires_human_approval: bool = False
    approval_ticket_id: Optional[str] = None
    estimated_settlement: str

# 5. CRM Tool
class CRMToolInput(BaseModel):
    customer_id: str = Field(default="CUST-8801", description="Customer identifier")
    action: str = Field(default="GET_360", description="GET_360, GET_INTERACTIONS, LOG_NOTE")
    note: Optional[str] = Field(default=None, description="Optional CRM interaction note")

class CRMToolOutput(BaseModel):
    customer_id: str
    full_name: str
    segment: str
    kyc_tier: str
    relationship_manager: str
    active_products_count: int
    linked_accounts: List[str]

# 6. KYC Tool
class KYCToolInput(BaseModel):
    customer_id: str = Field(default="CUST-8801", description="Customer identifier")
    document_type: str = Field(default="PASSPORT", description="PASSPORT, DRIVERS_LICENSE, NATIONAL_ID")
    id_number: Optional[str] = Field(default=None, description="Masked ID document number")

class KYCToolOutput(BaseModel):
    customer_id: str
    kyc_status: str
    verification_tier: str
    biometrics_verified: bool
    last_verified_at: str
    risk_rating: str

# 7. AML Tool
class AMLToolInput(BaseModel):
    entity_name: str = Field(default="DARKNET ESCROW SERVICES", description="Entity or counterparty name to screen")
    country_code: Optional[str] = Field(default=None, description="ISO-2 country code")

class AMLToolOutput(BaseModel):
    entity_name: str
    provider: str = "OFAC_SDN_SCREENER_V2"
    matched: bool
    risk_score: float
    matched_lists: List[str]
    details: str

# 8. Card Tool
class CardToolInput(BaseModel):
    card_id: str = Field(default="CARD-9912", description="Card identifier")
    action: str = Field(default="GET_CONTROLS", description="GET_CONTROLS, LOCK_CARD, UNLOCK_CARD, SET_LIMIT")
    new_limit: Optional[float] = Field(default=None, description="New daily limit if SET_LIMIT")

class CardToolOutput(BaseModel):
    card_id: str
    card_type: str
    status: str
    contactless_enabled: bool
    international_enabled: bool
    daily_spend_limit: float
    requires_human_approval: bool = False

# 9. Transaction Tool
class TransactionToolInput(BaseModel):
    account_number: Optional[str] = Field(default="ACC-1002341", description="Account identifier")
    limit: int = Field(default=10, ge=1, le=100, description="Number of transactions to return")
    category: Optional[str] = Field(default=None, description="Filter category")

class TransactionToolOutput(BaseModel):
    account_number: str
    total_returned: int
    transactions: List[Dict[str, Any]]

# 10. Notification Tool
class NotificationToolInput(BaseModel):
    customer_id: str = Field(default="CUST-8801", description="Recipient customer ID")
    message: str = Field(default="Your security code is 884-129", description="Alert message text")
    channels: List[str] = Field(default=["SMS", "PUSH"], description="Delivery channels: SMS, PUSH, EMAIL")
    priority: str = Field(default="HIGH", description="NORMAL, HIGH, CRITICAL")

class NotificationToolOutput(BaseModel):
    dispatch_id: str
    customer_id: str
    status: str
    channels_delivered: List[str]
    priority: str
    dispatched_at: str

# 11. Document Tool
class DocumentToolInput(BaseModel):
    document_id: Optional[str] = Field(default="DOC-PAYSTUB-99", description="Document reference ID")
    document_type: str = Field(default="PAYSTUB", description="PAYSTUB, BANK_STATEMENT, UTILITY_BILL")
    raw_text: Optional[str] = Field(default="Gross Monthly Pay: $8,500.00. TechGlobal Inc.", description="Document text content")

class DocumentToolOutput(BaseModel):
    document_id: str
    document_type: str
    verification_status: str
    extracted_fields: Dict[str, Any]
    confidence_score: float
    summary: str

# 12. Core Banking Tool
class CoreBankingToolInput(BaseModel):
    action: str = Field(default="CHECK_LEDGER_BALANCE", description="CHECK_LEDGER_BALANCE, RECONCILE_ACCOUNTS")
    account_number: Optional[str] = Field(default="ACC-1002341", description="Account number")

class CoreBankingToolOutput(BaseModel):
    core_banking_system: str = "HORIZON_CORE_LEDGER_V4"
    status: str
    ledger_balanced: bool
    total_debits: float
    total_credits: float
    variance: float = 0.0

# -------------------------------------------------------------------------
# MCP Protocol & Structured Error Schemas
# -------------------------------------------------------------------------

class MCPToolDefinition(BaseModel):
    name: str
    description: str
    category: str
    authorized_agents: List[str]
    permission: str
    is_sensitive: bool = False
    input_schema: Dict[str, Any]
    output_schema: Dict[str, Any]

class StructuredToolError(BaseModel):
    error_code: str
    message: str
    tool_name: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    retries_exhausted: bool = False
    recovery_hint: str
