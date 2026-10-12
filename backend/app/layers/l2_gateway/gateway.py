from typing import Tuple, Dict, Any
import re
from app.core.tracing import tracer

class APIGatewaySecurity:
    """
    Layer 2: Edge Security, WAF, Threat Protection, and Trace ID injection.
    """
    
    # Simple token-bucket rate limiting cache: client_ip -> request_count
    _rate_limit_bucket: Dict[str, int] = {}
    
    # Adversarial patterns
    _threat_patterns = [
        re.compile(r"(\bUNION\b|\bSELECT\b|\bINSERT\b|\bDROP\b)\s+", re.I),
        re.compile(r"<script.*?>.*?</script>", re.I),
        re.compile(r"(\.\./\.\./)", re.I),
    ]

    @classmethod
    def process_incoming_request(cls, client_ip: str, path: str, payload_str: str = "") -> Tuple[bool, str, str]:
        """
        Validates request against rate limits and WAF signatures.
        Returns: (is_allowed, threat_message, trace_id)
        """
        trace_id = tracer.generate_trace_id()
        
        # 1. Rate Limiting Check
        count = cls._rate_limit_bucket.get(client_ip, 0)
        if count > 120:  # 120 requests per window
            return False, "Rate limit exceeded (HTTP 429). Please back off.", trace_id
        cls._rate_limit_bucket[client_ip] = count + 1
        
        # 2. WAF Threat Signature Check
        for pattern in cls._threat_patterns:
            if pattern.search(payload_str) or pattern.search(path):
                return False, "WAF Security Violation: Malicious payload pattern intercepted.", trace_id
                
        return True, "Passed Security Checks", trace_id
