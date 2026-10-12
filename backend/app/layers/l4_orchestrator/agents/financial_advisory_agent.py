from typing import Dict, Any
from app.layers.l4_orchestrator.base_agent import BaseAgent, AgentContract, AgentExecutionResult, AgentStepTrace
from app.layers.l5_mcp_tools.tool_registry import MCPToolRegistry

class FinancialAdvisoryAgent(BaseAgent):
    def __init__(self):
        super().__init__(AgentContract(
            name="FINANCIAL_ADVISORY_AGENT",
            role="Wealth Advisory & Educational Financial Planning",
            responsibility="Formulates liquidity cushion models, term deposit optimization, and educational guidance with statutory disclaimers.",
            authorized_tools=["generate_advisory_plan", "get_account_balances"],
            input_schema={"liquid_balance": "float", "horizon_months": "int"},
            output_schema={"recommended_allocation": "dict", "projected_annual_yield_usd": "float", "disclaimer": "str"}
        ))

    async def execute(self, shared_state: Dict[str, Any], **kwargs) -> AgentExecutionResult:
        steps = []
        liquid_balance = float(shared_state.get("liquid_balance", 48500.50))
        horizon = int(shared_state.get("horizon_months", 12))

        steps.append(AgentStepTrace(
            step_number=1,
            agent_name=self.name,
            action_type="THINK",
            content=f"Modeling liquid cash reserves of ${liquid_balance:,.2f} over a {horizon}-month horizon."
        ))

        ok, plan_data = MCPToolRegistry.execute_tool(
            "generate_advisory_plan",
            {
                "liquid_balance": liquid_balance,
                "horizon_months": horizon
            },
            invoking_agent=self.name
        )

        steps.append(AgentStepTrace(
            step_number=2,
            agent_name=self.name,
            action_type="TOOL_CALL",
            content="Generated recommended cashflow buffer and high-yield fixed certificate allocations.",
            tool_name="generate_advisory_plan",
            tool_input={"liquid_balance": liquid_balance, "horizon_months": horizon},
            tool_output=plan_data
        ))

        steps.append(AgentStepTrace(
            step_number=3,
            agent_name=self.name,
            action_type="SYNTHESIS",
            content=f"Projected surplus yield of +${plan_data.get('projected_annual_yield_usd'):,.2f} USD. Enforcing fiduciary non-advisory disclaimer."
        ))

        return AgentExecutionResult(
            agent_name=self.name,
            status="SUCCESS",
            data=plan_data,
            steps=steps
        )
