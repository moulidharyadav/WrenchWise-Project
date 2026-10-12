from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Integer, Boolean, Text
from app.database import Base

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(String(36), primary_key=True)
    idempotency_key = Column(String(64), unique=True, index=True, nullable=True)
    trace_id = Column(String(64), index=True)
    
    source_account = Column(String(32), index=True, nullable=False)
    destination_account = Column(String(32), index=True, nullable=True)
    counterparty_name = Column(String(128), default="Internal Transfer")
    
    amount = Column(Float, nullable=False)
    currency = Column(String(8), default="USD")
    direction = Column(String(8), default="DEBIT")
    category = Column(String(32), default="TRANSFER")  # TRANSFER, SALARY, SHOPPING, WIRE, LOAN
    channel = Column(String(32), default="WEB")        # MOBILE, WEB, BRANCH, CALL_CENTER, RM_PORTAL, API
    
    status = Column(String(32), default="PENDING")     # CLEARED, PENDING, FROZEN_FRAUD, BLOCKED_SANCTIONS, REJECTED
    fraud_risk_score = Column(Float, default=0.0)      # 0 to 100
    risk_level = Column(String(16), default="LOW")     # LOW, MEDIUM, HIGH, CRITICAL
    
    origin_ip = Column(String(45), default="127.0.0.1")
    origin_geo = Column(String(64), default="United States")
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    cleared_at = Column(DateTime, nullable=True)
    failure_reason = Column(Text, nullable=True)
