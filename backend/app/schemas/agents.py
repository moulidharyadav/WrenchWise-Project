from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class AgentPromptRequest(BaseModel):
    prompt: str = Field(min_length=1, description="Natural language banking request")
    channel: Optional[str] = "WEB"
    account_number: Optional[str] = "ACC-1002341"
    customer_id: Optional[str] = "CUST-8801"
    model_override: Optional[str] = None

class AgentStepSchema(BaseModel):
    step_number: int
    agent_name: str
    action_type: str  # THINK, TOOL_CALL, TOOL_RESULT, SYNTHESIS, ESCALATION
    content: str
    tool_name: Optional[str] = None
    tool_input: Optional[Dict[str, Any]] = None
    tool_output: Optional[Dict[str, Any]] = None
    latency_ms: int = 0
    timestamp: str

class AgentTrajectoryResponse(BaseModel):
    id: str
    trace_id: str
    user_prompt: str
    intent: str
    primary_agent: str
    participating_agents: List[str]
    steps: List[AgentStepSchema]
    final_response: str
    verdict: str  # APPROVED, FLAGGED_HUMAN_REVIEW, REJECTED, COMPLETED
    hitl_ticket_id: Optional[str] = None
    metrics: Dict[str, Any]
    timestamp: str

class AgentCatalogItem(BaseModel):
    id: str
    name: str
    role: str
    avatar: str
    description: str
    layer: int
    assigned_model: str
    capabilities: List[str]
    status: str
    metrics: Dict[str, Any]
