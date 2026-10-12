import time
from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class AgentContract(BaseModel):
    name: str
    role: str
    responsibility: str
    authorized_tools: List[str]
    input_schema: Dict[str, Any]
    output_schema: Dict[str, Any]
    failure_policy: str = "FALLBACK"  # FAIL_FAST, FALLBACK, ESCALATE
    timeout_seconds: float = 5.0
    max_retries: int = 2

class AgentStepTrace(BaseModel):
    step_number: int
    agent_name: str
    action_type: str  # THINK, TOOL_CALL, TOOL_RESULT, SYNTHESIS, ESCALATION
    content: str
    tool_name: Optional[str] = None
    tool_input: Optional[Dict[str, Any]] = None
    tool_output: Optional[Dict[str, Any]] = None
    latency_ms: int = 0
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    status: str = "SUCCESS"  # SUCCESS, RETRY, FAILED

class AgentExecutionResult(BaseModel):
    agent_name: str
    status: str  # SUCCESS, FAILED, ESCALATED, CANCELLED
    data: Dict[str, Any] = Field(default_factory=dict)
    steps: List[AgentStepTrace] = Field(default_factory=list)
    error: Optional[str] = None
    latency_ms: int = 0
    fallback_used: bool = False

class BaseAgent:
    """
    Standardized base class enforcing the Agent Contract across all 9 specialized agents.
    Every agent declares authorized tools, input/output contracts, and records execution traces.
    """
    def __init__(self, contract: AgentContract):
        self.contract = contract

    @property
    def name(self) -> str:
        return self.contract.name

    @property
    def role(self) -> str:
        return self.contract.role

    @property
    def authorized_tools(self) -> List[str]:
        return self.contract.authorized_tools

    def is_tool_authorized(self, tool_name: str) -> bool:
        return tool_name in self.contract.authorized_tools

    async def execute(self, shared_state: Dict[str, Any], **kwargs) -> AgentExecutionResult:
        """
        Subclasses must implement execution logic.
        """
        raise NotImplementedError("Specialized agents must implement execute().")
