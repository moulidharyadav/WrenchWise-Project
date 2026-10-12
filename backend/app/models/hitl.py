from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Integer, Boolean, Text
from app.database import Base

class LoanApplication(Base):
    __tablename__ = "loan_applications"
    
    id = Column(String(36), primary_key=True)
    customer_id = Column(String(36), index=True, nullable=False)
    account_number = Column(String(32), nullable=False)
    
    requested_amount = Column(Float, nullable=False)
    approved_amount = Column(Float, default=0.0)
    currency = Column(String(8), default="USD")
    purpose = Column(String(64), default="PERSONAL")
    tenure_months = Column(Integer, default=24)
    
    interest_rate = Column(Float, default=8.49)
    monthly_emi = Column(Float, default=0.0)
    dti_ratio = Column(Float, default=24.0)
    credit_bureau_score = Column(Integer, default=750)
    
    status = Column(String(32), default="SUBMITTED")  # SUBMITTED, PRE_APPROVED, APPROVED, REJECTED, DISBURSED
    underwriter_agent = Column(String(64), default="CREDIT_AGENT")
    decision_reasoning = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    decided_at = Column(DateTime, nullable=True)

class HITLApproval(Base):
    """
    Human-in-the-Loop review ticket for sensitive operations.
    Triggered when amount > threshold, fraud score >= 75, or sanctions match.
    """
    __tablename__ = "hitl_approvals"
    
    id = Column(String(36), primary_key=True)
    ticket_number = Column(String(32), unique=True, index=True)
    category = Column(String(32), nullable=False)  # FRAUD_ALERT, HIGH_VALUE_TRANSFER, SANCTIONS_MATCH, LOAN_OVERRIDE
    reference_id = Column(String(64), index=True, nullable=False)  # txn_id or loan_id
    
    amount = Column(Float, default=0.0)
    risk_score = Column(Float, default=0.0)
    reason = Column(Text, nullable=False)
    
    status = Column(String(32), default="PENDING_REVIEW")  # PENDING_REVIEW, APPROVED, REJECTED, AUTO_EXPIRED
    reviewed_by = Column(String(64), nullable=True)
    reviewer_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    resolved_at = Column(DateTime, nullable=True)
