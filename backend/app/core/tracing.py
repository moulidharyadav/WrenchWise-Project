import uuid
import time
from typing import Dict, Any, List
from datetime import datetime

class Tracer:
    """
    OpenTelemetry-compatible distributed tracer for multi-agent workflows.
    Generates correlation trace IDs and records span metrics.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Tracer, cls).__new__(cls)
            cls._instance.active_traces: Dict[str, List[Dict[str, Any]]] = {}
        return cls._instance

    @staticmethod
    def generate_trace_id() -> str:
        return f"trc-{uuid.uuid4().hex[:12].upper()}"

    @staticmethod
    def generate_span_id() -> str:
        return f"spn-{uuid.uuid4().hex[:8].upper()}"

    def record_span(
        self,
        trace_id: str,
        agent_name: str,
        action: str,
        latency_ms: int,
        details: str = "",
        tool_payload: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        span = {
            "span_id": self.generate_span_id(),
            "trace_id": trace_id,
            "agent_name": agent_name,
            "action": action,
            "latency_ms": latency_ms,
            "details": details,
            "tool_payload": tool_payload or {},
            "timestamp": datetime.utcnow().isoformat(),
        }
        if trace_id not in self.active_traces:
            self.active_traces[trace_id] = []
        self.active_traces[trace_id].append(span)
        return span

    def get_spans(self, trace_id: str) -> List[Dict[str, Any]]:
        return self.active_traces.get(trace_id, [])

tracer = Tracer()
