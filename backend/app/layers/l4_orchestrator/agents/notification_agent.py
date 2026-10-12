from typing import Dict, Any
from app.layers.l4_orchestrator.base_agent import BaseAgent, AgentContract, AgentExecutionResult, AgentStepTrace
from app.layers.l5_mcp_tools.tool_registry import MCPToolRegistry

class NotificationAgent(BaseAgent):
    def __init__(self):
        super().__init__(AgentContract(
            name="NOTIFICATION_AGENT",
            role="Multi-Channel Notification Dispatch & Audit Receipts",
            responsibility="Dispatches transactional confirmations, security alerts, and compliance escalations across SMS, Push, and Email.",
            authorized_tools=["send_notification"],
            input_schema={"customer_id": "str", "message": "str", "priority": "Optional[str]"},
            output_schema={"status": "str", "channels": "list", "delivered_at": "str"}
        ))

    async def execute(self, shared_state: Dict[str, Any], **kwargs) -> AgentExecutionResult:
        steps = []
        customer_id = str(shared_state.get("customer_id", "CUST-8801"))
        message = str(shared_state.get("notification_message", shared_state.get("message", "Horizon Banking Operational Alert")))
        priority = str(shared_state.get("priority", "NORMAL"))

        steps.append(AgentStepTrace(
            step_number=1,
            agent_name=self.name,
            action_type="THINK",
            content=f"Preparing multi-channel notification for customer {customer_id} (Priority: {priority})."
        ))

        ok, notif_data = MCPToolRegistry.execute_tool(
            "send_notification",
            {
                "customer_id": customer_id,
                "message": message,
                "priority": priority
            },
            invoking_agent=self.name
        )

        steps.append(AgentStepTrace(
            step_number=2,
            agent_name=self.name,
            action_type="TOOL_CALL",
            content=f"Dispatched notification via SMS, Push, and Email. Status: {notif_data.get('status')}.",
            tool_name="send_notification",
            tool_input={"customer_id": customer_id, "priority": priority},
            tool_output=notif_data
        ))

        return AgentExecutionResult(
            agent_name=self.name,
            status="SUCCESS",
            data=notif_data,
            steps=steps
        )
