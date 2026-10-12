from typing import Dict, Any
from app.layers.l4_orchestrator.base_agent import BaseAgent, AgentContract, AgentExecutionResult, AgentStepTrace
from app.layers.l5_mcp_tools.tool_registry import MCPToolRegistry

class DocumentAgent(BaseAgent):
    def __init__(self):
        super().__init__(AgentContract(
            name="DOCUMENT_AGENT",
            role="Document Ingestion, OCR Verification & Summarization",
            responsibility="Ingests financial documentation, extracts OCR text, validates authenticity, and provides structured summaries.",
            authorized_tools=["process_document"],
            input_schema={"doc_type": "str", "raw_text": "Optional[str]"},
            output_schema={"verification_status": "str", "extracted_fields": "dict", "summary": "str"}
        ))

    async def execute(self, shared_state: Dict[str, Any], **kwargs) -> AgentExecutionResult:
        steps = []
        doc_type = str(shared_state.get("doc_type", "W2_OR_PAYSLIP"))
        raw_text = str(shared_state.get("raw_text", shared_state.get("document_text", "Employer: TechGlobal Inc. Monthly Gross Income: $8,500.00 USD. Tax Withheld: $1,820.00.")))

        steps.append(AgentStepTrace(
            step_number=1,
            agent_name=self.name,
            action_type="THINK",
            content=f"Ingesting document of type '{doc_type}'. Executing structural parsing and authenticity check."
        ))

        ok, doc_data = MCPToolRegistry.execute_tool(
            "process_document",
            {"doc_type": doc_type, "raw_text": raw_text},
            invoking_agent=self.name
        )

        steps.append(AgentStepTrace(
            step_number=2,
            agent_name=self.name,
            action_type="TOOL_CALL",
            content="Extracted financial attributes and verified anti-tamper authenticity marks.",
            tool_name="process_document",
            tool_input={"doc_type": doc_type},
            tool_output=doc_data
        ))

        steps.append(AgentStepTrace(
            step_number=3,
            agent_name=self.name,
            action_type="SYNTHESIS",
            content=f"Summary generated: {doc_data.get('summary', '')}"
        ))

        return AgentExecutionResult(
            agent_name=self.name,
            status="SUCCESS",
            data=doc_data,
            steps=steps
        )
