from typing import Dict, Any
from app.layers.l4_orchestrator.base_agent import BaseAgent, AgentContract, AgentExecutionResult, AgentStepTrace
from app.layers.l5_mcp_tools.tool_registry import MCPToolRegistry

class CreditAgent(BaseAgent):
    def __init__(self):
        super().__init__(AgentContract(
            name="CREDIT_AGENT",
            role="Credit Bureau Analytics & Underwriting Engine",
            responsibility="Queries simulated credit bureau bureaus, checks DTI ratios, assesses eligibility, and computes EMI amortization schedules.",
            authorized_tools=["query_credit_bureau"],
            input_schema={"customer_id": "str", "requested_amount": "float", "tenure_months": "int"},
            output_schema={"bureau_score": "int", "underwriting_verdict": "str", "monthly_emi_usd": "float"}
        ))

    async def execute(self, shared_state: Dict[str, Any], **kwargs) -> AgentExecutionResult:
        steps = []
        customer_id = shared_state.get("customer_id", "CUST-8801")
        loan_amount = float(shared_state.get("loan_amount", shared_state.get("amount", 25000.0)))
        tenure = int(shared_state.get("tenure_months", 24))

        steps.append(AgentStepTrace(
            step_number=1,
            agent_name=self.name,
            action_type="THINK",
            content=f"Initiating credit underwriting assessment for customer {customer_id}: requested principal ${loan_amount:,.2f} over {tenure} months."
        ))

        ok, bureau_data = MCPToolRegistry.execute_tool(
            "query_credit_bureau",
            {
                "customer_id": customer_id,
                "requested_amount": loan_amount,
                "tenure_months": tenure
            },
            invoking_agent=self.name
        )

        steps.append(AgentStepTrace(
            step_number=2,
            agent_name=self.name,
            action_type="TOOL_CALL",
            content=f"Queried Credit Bureau: Score {bureau_data.get('bureau_score')} ({bureau_data.get('bureau_grade')}). Verdict: {bureau_data.get('underwriting_verdict')}.",
            tool_name="query_credit_bureau",
            tool_input={"customer_id": customer_id, "amount": loan_amount, "tenure": tenure},
            tool_output=bureau_data
        ))

        steps.append(AgentStepTrace(
            step_number=3,
            agent_name=self.name,
            action_type="SYNTHESIS",
            content=f"Calculated monthly EMI: ${bureau_data.get('monthly_emi_usd'):,.2f}/mo at {bureau_data.get('interest_rate_pct')}% annual interest."
        ))

        return AgentExecutionResult(
            agent_name=self.name,
            status="SUCCESS",
            data=bureau_data,
            steps=steps
        )
