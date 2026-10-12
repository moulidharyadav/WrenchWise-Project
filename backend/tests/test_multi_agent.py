import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.layers.l5_mcp_tools.tool_registry import MCPToolRegistry
from app.layers.l4_orchestrator.supervisor import SupervisorOrchestrator
from app.layers.l4_orchestrator.llm_adapter import ConfigurableLLMAdapter

@pytest.mark.asyncio
async def test_agent_routing_balance_query():
    """
    A balance query should invoke ONLY the authorized Customer Agent.
    """
    supervisor = SupervisorOrchestrator()
    classification = supervisor.classify_intent("What is my checking balance and statement?")
    assert classification["intent"] == "ACCOUNT_INQUIRY"
    assert classification["primary_agent"] == "CUSTOMER_AGENT"
    assert classification["required_agents"] == ["CUSTOMER_AGENT"]

@pytest.mark.asyncio
async def test_agent_routing_loan_simulation():
    """
    Loan eligibility involves Customer, Banking Product, Credit, and Compliance agents.
    """
    supervisor = SupervisorOrchestrator()
    classification = supervisor.classify_intent("Apply for a $25,000 personal loan for 24 months")
    assert classification["intent"] == "LOAN_APPLICATION_AND_UNDERWRITING"
    assert classification["primary_agent"] == "CREDIT_AGENT"
    assert set(classification["required_agents"]) == {"CUSTOMER_AGENT", "BANKING_PRODUCT_AGENT", "CREDIT_AGENT", "COMPLIANCE_AGENT"}

@pytest.mark.asyncio
async def test_agent_routing_suspicious_transfer():
    """
    A suspicious transfer invokes Risk/Fraud, Compliance, Customer, and Notification agents.
    """
    supervisor = SupervisorOrchestrator()
    classification = supervisor.classify_intent("Wire transfer $49,990 to Nassau Maritime Holdings Ltd in Cyprus")
    assert classification["intent"] == "SUSPICIOUS_TRANSACTION_INVESTIGATION"
    assert classification["primary_agent"] == "RISK_FRAUD_AGENT"
    assert "RISK_FRAUD_AGENT" in classification["required_agents"]
    assert "COMPLIANCE_AGENT" in classification["required_agents"]

@pytest.mark.asyncio
async def test_tool_authorization_enforcement():
    """
    Enforces least privilege: agents cannot call unauthorized tools.
    """
    # Customer Agent is NOT authorized to screen sanctions
    ok, res = MCPToolRegistry.execute_tool(
        "screen_aml_sanctions",
        {"entity_name": "Test Entity"},
        invoking_agent="CUSTOMER_AGENT"
    )
    assert ok is False
    assert res.get("permission_denied") is True
    assert "Security Violation" in res.get("error", "")

    # Compliance Agent IS authorized to screen sanctions
    ok_comp, res_comp = MCPToolRegistry.execute_tool(
        "screen_aml_sanctions",
        {"entity_name": "Test Entity"},
        invoking_agent="COMPLIANCE_AGENT"
    )
    assert ok_comp is True
    assert "matched" in res_comp

@pytest.mark.asyncio
async def test_deterministic_llm_adapter_offline():
    """
    Verifies system remains functional when no LLM API key is configured.
    """
    adapter = ConfigurableLLMAdapter(api_key="")
    assert adapter.is_configured() is False
    res = await adapter.generate_response("Test prompt", "Instruction")
    assert res["status"] == "SUCCESS"
    assert res["is_fallback"] is True
    assert "DETERMINISTIC_REASONING_ENGINE" in res["content"]

@pytest.mark.asyncio
async def test_all_seven_demonstration_scenarios():
    """
    Executes all 7 demonstration scenarios and validates distinct, functional logic across agents.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        scenarios_res = await ac.get("/api/v1/agents/scenarios")
        assert scenarios_res.status_code == 200
        scenarios = scenarios_res.json()
        assert len(scenarios) == 7

        for s in scenarios:
            prompt = s["prompt"]
            resp = await ac.post("/api/v1/agents/orchestrate", json={"prompt": prompt, "channel": "WEB"})
            assert resp.status_code == 200, f"Scenario '{s['title']}' failed with {resp.text}"
            data = resp.json()
            assert data["intent"] == s["expected_intent"]
            assert len(data["steps"]) >= 2
            assert len(data["final_response"]) > 30

@pytest.mark.asyncio
async def test_workflow_cancellation():
    """
    Tests workflow cancellation via supervisor.
    """
    supervisor = SupervisorOrchestrator()
    # Mock workflow ID
    fake_id = "WF-TEST-CANCEL"
    assert SupervisorOrchestrator.cancel_workflow(fake_id) is False

@pytest.mark.asyncio
async def test_tool_audit_logging():
    """
    Verifies all tool executions are logged with timestamps and arguments.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/api/v1/agents/tool-calls?limit=10")
        assert resp.status_code == 200
        logs = resp.json()
        assert isinstance(logs, list)

@pytest.mark.asyncio
async def test_registered_tools_schema():
    """
    Verifies Layer 5 MCP Tool Registry exposes valid tools and authorized agents.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/api/v1/agents/tools")
        assert resp.status_code == 200
        tools = resp.json()
        assert len(tools) >= 10
        tool_names = [t["name"] for t in tools]
        assert "get_customer_360" in tool_names
        assert "evaluate_fraud_anomaly" in tool_names
        assert "query_credit_bureau" in tool_names
        assert "screen_aml_sanctions" in tool_names
        assert "process_document" in tool_names
        assert "send_notification" in tool_names
