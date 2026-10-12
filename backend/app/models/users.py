from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Enum
from app.database import Base
import enum

class UserRole(str, enum.Enum):
    CUSTOMER = "CUSTOMER"
    TELLER = "TELLER"
    COMPLIANCE_OFFICER = "COMPLIANCE_OFFICER"
    ADMIN = "ADMIN"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    role = Column(String(32), default=UserRole.CUSTOMER, nullable=False)
    customer_id = Column(String(36), index=True, nullable=True)  # Linked Customer profile if role is CUSTOMER
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
