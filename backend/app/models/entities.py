from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Integer, Boolean, Text, JSON
from app.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class BankingProduct(Base):
    __tablename__ = "banking_products"

    id = Column(String(36), primary_key=True)
    product_code = Column(String(32), unique=True, index=True)
    name = Column(String(128), nullable=False)
    category = Column(String(64), nullable=False)  # SAVINGS, DEPOSIT, LOAN, CARD, WEALTH
    description = Column(Text, nullable=False)
    interest_rate = Column(Float, default=0.0)  # e.g., 4.75 APY or 7.99 APR
    min_balance = Column(Float, default=0.0)
    max_limit = Column(Float, default=0.0)
    features = Column(JSON, nullable=True)  # List of string features
    terms = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(String(36), primary_key=True)
    transaction_id = Column(String(64), index=True, nullable=True)
    customer_id = Column(String(36), index=True, nullable=True)
    account_number = Column(String(32), nullable=True)
    risk_score = Column(Float, nullable=False)  # 0 to 100
    severity = Column(String(16), nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    triggered_rules = Column(JSON, nullable=True)
    supporting_evidence = Column(JSON, nullable=True)
    recommended_action = Column(String(128), nullable=False)
    decision = Column(String(32), default="MONITOR")  # ALLOW, REVIEW_REQUIRED, BLOCK, AUTO_FLAG
    evaluated_by = Column(String(64), default="RISK_FRAUD_AGENT")
    created_at = Column(DateTime, default=utc_now)

class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(String(64), primary_key=True)  # run_id or execution_id
    correlation_id = Column(String(64), index=True, nullable=False)
    channel = Column(String(32), default="WEB")
    user_prompt = Column(Text, nullable=False)
    detected_intent = Column(String(64), nullable=False)
    status = Column(String(32), default="COMPLETED")  # PENDING, RUNNING, COMPLETED, FAILED
    primary_agent = Column(String(64), nullable=False)
    selected_agents = Column(JSON, nullable=True)
    tool_calls_count = Column(Integer, default=0)
    total_latency_ms = Column(Integer, default=0)
    model_used = Column(String(64), default="gemini-2.5-pro-experimental")
    execution_mode = Column(String(32), default="DETERMINISTIC_FALLBACK")
    prompt_version = Column(String(32), default="v1.2-enterprise-banking-core")
    verdict = Column(String(64), default="SUCCESS")
    final_response = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

class AgentStepRecord(Base):
    __tablename__ = "agent_step_records"

    id = Column(String(36), primary_key=True)
    run_id = Column(String(64), index=True, nullable=False)
    step_number = Column(Integer, nullable=False)
    agent_name = Column(String(64), nullable=False)
    action_type = Column(String(32), nullable=False)  # PLAN, TOOL_CALL, TOOL_RESULT, SYNTHESIS
    description = Column(Text, nullable=False)
    tool_name = Column(String(64), nullable=True)
    tool_arguments = Column(JSON, nullable=True)
    tool_result = Column(JSON, nullable=True)
    status = Column(String(16), default="COMPLETED")
    latency_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)

class ToolExecutionRecord(Base):
    __tablename__ = "tool_execution_records"

    id = Column(String(36), primary_key=True)
    correlation_id = Column(String(64), index=True, nullable=False)
    tool_name = Column(String(64), index=True, nullable=False)
    invoking_agent = Column(String(64), nullable=False)
    input_args = Column(JSON, nullable=True)
    output_result = Column(JSON, nullable=True)
    is_success = Column(Boolean, default=True)
    error_message = Column(Text, nullable=True)
    latency_ms = Column(Integer, default=0)
    requires_approval = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

class SystemNotification(Base):
    __tablename__ = "system_notifications"

    id = Column(String(36), primary_key=True)
    recipient_id = Column(String(36), index=True, nullable=True)  # customer_id or "ADMIN"
    category = Column(String(32), nullable=False)  # RISK_ALERT, TRANSACTION, LOAN, COMPLIANCE
    severity = Column(String(16), default="INFO")  # INFO, WARNING, CRITICAL
    title = Column(String(128), nullable=False)
    message = Column(Text, nullable=False)
    reference_id = Column(String(64), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

class SystemConfigurationRecord(Base):
    __tablename__ = "system_configurations"

    key = Column(String(64), primary_key=True)
    value = Column(Text, nullable=False)
    description = Column(String(256), nullable=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
