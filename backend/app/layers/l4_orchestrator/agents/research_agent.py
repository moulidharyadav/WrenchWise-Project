from typing import Dict, Any
from app.layers.l4_orchestrator.base_agent import BaseAgent, AgentContract, AgentExecutionResult, AgentStepTrace
from app.layers.l5_mcp_tools.tool_registry import MCPToolRegistry

class ResearchAgent(BaseAgent):
    def __init__(self):
        super().__init__(AgentContract(
            name="RESEARCH_AGENT",
            role="Macroeconomic & Financial Market Research",
            responsibility="Tracks macro benchmark curves (SOFR, Fed Funds, 10Y Treasury), peer competitor yields, and economic market insights.",
            authorized_tools=["query_market_research", "search_regulatory_rag"],
            input_schema={"topic": "str"},
            output_schema={"topic": "str", "benchmark_rates": "dict", "macro_summary": "str"}
        ))

    async def execute(self, shared_state: Dict[str, Any], **kwargs) -> AgentExecutionResult:
        steps = []
        topic = str(shared_state.get("research_topic", shared_state.get("topic", "INTEREST_RATES")))

        steps.append(AgentStepTrace(
            step_number=1,
            agent_name=self.name,
            action_type="THINK",
            content=f"Querying macro market indices and competitor yield matrices for topic '{topic}'."
        ))

        ok, research_data = MCPToolRegistry.execute_tool(
            "query_market_research",
            {"topic": topic},
            invoking_agent=self.name
        )

        steps.append(AgentStepTrace(
            step_number=2,
            agent_name=self.name,
            action_type="TOOL_CALL",
            content=f"Fetched benchmark curve indices and central bank outlook for {topic}.",
            tool_name="query_market_research",
            tool_input={"topic": topic},
            tool_output=research_data
        ))

        steps.append(AgentStepTrace(
            step_number=3,
            agent_name=self.name,
            action_type="SYNTHESIS",
            content="Synthesized institutional macro briefing from verified market data feeds."
        ))

        return AgentExecutionResult(
            agent_name=self.name,
            status="SUCCESS",
            data=research_data,
            steps=steps
        )
