from typing import Dict, Any
from app.layers.l4_orchestrator.base_agent import BaseAgent, AgentContract, AgentExecutionResult, AgentStepTrace
from app.layers.l5_mcp_tools.tool_registry import MCPToolRegistry

class ComplianceAgent(BaseAgent):
    def __init__(self):
        super().__init__(AgentContract(
            name="COMPLIANCE_AGENT",
            role="Regulatory Compliance, KYC/AML & OFAC Screening",
            responsibility="Enforces FATF Travel Rule, Basel III compliance, screens OFAC SDN watchlists, and manages compliance cases.",
            authorized_tools=["screen_aml_sanctions", "search_regulatory_rag"],
            input_schema={"entity_name": "str", "query": "Optional[str]"},
            output_schema={"sanctions_match": "bool", "citations": "str", "compliance_verdict": "str"}
        ))

    async def execute(self, shared_state: Dict[str, Any], **kwargs) -> AgentExecutionResult:
        steps = []
        entity = str(shared_state.get("counterparty_name", shared_state.get("entity_name", "Nassau Maritime Holdings Ltd")))
        rag_query = str(shared_state.get("regulatory_query", "AML KYC"))

        steps.append(AgentStepTrace(
            step_number=1,
            agent_name=self.name,
            action_type="THINK",
            content=f"Initiating sanctions screening on entity '{entity}' and verifying FATF compliance requirements."
        ))

        # Tool 1: OFAC Sanctions screening
        ok1, aml_data = MCPToolRegistry.execute_tool(
            "screen_aml_sanctions",
            {"entity_name": entity},
            invoking_agent=self.name
        )

        steps.append(AgentStepTrace(
            step_number=2,
            agent_name=self.name,
            action_type="TOOL_CALL",
            content=f"Screened OFAC SDN & PEP watchlists for '{entity}': Matched={aml_data.get('matched', False)}.",
            tool_name="screen_aml_sanctions",
            tool_input={"entity_name": entity},
            tool_output=aml_data
        ))

        # Tool 2: Regulatory RAG citations
        ok2, rag_data = MCPToolRegistry.execute_tool(
            "search_regulatory_rag",
            {"query": rag_query},
            invoking_agent=self.name
        )

        steps.append(AgentStepTrace(
            step_number=3,
            agent_name=self.name,
            action_type="TOOL_CALL",
            content=f"Retrieved statutory citations for query '{rag_query}'.",
            tool_name="search_regulatory_rag",
            tool_input={"query": rag_query},
            tool_output=rag_data
        ))

        is_flagged = aml_data.get("matched", False)

        return AgentExecutionResult(
            agent_name=self.name,
            status="ESCALATED" if is_flagged else "SUCCESS",
            data={
                "sanctions_screening": aml_data,
                "regulatory_citations": rag_data.get("regulatory_citations", ""),
                "compliance_verdict": "FLAGGED_FOR_SAR" if is_flagged else "CLEAN_PASS"
            },
            steps=steps
        )
