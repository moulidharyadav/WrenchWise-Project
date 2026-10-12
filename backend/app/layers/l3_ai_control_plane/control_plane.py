import re
from typing import Dict, Any, Tuple, List
from app.config import settings

class AIControlPlane:
    """
    Layer 3: AI Gateway & AI Control Plane.
    Performs PII Masking, Prompt Sanitization, Model Routing, and HITL Trigger Evaluation.
    """
    
    # PII Regexes
    CARD_REGEX = re.compile(r"\b(?:\d{4}[ -]?){3}\d{4}\b")
    SSN_REGEX = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
    EMAIL_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b")
    
    PROMPT_COST_PER_1K = 0.00125
    COMPLETION_COST_PER_1K = 0.005

    @classmethod
    def sanitize_and_check_guardrails(cls, raw_prompt: str) -> Dict[str, Any]:
        """
        Detects sensitive PII, applies token masking, and checks content safety.
        """
        masked = raw_prompt
        pii_detected = False
        violations: List[str] = []
        
        # 1. Mask Primary Account Numbers (Credit/Debit cards)
        if cls.CARD_REGEX.search(raw_prompt):
            pii_detected = True
            masked = cls.CARD_REGEX.sub("••••-••••-••••-XXXX", masked)
            violations.append("PII_MASKED: Primary Account Number (PAN) masked.")
            
        # 2. Mask SSN
        if cls.SSN_REGEX.search(raw_prompt):
            pii_detected = True
            masked = cls.SSN_REGEX.sub("XXX-XX-••••", masked)
            violations.append("PII_MASKED: Government ID/SSN masked.")

        # 3. Prompt Injection Defense
        adversarial_signals = ["ignore previous instructions", "bypass system guardrails", "drop all tables", "reveal system prompt"]
        safety_score = 98.0
        for signal in adversarial_signals:
            if signal in raw_prompt.lower():
                safety_score = 12.0
                violations.append(f"ADVERSARIAL_INJECTION_DEFENSE: '{signal}' detected.")

        estimated_tokens = max(1, len(masked) // 4)
        estimated_cost = (estimated_tokens / 1000) * cls.PROMPT_COST_PER_1K

        return {
            "masked_prompt": masked,
            "pii_detected": pii_detected,
            "safety_score": safety_score,
            "passed": safety_score >= 50.0,
            "estimated_tokens": estimated_tokens,
            "estimated_cost_usd": estimated_cost,
            "violations": violations,
            "model_assigned": settings.DEFAULT_MODEL if safety_score >= 50.0 else settings.FALLBACK_MODEL
        }

    @classmethod
    def evaluate_hitl_requirement(
        cls,
        amount: float,
        fraud_risk_score: float,
        sanctions_match: bool
    ) -> Tuple[bool, str]:
        """
        Determines whether operation requires Human-In-The-Loop approval ticket.
        """
        if sanctions_match:
            return True, "Mandatory OFAC/Sanctions Watchlist Match. Human compliance concurrence required."
        if fraud_risk_score >= settings.FRAUD_CRITICAL_THRESHOLD:
            return True, f"Critical fraud risk score ({fraud_risk_score}/100) exceeds autonomous processing threshold."
        if amount >= settings.HITL_AMOUNT_THRESHOLD:
            return True, f"High-value transfer (${amount:,.2f}) exceeds autonomous single-agent limit (${settings.HITL_AMOUNT_THRESHOLD:,.2f})."
        return False, "Autonomous Execution Authorized"
