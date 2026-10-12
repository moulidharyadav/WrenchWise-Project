from typing import Dict, Any
from app.layers.l4_orchestrator.base_agent import BaseAgent, AgentContract, AgentExecutionResult, AgentStepTrace
from app.layers.l5_mcp_tools.tool_registry import MCPToolRegistry

class BankingProductAgent(BaseAgent):
    def __init__(self):
        super().__init__(AgentContract(
            name="BANKING_PRODUCT_AGENT",
            role="Banking Product Discovery & Rules",
            responsibility="Queries savings tiers, credit card features, personal/mortgage loan terms, term deposits, and insurance.",
            authorized_tools=["query_banking_products"],
            input_schema={"category": "Optional[str]"},
            output_schema={"catalog": "list", "recommended_product": "dict"}
        ))

    async def execute(self, shared_state: Dict[str, Any], **kwargs) -> AgentExecutionResult:
        steps = []
        category = shared_state.get("product_category", "ALL")

        steps.append(AgentStepTrace(
            step_number=1,
            agent_name=self.name,
            action_type="THINK",
            content=f"Searching banking product catalog for category '{category}' and matching tier benefits."
        ))

        ok, product_data = MCPToolRegistry.execute_tool(
            "query_banking_products",
            {"category": category},
            invoking_agent=self.name
        )

        steps.append(AgentStepTrace(
            step_number=2,
            agent_name=self.name,
            action_type="TOOL_CALL",
            content="Invoked product catalog registry API.",
            tool_name="query_banking_products",
            tool_input={"category": category},
            tool_output=product_data
        ))

        products = product_data.get("products", [])
        featured = products[0] if products else None

        steps.append(AgentStepTrace(
            step_number=3,
            agent_name=self.name,
            action_type="SYNTHESIS",
            content=f"Identified {len(products)} active banking products matching criteria."
        ))

        return AgentExecutionResult(
            agent_name=self.name,
            status="SUCCESS",
            data={
                "products_found": products,
                "featured_product": featured
            },
            steps=steps
        )
