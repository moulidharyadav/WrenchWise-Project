from typing import Dict, Any
from app.layers.l4_orchestrator.base_agent import BaseAgent, AgentContract, AgentExecutionResult, AgentStepTrace
from app.layers.l5_mcp_tools.tool_registry import MCPToolRegistry

class CustomerAgent(BaseAgent):
    def __init__(self):
        super().__init__(AgentContract(
            name="CUSTOMER_AGENT",
            role="Authorized Customer Profile & Account Balances",
            responsibility="Queries customer 360 attributes, verifies KYC tier, relationship history, and account balances.",
            authorized_tools=["get_customer_360", "get_account_balances"],
            input_schema={"customer_id": "str", "account_number": "Optional[str]"},
            output_schema={"customer_profile": "dict", "accounts": "list"}
        ))

    async def execute(self, shared_state: Dict[str, Any], **kwargs) -> AgentExecutionResult:
        steps = []
        customer_id = shared_state.get("customer_id", "CUST-8801")
        account_number = shared_state.get("account_number", "ACC-1002341")

        steps.append(AgentStepTrace(
            step_number=1,
            agent_name=self.name,
            action_type="THINK",
            content=f"Resolving authorized customer relationship and active accounts for customer {customer_id}."
        ))

        # Tool 1: Customer 360
        ok1, cust_data = MCPToolRegistry.execute_tool(
            "get_customer_360",
            {"customer_id": customer_id},
            invoking_agent=self.name
        )
        steps.append(AgentStepTrace(
            step_number=2,
            agent_name=self.name,
            action_type="TOOL_CALL",
            content=f"Retrieving Customer 360 record for {customer_id}.",
            tool_name="get_customer_360",
            tool_input={"customer_id": customer_id},
            tool_output=cust_data
        ))

        # Tool 2: Account balances
        ok2, bal_data = MCPToolRegistry.execute_tool(
            "get_account_balances",
            {"account_number": account_number},
            invoking_agent=self.name
        )
        steps.append(AgentStepTrace(
            step_number=3,
            agent_name=self.name,
            action_type="TOOL_CALL",
            content=f"Fetching cleared and available ledger balance for account {account_number}.",
            tool_name="get_account_balances",
            tool_input={"account_number": account_number},
            tool_output=bal_data
        ))

        return AgentExecutionResult(
            agent_name=self.name,
            status="SUCCESS",
            data={
                "customer_profile": cust_data,
                "account_balances": bal_data
            },
            steps=steps
        )
