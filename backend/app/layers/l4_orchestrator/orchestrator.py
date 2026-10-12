from typing import List, Optional
from app.schemas.agents import AgentTrajectoryResponse, AgentCatalogItem
from app.layers.l4_orchestrator.supervisor import supervisor

class MultiAgentOrchestrator:
    """
    Layer 4: Multi-Agent Orchestrator.
    Supervisor engine coordinating all 9 specialized agents:
    1. Customer Agent
    2. Banking Product Agent
    3. Risk/Fraud Agent
    4. Credit Agent
    5. Compliance Agent
    6. Financial Advisory Agent
    7. Research Agent
    8. Document Agent
    9. Notification Agent
    """
    
    @classmethod
    def get_agent_catalog(cls) -> List[AgentCatalogItem]:
        return [
            AgentCatalogItem(
                id="SUPERVISOR",
                name="Supervisor / Agent Orchestrator",
                role="Intent Classification, Decomposition & Routing",
                avatar="🧠",
                description="Coordinates task DAGs, enforces policy constraints, and manages consensus.",
                layer=4,
                assigned_model="gemini-2.5-pro-experimental",
                capabilities=["Intent Classification", "Task Decomposition", "Error Recovery", "Consensus"],
                status="ONLINE",
                metrics={"accuracy": 99.4, "avg_latency_ms": 45}
            ),
            AgentCatalogItem(
                id="CUSTOMER_AGENT",
                name="Customer Agent",
                role="Customer Profile & Customer 360",
                avatar="👤",
                description="Fetches KYC tiers, relationship tenure, and linked accounts.",
                layer=4,
                assigned_model="gemini-2.0-flash-thinking-exp",
                capabilities=["Customer 360", "KYC Verification", "Profile Retrieval"],
                status="ONLINE",
                metrics={"accuracy": 98.9, "avg_latency_ms": 32}
            ),
            AgentCatalogItem(
                id="BANKING_PRODUCT_AGENT",
                name="Banking Product Agent",
                role="Savings, Accounts, Cards & Term Deposits",
                avatar="🏦",
                description="Explores banking product rules, interest matrices, and account tier features.",
                layer=4,
                assigned_model="gemini-2.5-flash-experimental",
                capabilities=["Product Rules", "Savings Tiers", "Fee Matrices"],
                status="ONLINE",
                metrics={"accuracy": 98.5, "avg_latency_ms": 28}
            ),
            AgentCatalogItem(
                id="RISK_FRAUD_AGENT",
                name="Risk / Fraud Agent",
                role="Anomaly Detection & Geolocation Velocity",
                avatar="🚨",
                description="Scores transactions for behavioral anomalies, rapid-fire velocity, and impossible travel.",
                layer=4,
                assigned_model="gemini-2.5-flash-experimental",
                capabilities=["Velocity Checks", "Anomaly Scoring", "Account Freeze Trigger"],
                status="ONLINE",
                metrics={"accuracy": 99.2, "avg_latency_ms": 40}
            ),
            AgentCatalogItem(
                id="CREDIT_AGENT",
                name="Credit Agent",
                role="Bureau Analytics & Loan Underwriting",
                avatar="💳",
                description="Queries credit bureau scores, verifies DTI ratios, and calculates monthly amortizations.",
                layer=4,
                assigned_model="gemini-2.5-pro-experimental",
                capabilities=["Credit Scoring", "Underwriting Matrix", "EMI Calculation"],
                status="ONLINE",
                metrics={"accuracy": 97.8, "avg_latency_ms": 55}
            ),
            AgentCatalogItem(
                id="COMPLIANCE_AGENT",
                name="Compliance Agent",
                role="KYC/AML & OFAC Sanctions Screening",
                avatar="⚖️",
                description="Checks international watchlists, regulatory thresholds, and files mandatory SAR/CTR.",
                layer=4,
                assigned_model="gemini-2.5-pro-experimental",
                capabilities=["OFAC Screening", "FATF Rules RAG", "CTR/SAR Filing"],
                status="ONLINE",
                metrics={"accuracy": 99.7, "avg_latency_ms": 50}
            ),
            AgentCatalogItem(
                id="FINANCIAL_ADVISORY_AGENT",
                name="Financial Advisory Agent",
                role="Wealth Management & Yield Optimization",
                avatar="📊",
                description="Analyzes cashflow cushions and recommends yield-maximizing term deposits.",
                layer=4,
                assigned_model="gemini-2.0-flash-thinking-exp",
                capabilities=["Cashflow Analytics", "Term Deposit Advisory", "Portfolio Risk"],
                status="ONLINE",
                metrics={"accuracy": 96.5, "avg_latency_ms": 48}
            ),
            AgentCatalogItem(
                id="RESEARCH_AGENT",
                name="Research Agent",
                role="Economic Analysis & Market Insights",
                avatar="🔍",
                description="Tracks macro interest rate trajectories and competitive benchmark yields.",
                layer=4,
                assigned_model="gemini-2.0-flash-thinking-exp",
                capabilities=["Macro Trends", "Benchmark Tracking", "Market Insights"],
                status="ONLINE",
                metrics={"accuracy": 95.8, "avg_latency_ms": 60}
            ),
            AgentCatalogItem(
                id="DOCUMENT_AGENT",
                name="Document Agent",
                role="Document Processing & OCR Verification",
                avatar="📄",
                description="Validates income statements, tax documents, and biometric records.",
                layer=4,
                assigned_model="gemini-2.5-flash-experimental",
                capabilities=["OCR Validation", "Document Verification", "Tax Audit"],
                status="ONLINE",
                metrics={"accuracy": 98.1, "avg_latency_ms": 42}
            ),
            AgentCatalogItem(
                id="NOTIFICATION_AGENT",
                name="Notification Agent",
                role="Multi-Channel Dispatch & Critical Alerts",
                avatar="🔔",
                description="Delivers SMS, Push Notifications, and Emails with delivery receipts.",
                layer=4,
                assigned_model="gemini-2.0-flash-thinking-exp",
                capabilities=["Multi-Channel Broadcast", "Emergency Alerts", "Receipt Generation"],
                status="ONLINE",
                metrics={"accuracy": 100.0, "avg_latency_ms": 18}
            ),
        ]

    @classmethod
    async def orchestrate(
        cls,
        prompt: str,
        channel: str = "WEB",
        account_number: str = "ACC-1002341",
        customer_id: str = "CUST-8801",
        model_override: Optional[str] = None
    ) -> AgentTrajectoryResponse:
        """
        Executes multi-agent DAG workflow via the supervisor engine.
        """
        return await supervisor.orchestrate(
            prompt=prompt,
            channel=channel,
            account_number=account_number,
            customer_id=customer_id,
            model_override=model_override
        )
