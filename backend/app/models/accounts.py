from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Integer, Enum, Text
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class AccountType(str, enum.Enum):
    CHECKING = "CHECKING"
    SAVINGS = "SAVINGS"
    SALARY = "SALARY"
    TERM_DEPOSIT = "TERM_DEPOSIT"
    LINE_OF_CREDIT = "LINE_OF_CREDIT"

class AccountStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    DORMANT = "DORMANT"
    FROZEN = "FROZEN"
    UNDER_REVIEW = "UNDER_REVIEW"

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(String(36), primary_key=True)
    cif = Column(String(32), unique=True, index=True)
    full_name = Column(String(128), nullable=False)
    email = Column(String(128), unique=True, index=True)
    phone = Column(String(32), nullable=False)
    dob = Column(String(16), nullable=False)
    address = Column(String(256), nullable=False)
    nationality = Column(String(64), default="United States")
    segment = Column(String(32), default="PREMIUM")  # RETAIL, PREMIUM, PRIVATE_WEALTH
    kyc_tier = Column(String(16), default="TIER_3")
    kyc_status = Column(String(16), default="VERIFIED")
    credit_bureau_score = Column(Integer, default=750)
    created_at = Column(DateTime, default=datetime.utcnow)

class Account(Base):
    __tablename__ = "accounts"
    
    account_number = Column(String(32), primary_key=True, index=True)
    customer_id = Column(String(36), index=True)
    account_type = Column(String(32), default=AccountType.CHECKING)
    currency = Column(String(8), default="USD")
    balance = Column(Float, default=0.0)
    available_balance = Column(Float, default=0.0)
    hold_amount = Column(Float, default=0.0)
    daily_limit = Column(Float, default=25000.0)
    status = Column(String(32), default=AccountStatus.ACTIVE)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
