from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Integer, Boolean, Text
from app.database import Base

class AgentTraceSpan(Base):
    """
    OpenTelemetry-compatible distributed trace span for multi-agent workflows.
    """
    __tablename__ = "agent_trace_spans"
    
    id = Column(String(36), primary_key=True)
    trace_id = Column(String(64), index=True, nullable=False)
    parent_span_id = Column(String(64), nullable=True)
    agent_name = Column(String(64), index=True, nullable=False)
    action_type = Column(String(32), nullable=False)  # THINK, TOOL_CALL, TOOL_RESULT, SYNTHESIS, ESCALATION
    
    input_payload = Column(Text, nullable=True)
    output_payload = Column(Text, nullable=True)
    latency_ms = Column(Integer, default=0)
    status = Column(String(16), default="SUCCESS")
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

class FinOpsTokenRecord(Base):
    """
    Token accounting and cost tracker per model invocation.
    """
    __tablename__ = "finops_token_records"
    
    id = Column(String(36), primary_key=True)
    trace_id = Column(String(64), index=True, nullable=False)
    model_name = Column(String(64), nullable=False)
    agent_name = Column(String(64), nullable=False)
    
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    cost_usd = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
