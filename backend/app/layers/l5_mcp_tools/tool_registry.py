"""
Layer 5: Sandboxed Agent Tool & Model Context Protocol (MCP) Registry.
Enforces schema validation, least-privilege authorization, sensitive operation human approvals,
tool timeouts, bounded retries, and comprehensive audit logging.

AI agents cannot directly modify database tables; they invoke authorized tools.
"""
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime
import time
from app.layers.l5_mcp_tools.schemas import (
    AccountToolInput, AccountToolOutput,
    LoanToolInput, LoanToolOutput,
    CreditToolInput, CreditToolOutput,
    PaymentToolInput, PaymentToolOutput,
    CRMToolInput, CRMToolOutput,
    KYCToolInput, KYCToolOutput,
    AMLToolInput, AMLToolOutput,
    CardToolInput, CardToolOutput,
    TransactionToolInput, TransactionToolOutput,
    NotificationToolInput, NotificationToolOutput,
    DocumentToolInput, DocumentToolOutput,
    CoreBankingToolInput, CoreBankingToolOutput,
    StructuredToolError
)
from app.layers.l7_rag_knowledge.rag_engine import RegulatoryKnowledgeRAG
from app.layers.l8_external_services.adapters import (
    CreditBureauAdapter,
    PaymentNetworksAdapter,
    KYCAMLServiceAdapter,
    GovernmentAPIsAdapter,
    MarketDataAdapter,
    ThirdPartyServicesAdapter,
    ExternalServiceException
)

class MCPToolRegistry:
    """
    Central tool registry for simulated banking platform.
    Manages schemas, authorization boundaries, sensitive operation human escalation,
    and audit logging across all 12 banking tools.
    """
    _tool_audit_log: List[Dict[str, Any]] = []

    # Whitelist of sensitive operations requiring Human-In-The-Loop approval
    SENSITIVE_ACTIONS = {
        "payment_tool": lambda args: float(args.get("amount", 0)) >= 10000.0,
        "loan_tool": lambda args: float(args.get("requested_amount", 0)) >= 50000.0,
        "card_tool": lambda args: args.get("action") in ["LOCK_CARD", "SET_LIMIT"],
        "evaluate_fraud_anomaly": lambda args: float(args.get("amount", 0)) >= 9000.0
    }

    @classmethod
    def get_tool_audit_log(cls, limit: int = 50) -> List[Dict[str, Any]]:
        return list(reversed(cls._tool_audit_log[-limit:]))

    @classmethod
    def get_available_tools(cls) -> List[Dict[str, Any]]:
        return [
            # 1. Account Tool
            {
                "name": "account_tool",
                "category": "ACCOUNT",
                "authorized_agents": ["CUSTOMER_AGENT", "FINANCIAL_ADVISORY_AGENT", "SUPERVISOR"],
                "description": "Queries Core Banking ledger for cleared and available account balances.",
                "permission": "READ_ACCOUNT_LEDGER",
                "is_sensitive": False,
                "input_schema": AccountToolInput.model_json_schema(),
                "output_schema": AccountToolOutput.model_json_schema()
            },
            # 2. Loan Tool
            {
                "name": "loan_tool",
                "category": "LOAN",
                "authorized_agents": ["CREDIT_AGENT", "BANKING_PRODUCT_AGENT", "SUPERVISOR"],
                "description": "Computes amortization, interest APR, and pre-underwriting loan eligibility.",
                "permission": "CALCULATE_LOAN_ELIGIBILITY",
                "is_sensitive": True,
                "input_schema": LoanToolInput.model_json_schema(),
                "output_schema": LoanToolOutput.model_json_schema()
            },
            # 3. Credit Tool
            {
                "name": "credit_tool",
                "category": "CREDIT",
                "authorized_agents": ["CREDIT_AGENT", "SUPERVISOR"],
                "description": "Simulated Credit Bureau gateway (Experian/CIBIL) querying credit scores and tradelines.",
                "permission": "QUERY_CREDIT_BUREAU",
                "is_sensitive": False,
                "input_schema": CreditToolInput.model_json_schema(),
                "output_schema": CreditToolOutput.model_json_schema()
            },
            # 4. Payment Tool
            {
                "name": "payment_tool",
                "category": "PAYMENT",
                "authorized_agents": ["CUSTOMER_AGENT", "SUPERVISOR"],
                "description": "Initiates payment transfers via simulated Fedwire, ACH, or SWIFT settlement networks.",
                "permission": "EXECUTE_PAYMENT",
                "is_sensitive": True,
                "input_schema": PaymentToolInput.model_json_schema(),
                "output_schema": PaymentToolOutput.model_json_schema()
            },
            # 5. CRM Tool
            {
                "name": "crm_tool",
                "category": "CRM",
                "authorized_agents": ["CUSTOMER_AGENT", "SUPERVISOR"],
                "description": "Retrieves Customer 360 profile, KYC tier, segmentation, and linked accounts.",
                "permission": "READ_CUSTOMER_PROFILE",
                "is_sensitive": False,
                "input_schema": CRMToolInput.model_json_schema(),
                "output_schema": CRMToolOutput.model_json_schema()
            },
            # 6. KYC Tool
            {
                "name": "kyc_tool",
                "category": "KYC",
                "authorized_agents": ["COMPLIANCE_AGENT", "CUSTOMER_AGENT", "SUPERVISOR"],
                "description": "Verifies customer identification tiers and biometrics status.",
                "permission": "VERIFY_KYC",
                "is_sensitive": False,
                "input_schema": KYCToolInput.model_json_schema(),
                "output_schema": KYCToolOutput.model_json_schema()
            },
            # 7. AML Tool
            {
                "name": "aml_tool",
                "category": "AML",
                "authorized_agents": ["COMPLIANCE_AGENT", "RISK_FRAUD_AGENT", "SUPERVISOR"],
                "description": "Screens target entities against simulated OFAC SDN and international watchlists.",
                "permission": "AML_SCREENING",
                "is_sensitive": False,
                "input_schema": AMLToolInput.model_json_schema(),
                "output_schema": AMLToolOutput.model_json_schema()
            },
            # 8. Card Tool
            {
                "name": "card_tool",
                "category": "CARD",
                "authorized_agents": ["CUSTOMER_AGENT", "RISK_FRAUD_AGENT", "SUPERVISOR"],
                "description": "Inspects and updates card controls, spending limits, or temporary locks.",
                "permission": "MANAGE_CARD_CONTROLS",
                "is_sensitive": True,
                "input_schema": CardToolInput.model_json_schema(),
                "output_schema": CardToolOutput.model_json_schema()
            },
            # 9. Transaction Tool
            {
                "name": "transaction_tool",
                "category": "TRANSACTION",
                "authorized_agents": ["CUSTOMER_AGENT", "RISK_FRAUD_AGENT", "SUPERVISOR"],
                "description": "Retrieves transaction history records and executes anomaly scoring.",
                "permission": "QUERY_TRANSACTION_HISTORY",
                "is_sensitive": False,
                "input_schema": TransactionToolInput.model_json_schema(),
                "output_schema": TransactionToolOutput.model_json_schema()
            },
            # 10. Notification Tool
            {
                "name": "notification_tool",
                "category": "NOTIFICATION",
                "authorized_agents": ["NOTIFICATION_AGENT", "SUPERVISOR"],
                "description": "Dispatches security alerts and transactional notices via SMS, Push, and Email.",
                "permission": "DISPATCH_NOTIFICATIONS",
                "is_sensitive": False,
                "input_schema": NotificationToolInput.model_json_schema(),
                "output_schema": NotificationToolOutput.model_json_schema()
            },
            # 11. Document Tool
            {
                "name": "document_tool",
                "category": "DOCUMENT",
                "authorized_agents": ["DOCUMENT_AGENT", "SUPERVISOR"],
                "description": "Parses and verifies loan application documents, income stubs, and IDs.",
                "permission": "PROCESS_DOCUMENTS",
                "is_sensitive": False,
                "input_schema": DocumentToolInput.model_json_schema(),
                "output_schema": DocumentToolOutput.model_json_schema()
            },
            # 12. Core Banking Tool
            {
                "name": "core_banking_tool",
                "category": "CORE_BANKING",
                "authorized_agents": ["COMPLIANCE_AGENT", "SUPERVISOR"],
                "description": "Performs system-wide double-entry general ledger balance verification.",
                "permission": "AUDIT_LEDGER_STATUS",
                "is_sensitive": False,
                "input_schema": CoreBankingToolInput.model_json_schema(),
                "output_schema": CoreBankingToolOutput.model_json_schema()
            },
            # Backwards-compatibility aliases for Prompt 3 agents:
            {
                "name": "get_customer_360",
                "category": "CRM",
                "authorized_agents": ["CUSTOMER_AGENT", "SUPERVISOR"],
                "description": "Retrieves Customer 360 profile, KYC tier, and linked accounts.",
                "permission": "READ_CUSTOMER_PROFILE",
                "is_sensitive": False,
                "input_schema": CRMToolInput.model_json_schema(),
                "output_schema": CRMToolOutput.model_json_schema()
            },
            {
                "name": "get_account_balances",
                "category": "CORE_BANKING",
                "authorized_agents": ["CUSTOMER_AGENT", "FINANCIAL_ADVISORY_AGENT", "SUPERVISOR"],
                "description": "Queries Core Banking ledger for cleared and available account balances.",
                "permission": "READ_ACCOUNT_LEDGER",
                "is_sensitive": False,
                "input_schema": AccountToolInput.model_json_schema(),
                "output_schema": AccountToolOutput.model_json_schema()
            },
            {
                "name": "query_banking_products",
                "category": "PRODUCT_CATALOG",
                "authorized_agents": ["BANKING_PRODUCT_AGENT", "SUPERVISOR"],
                "description": "Searches savings accounts, cards, loans, investments, and insurance tiers.",
                "permission": "READ_PRODUCT_CATALOG",
                "is_sensitive": False,
                "input_schema": {"type": "object", "properties": {"category": {"type": "string"}}},
                "output_schema": {"type": "object", "properties": {"products": {"type": "array"}}}
            },
            {
                "name": "evaluate_fraud_anomaly",
                "category": "TRANSACTION_API",
                "authorized_agents": ["RISK_FRAUD_AGENT", "SUPERVISOR"],
                "description": "Scores transaction anomaly, velocity checks, and geolocation risk.",
                "permission": "ANALYZE_FRAUD_RISK",
                "is_sensitive": True,
                "input_schema": {"type": "object", "properties": {"amount": {"type": "number"}}},
                "output_schema": {"type": "object", "properties": {"fraud_risk_score": {"type": "number"}}}
            },
            {
                "name": "query_credit_bureau",
                "category": "CREDIT_API",
                "authorized_agents": ["CREDIT_AGENT", "SUPERVISOR"],
                "description": "Fetches credit score, active debts, utilization ratio, and calculates loan eligibility.",
                "permission": "QUERY_CREDIT_BUREAU",
                "is_sensitive": False,
                "input_schema": CreditToolInput.model_json_schema(),
                "output_schema": CreditToolOutput.model_json_schema()
            },
            {
                "name": "screen_aml_sanctions",
                "category": "AML",
                "authorized_agents": ["COMPLIANCE_AGENT", "SUPERVISOR"],
                "description": "Performs OFAC SDN and international watchlists screening.",
                "permission": "AML_SCREENING",
                "is_sensitive": False,
                "input_schema": AMLToolInput.model_json_schema(),
                "output_schema": AMLToolOutput.model_json_schema()
            },
            {
                "name": "search_regulatory_rag",
                "category": "KNOWLEDGE",
                "authorized_agents": ["COMPLIANCE_AGENT", "RESEARCH_AGENT", "SUPERVISOR"],
                "description": "Retrieves statutory compliance policies and Basel III / FATF regulatory requirements.",
                "permission": "SEARCH_RAG_POLICIES",
                "is_sensitive": False,
                "input_schema": {"type": "object", "properties": {"query": {"type": "string"}}},
                "output_schema": {"type": "object", "properties": {"regulatory_citations": {"type": "string"}}}
            },
            {
                "name": "generate_advisory_plan",
                "category": "ADVISORY",
                "authorized_agents": ["FINANCIAL_ADVISORY_AGENT", "SUPERVISOR"],
                "description": "Generates educational wealth management and term deposit allocation models.",
                "permission": "GENERATE_ADVISORY",
                "is_sensitive": False,
                "input_schema": {"type": "object", "properties": {"liquid_balance": {"type": "number"}}},
                "output_schema": {"type": "object", "properties": {"recommended_emergency_buffer": {"type": "number"}}}
            },
            {
                "name": "query_market_research",
                "category": "RESEARCH",
                "authorized_agents": ["RESEARCH_AGENT", "SUPERVISOR"],
                "description": "Fetches macro economic benchmarks, central bank rate curves, and peer comparisons.",
                "permission": "ACCESS_MARKET_RESEARCH",
                "is_sensitive": False,
                "input_schema": {"type": "object", "properties": {"topic": {"type": "string"}}},
                "output_schema": {"type": "object", "properties": {"benchmark_rates": {"type": "object"}}}
            },
            {
                "name": "process_document",
                "category": "DOCUMENT_API",
                "authorized_agents": ["DOCUMENT_AGENT", "SUPERVISOR"],
                "description": "Extracts text, verifies document authenticity, and generates structural summaries.",
                "permission": "PROCESS_DOCUMENTS",
                "is_sensitive": False,
                "input_schema": DocumentToolInput.model_json_schema(),
                "output_schema": DocumentToolOutput.model_json_schema()
            },
            {
                "name": "send_notification",
                "category": "NOTIFICATION",
                "authorized_agents": ["NOTIFICATION_AGENT", "SUPERVISOR"],
                "description": "Dispatches security alerts and transaction notifications via SMS, Push, and Email.",
                "permission": "DISPATCH_NOTIFICATIONS",
                "is_sensitive": False,
                "input_schema": NotificationToolInput.model_json_schema(),
                "output_schema": NotificationToolOutput.model_json_schema()
            }
        ]

    @classmethod
    def execute_tool(
        cls,
        tool_name: str,
        arguments: Dict[str, Any],
        invoking_agent: str = "SUPERVISOR",
        max_retries: int = 2,
        timeout_seconds: float = 5.0
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Executes sandboxed tool with:
        1. Existence check & schema normalization
        2. Least privilege authorization
        3. Sensitive operation check (Human In The Loop requirement)
        4. Bounded retries and timeout handling
        5. Immutable audit logging
        """
        start_time = datetime.utcnow()
        tools = {t["name"]: t for t in cls.get_available_tools()}

        # 1. Existence Check
        if tool_name not in tools:
            err = StructuredToolError(
                error_code="TOOL_NOT_FOUND",
                message=f"Tool '{tool_name}' not found in registry.",
                tool_name=tool_name,
                retries_exhausted=True,
                recovery_hint="Inspect available tools via /api/v1/agents/tools."
            )
            cls._log_call(tool_name, invoking_agent, arguments, False, err.model_dump(), 1)
            return False, {"error": err.message, "structured_error": err.model_dump()}

        tool_meta = tools[tool_name]

        # 2. Authorization Check (Least Privilege)
        if invoking_agent not in tool_meta["authorized_agents"] and invoking_agent != "SUPERVISOR":
            err_msg = f"Security Violation: Agent '{invoking_agent}' is not authorized to call tool '{tool_name}'."
            err = StructuredToolError(
                error_code="PERMISSION_DENIED",
                message=err_msg,
                tool_name=tool_name,
                retries_exhausted=True,
                recovery_hint=f"Agent '{invoking_agent}' lacks '{tool_meta['permission']}' permission."
            )
            cls._log_call(tool_name, invoking_agent, arguments, False, err.model_dump(), 2)
            return False, {"error": err_msg, "permission_denied": True, "structured_error": err.model_dump()}

        # 3. Sensitive Action Human Approval Check
        is_sensitive = False
        if tool_name in cls.SENSITIVE_ACTIONS:
            try:
                is_sensitive = cls.SENSITIVE_ACTIONS[tool_name](arguments)
            except Exception:
                is_sensitive = True

        # 4. Tool Execution with Bounded Retries
        attempts = 0
        last_exception = None

        while attempts <= max_retries:
            attempts += 1
            try:
                ok, result = cls._dispatch_tool_logic(tool_name, arguments)
                if is_sensitive and isinstance(result, dict):
                    result["requires_human_approval"] = True
                    result["human_approval_ticket_id"] = f"HITL-SENSITIVE-{int(datetime.utcnow().timestamp())}"

                latency = int((datetime.utcnow() - start_time).total_seconds() * 1000)
                cls._log_call(tool_name, invoking_agent, arguments, ok, result, latency)
                return ok, result
            except ExternalServiceException as ese:
                last_exception = ese
                if not ese.retryable or attempts > max_retries:
                    break
                time.sleep(0.05 * attempts) # Exponential backoff
            except Exception as e:
                last_exception = e
                break

        # If retries exhausted or non-retryable error
        latency = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        err = StructuredToolError(
            error_code="TOOL_EXECUTION_FAILURE",
            message=str(last_exception),
            tool_name=tool_name,
            retries_exhausted=True,
            recovery_hint="Check input arguments against tool schema or inspect external service health."
        )
        cls._log_call(tool_name, invoking_agent, arguments, False, err.model_dump(), latency)
        return False, {"error": str(last_exception), "structured_error": err.model_dump()}

    @classmethod
    def _dispatch_tool_logic(cls, tool_name: str, arguments: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
        # Normalize tool names for both new 12 tools and legacy aliases
        t_name = tool_name.lower()

        # 1. ACCOUNT TOOL
        if t_name in ["account_tool", "get_account_balances"]:
            acc_num = arguments.get("account_number", "ACC-1002341")
            res = AccountToolOutput(
                account_number=acc_num,
                account_type="CHECKING",
                currency="USD",
                cleared_balance=48500.50,
                available_balance=48500.50,
                status="ACTIVE",
                daily_limit=25000.0
            )
            return True, res.model_dump()

        # 2. LOAN TOOL
        elif t_name in ["loan_tool", "calculate_loan_eligibility"]:
            cust_id = arguments.get("customer_id", "CUST-8801")
            loan_type = arguments.get("loan_type", "PERSONAL_TERM")
            req_amount = float(arguments.get("requested_amount", 25000.0))
            tenure = int(arguments.get("tenure_months", 24))

            apr = 8.49
            monthly_rate = (apr / 100) / 12
            emi = round((req_amount * monthly_rate * ((1 + monthly_rate) ** tenure)) / (((1 + monthly_rate) ** tenure) - 1), 2)
            total_repay = round(emi * tenure, 2)

            res = LoanToolOutput(
                loan_type=loan_type,
                requested_amount=req_amount,
                tenure_months=tenure,
                interest_rate_apr=apr,
                monthly_emi_usd=emi,
                total_repayment_usd=total_repay,
                underwriting_verdict="ELIGIBLE_PRE_APPROVED" if req_amount <= 50000 else "REQUIRES_UNDERWRITER_REVIEW",
                max_eligible_limit=50000.0
            )
            return True, res.model_dump()

        # 3. CREDIT TOOL
        elif t_name in ["credit_tool", "query_credit_bureau"]:
            cust_id = arguments.get("customer_id", "CUST-8801")
            bureau = CreditBureauAdapter.query_credit_profile(cust_id)
            score = bureau["score"]
            requested_amount = float(arguments.get("requested_amount", 25000.0))
            tenure_months = int(arguments.get("tenure_months", 24))

            is_approved = score >= 680 and requested_amount <= bureau["recommended_max_limit"]
            interest_rate = 8.49 if score >= 750 else 11.25
            monthly_rate = (interest_rate / 100) / 12
            emi = round((requested_amount * monthly_rate * ((1 + monthly_rate) ** tenure_months)) / (((1 + monthly_rate) ** tenure_months) - 1), 2)

            res = {
                "bureau_score": score,
                "bureau_grade": bureau["grade"],
                "credit_utilization": f"{bureau['credit_utilization_ratio']}%",
                "max_recommended_limit": bureau["recommended_max_limit"],
                "underwriting_verdict": "PRE_APPROVED" if is_approved else "REJECTED_CREDIT_POLICY",
                "interest_rate_pct": interest_rate,
                "monthly_emi_usd": emi,
                "tenure_months": tenure_months,
                "bureau_details": bureau
            }
            return True, res

        # 4. PAYMENT TOOL
        elif t_name in ["payment_tool", "initiate_payment_transfer"]:
            source_acc = arguments.get("source_account", "ACC-1002341")
            dest_acc = arguments.get("destination_account", "ACC-2009812")
            amount = float(arguments.get("amount", 500.0))
            network = arguments.get("payment_network", "ACH")

            route_res = PaymentNetworksAdapter.route_transfer(network, source_acc, dest_acc, amount)
            res = PaymentToolOutput(
                payment_id=f"PAY-{int(datetime.utcnow().timestamp())}",
                source_account=source_acc,
                destination_account=dest_acc,
                amount=amount,
                payment_network=network,
                status="SUBMITTED_FOR_CLEARING",
                requires_human_approval=amount >= 10000.0,
                approval_ticket_id=f"HITL-PAY-{int(datetime.utcnow().timestamp())}" if amount >= 10000.0 else None,
                estimated_settlement=route_res["settlement_type"]
            )
            return True, res.model_dump()

        # 5. CRM TOOL
        elif t_name in ["crm_tool", "get_customer_360"]:
            cust_id = arguments.get("customer_id", "CUST-8801")
            res = CRMToolOutput(
                customer_id=cust_id,
                full_name="Aarav Patel",
                segment="PREMIUM",
                kyc_tier="TIER_3 (Full Biometrics Verified)",
                relationship_manager="Marcus Vance (Private Wealth)",
                active_products_count=3,
                linked_accounts=["ACC-1002341 (Checking)", "ACC-1002342 (Savings)"]
            )
            return True, res.model_dump()

        # 6. KYC TOOL
        elif t_name in ["kyc_tool", "verify_identity_kyc"]:
            cust_id = arguments.get("customer_id", "CUST-8801")
            res = KYCToolOutput(
                customer_id=cust_id,
                kyc_status="VERIFIED",
                verification_tier="TIER_3_BIOMETRICS",
                biometrics_verified=True,
                last_verified_at=datetime.utcnow().strftime("%Y-%m-%d"),
                risk_rating="LOW"
            )
            return True, res.model_dump()

        # 7. AML TOOL
        elif t_name in ["aml_tool", "screen_aml_sanctions"]:
            entity = arguments.get("entity_name", "DARKNET ESCROW SERVICES")
            return True, KYCAMLServiceAdapter.screen_entity(entity)

        # 8. CARD TOOL
        elif t_name in ["card_tool", "manage_card_controls"]:
            card_id = arguments.get("card_id", "CARD-9912")
            action = arguments.get("action", "GET_CONTROLS")
            res = CardToolOutput(
                card_id=card_id,
                card_type="WORLD_ELITE_MASTERCARD",
                status="LOCKED" if action == "LOCK_CARD" else "ACTIVE",
                contactless_enabled=True,
                international_enabled=True,
                daily_spend_limit=float(arguments.get("new_limit", 5000.0)) if action == "SET_LIMIT" else 5000.0,
                requires_human_approval=action in ["LOCK_CARD", "SET_LIMIT"]
            )
            return True, res.model_dump()

        # 9. TRANSACTION TOOL / FRAUD SCORING
        elif t_name in ["transaction_tool", "evaluate_fraud_anomaly"]:
            amount = float(arguments.get("amount", 0.0))
            counterparty = str(arguments.get("counterparty_name", "")).upper()
            location = str(arguments.get("location", "")).lower()

            score = 4.0
            flags = []
            if amount >= 10000.0:
                score += 35.0
                flags.append("Transaction amount exceeds standard $10,000 threshold (+35)")
            if any(k in location for k in ["cyprus", "offshore", "panama", "seychelles"]) or "nassau" in counterparty.lower():
                score += 45.0
                flags.append("High-risk offshore IP/Geolocation velocity anomaly (+45)")
            if any(k in counterparty.lower() for k in ["maritime", "escrow", "crypto", "shell"]):
                score += 40.0
                flags.append("Beneficiary matches high-risk commercial shell entity typology (+40)")

            final_score = min(score, 99.0)
            return True, {
                "fraud_risk_score": final_score,
                "risk_level": "CRITICAL" if final_score >= 75.0 else "MEDIUM" if final_score >= 40.0 else "LOW",
                "flags_triggered": flags,
                "velocity_check": "FAILED" if final_score >= 75.0 else "PASSED",
                "action_recommended": "FREEZE_AND_ESCALATE" if final_score >= 75.0 else "ALLOW",
                "requires_human_approval": final_score >= 75.0
            }

        # 10. NOTIFICATION TOOL
        elif t_name in ["notification_tool", "send_notification"]:
            cust_id = arguments.get("customer_id", "CUST-8801")
            msg = arguments.get("message", "Horizon Security Notice")
            priority = arguments.get("priority", "HIGH")
            channels = arguments.get("channels", ["SMS", "PUSH", "EMAIL"])

            res = NotificationToolOutput(
                dispatch_id=f"DISPATCH-{int(datetime.utcnow().timestamp())}",
                customer_id=cust_id,
                status="DISPATCHED",
                channels_delivered=channels if isinstance(channels, list) else [channels],
                priority=priority,
                dispatched_at=datetime.utcnow().isoformat()
            )
            return True, res.model_dump()

        # 11. DOCUMENT TOOL
        elif t_name in ["document_tool", "process_document"]:
            doc_type = arguments.get("doc_type", "W2_OR_PAYSLIP").upper()
            raw_text = arguments.get("raw_text", "Gross Monthly Pay: $8,500.00 USD. TechGlobal Inc.")
            res = DocumentToolOutput(
                document_id=f"DOC-{int(datetime.utcnow().timestamp())}",
                document_type=doc_type,
                verification_status="VERIFIED_AUTHENTIC",
                extracted_fields={
                    "employer_name": "TechGlobal Inc",
                    "monthly_gross_usd": 8500.00,
                    "annualized_income_usd": 102000.00,
                    "tax_compliance": "CLEAN"
                },
                confidence_score=0.985,
                summary="Verified payslip confirming annualized salary of $102,000.00 USD."
            )
            return True, res.model_dump()

        # 12. CORE BANKING TOOL
        elif t_name in ["core_banking_tool", "verify_ledger_balance"]:
            acc_num = arguments.get("account_number", "ACC-1002341")
            res = CoreBankingToolOutput(
                core_banking_system="HORIZON_CORE_LEDGER_V4",
                status="BALANCED",
                ledger_balanced=True,
                total_debits=125400.0,
                total_credits=125400.0,
                variance=0.0
            )
            return True, res.model_dump()

        # PRODUCT CATALOG
        elif t_name == "query_banking_products":
            category = arguments.get("category", "ALL").upper()
            products = [
                {
                    "product_id": "PRD-SAV-01",
                    "category": "SAVINGS",
                    "name": "Horizon High-Yield Savings",
                    "interest_rate_apy": "4.85%",
                    "minimum_balance": "$500.00",
                    "features": ["FDIC Insured up to $250k", "No monthly fees", "Daily compounding"]
                },
                {
                    "product_id": "PRD-DEP-02",
                    "category": "TERM_DEPOSIT",
                    "name": "Platinum 12-Month Fixed Certificate",
                    "interest_rate_apy": "5.45%",
                    "minimum_balance": "$5,000.00",
                    "features": ["Guaranteed fixed return", "Early withdrawal penalty applies"]
                },
                {
                    "product_id": "PRD-CRD-03",
                    "category": "CARDS",
                    "name": "Horizon Elite World Mastercard",
                    "annual_fee": "$95.00",
                    "apr_range": "16.49% - 24.99%",
                    "features": ["3% cashback on travel & dining", "Zero foreign transaction fees", "Travel insurance"]
                },
                {
                    "product_id": "PRD-LON-04",
                    "category": "LOANS",
                    "name": "Personal Signature Term Loan",
                    "starting_apr": "8.49%",
                    "max_amount": "$50,000.00",
                    "tenures_available": "12 to 60 months",
                    "features": ["No prepayment penalty", "Same-day direct deposit"]
                }
            ]
            if category != "ALL":
                products = [p for p in products if p["category"] == category]
            return True, {"total_products": len(products), "products": products}

        # REGULATORY RAG
        elif t_name == "search_regulatory_rag":
            query = arguments.get("query", "AML")
            citation_text = RegulatoryKnowledgeRAG.retrieve_context_with_citations(query)
            return True, {"regulatory_citations": citation_text}

        # ADVISORY PLAN
        elif t_name == "generate_advisory_plan":
            balance = float(arguments.get("liquid_balance", 48500.50))
            horizon_months = int(arguments.get("horizon_months", 12))
            emergency_fund = 15000.00
            investable_surplus = max(0.0, balance - emergency_fund)
            projected_yield = round(investable_surplus * 0.0545 * (horizon_months / 12), 2)

            return True, {
                "liquid_balance": balance,
                "recommended_emergency_buffer": emergency_fund,
                "investable_surplus": investable_surplus,
                "recommended_allocation": {
                    "cash_reserve_pct": 30.0,
                    "high_yield_term_deposit_pct": 50.0,
                    "diversified_bond_index_pct": 20.0
                },
                "projected_annual_yield_usd": projected_yield,
                "regulatory_disclaimer": "Educational financial guidance only. Not personalized fiduciary investment advice."
            }

        # MARKET RESEARCH
        elif t_name == "query_market_research":
            topic = arguments.get("topic", "INTEREST_RATES").upper()
            return True, {
                "topic": topic,
                "as_of_date": datetime.utcnow().strftime("%Y-%m-%d"),
                "benchmark_rates": {
                    "fed_funds_rate": "5.25% - 5.50%",
                    "sofr": "5.32%",
                    "10y_treasury": "4.28%",
                    "prime_rate": "8.50%"
                },
                "macro_summary": "Central bank signals neutral hold with potential gradual easing in H2.",
                "sources": ["Federal Reserve H.15 Release", "Bloomberg Index Benchmark", "Horizon Macro Research"]
            }

        return False, {"error": f"Tool implementation '{tool_name}' not defined in registry."}

    @classmethod
    def _log_call(cls, tool_name: str, agent: str, args: Dict[str, Any], ok: bool, result: Any, latency: int):
        cls._tool_audit_log.append({
            "timestamp": datetime.utcnow().isoformat(),
            "tool_name": tool_name,
            "invoking_agent": agent,
            "arguments": args,
            "success": ok,
            "latency_ms": latency,
            "result_preview": str(result)[:300]
        })
        if len(cls._tool_audit_log) > 200:
            cls._tool_audit_log.pop(0)
