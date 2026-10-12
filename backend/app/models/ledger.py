from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Integer, Boolean, Text
from app.database import Base

class JournalEntry(Base):
    """
    Core double-entry accounting journal header.
    Every valid banking operation requires balanced debit & credit entry legs.
    """
    __tablename__ = "journal_entries"
    
    id = Column(String(36), primary_key=True)
    reference_number = Column(String(64), unique=True, index=True)
    transaction_id = Column(String(36), index=True)
    narrative = Column(String(256), nullable=False)
    total_amount = Column(Float, nullable=False)
    currency = Column(String(8), default="USD")
    posted_at = Column(DateTime, default=datetime.utcnow)
    is_balanced = Column(Boolean, default=True)
    reconciled = Column(Boolean, default=False)
    reconciled_at = Column(DateTime, nullable=True)

class JournalLeg(Base):
    """
    Individual debit or credit leg for an account in the ledger.
    Sum of debits must equal sum of credits for a given JournalEntry.
    """
    __tablename__ = "journal_legs"
    
    id = Column(String(36), primary_key=True)
    journal_entry_id = Column(String(36), index=True, nullable=False)
    account_number = Column(String(32), index=True, nullable=False)
    direction = Column(String(8), nullable=False)  # 'DEBIT' or 'CREDIT'
    amount = Column(Float, nullable=False)
    currency = Column(String(8), default="USD")
    running_balance_after = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
