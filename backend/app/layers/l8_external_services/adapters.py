"""
Layer 8: External Third-Party Financial Services Adapters.
Simulates Credit Bureau, Payment Networks, KYC/AML Watchlists, Government APIs, Market Data, and Messaging.

CRITICAL ARCHITECTURAL POLICY:
All adapters in this module are synthetic simulations with mock data.
They never connect to real banking networks or live government APIs.
Every response contains an explicit simulation notice.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
import time

class ExternalServiceException(Exception):
    def __init__(self, service_name: str, status_code: int, message: str, retryable: bool = False):
        super().__init__(f"[{service_name}] HTTP {status_code}: {message}")
        self.service_name = service_name
        self.status_code = status_code
        self.message = message
        self.retryable = retryable

class BaseMockAdapter:
    """Base class enforcing simulation disclosure and deterministic failure simulation."""
    SERVICE_NAME = "MOCK_SERVICE"

    @classmethod
    def _apply_simulation_controls(cls, trigger: Optional[str] = None):
        """Supports simulated timeouts and error codes for testing resilience."""
        if trigger == "SIMULATE_TIMEOUT":
            # Deterministic simulated timeout
            raise ExternalServiceException(cls.SERVICE_NAME, 504, "Gateway Timeout: Mock upstream partner timed out.", retryable=True)
        elif trigger == "SIMULATE_503":
            raise ExternalServiceException(cls.SERVICE_NAME, 503, "Service Unavailable: Mock service node undergoing scheduled maintenance.", retryable=True)
        elif trigger == "SIMULATE_429":
            raise ExternalServiceException(cls.SERVICE_NAME, 429, "Too Many Requests: Mock rate limit quota exceeded.", retryable=True)
        elif trigger == "SIMULATE_400":
            raise ExternalServiceException(cls.SERVICE_NAME, 400, "Bad Request: Malformed payload in mock adapter.", retryable=False)

    @classmethod
    def _stamp_metadata(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        payload["_meta"] = {
            "is_simulation": True,
            "provider_type": "MOCK_SYNTHETIC_ADAPTER",
            "service_name": cls.SERVICE_NAME,
            "timestamp": datetime.utcnow().isoformat(),
            "disclaimer": "SYNTHETIC SIMULATION ONLY. NEVER CONNECTS TO LIVE EXTERNAL NETWORKS."
        }
        return payload

# 1. Credit Bureau Adapter (Experian / CIBIL)
class CreditBureauAdapter(BaseMockAdapter):
    SERVICE_NAME = "MOCK_EXPERIAN_CIBIL_BUREAU"

    @classmethod
    def query_credit_profile(cls, customer_id: str, trigger_failure: Optional[str] = None) -> Dict[str, Any]:
        cls._apply_simulation_controls(trigger_failure)
        
        # Deterministic profiles
        if customer_id == "CUST-8802":
            data = {
                "bureau": "Experian",
                "customer_id": customer_id,
                "score": 610,
                "grade": "FAIR",
                "active_tradelines": 4,
                "delinquency_history": 2,
                "credit_utilization_ratio": 74.5,
                "recommended_max_limit": 5000.0,
                "inquiries_last_6m": 5
            }
        elif customer_id == "CUST-POOR":
            data = {
                "bureau": "Experian",
                "customer_id": customer_id,
                "score": 540,
                "grade": "SUBPRIME",
                "active_tradelines": 6,
                "delinquency_history": 5,
                "credit_utilization_ratio": 92.0,
                "recommended_max_limit": 1000.0,
                "inquiries_last_6m": 8
            }
        else: # Default Prime (e.g. CUST-8801)
            data = {
                "bureau": "Experian",
                "customer_id": customer_id,
                "score": 785,
                "grade": "EXCELLENT",
                "active_tradelines": 2,
                "delinquency_history": 0,
                "credit_utilization_ratio": 18.2,
                "recommended_max_limit": 65000.0,
                "inquiries_last_6m": 1
            }
        return cls._stamp_metadata(data)

# 2. Payment Networks Adapter (Fedwire, ACH, SWIFT)
class PaymentNetworksAdapter(BaseMockAdapter):
    SERVICE_NAME = "MOCK_FEDWIRE_ACH_SWIFT"

    @classmethod
    def route_transfer(
        cls,
        network: str,
        source_account: str,
        dest_account: str,
        amount: float,
        trigger_failure: Optional[str] = None
    ) -> Dict[str, Any]:
        cls._apply_simulation_controls(trigger_failure)

        network_upper = network.upper()
        if network_upper == "FEDWIRE":
            settlement_window = "REAL_TIME_GROSS_SETTLEMENT (RTGS)"
            clearing_eta_seconds = 2
            fee = 15.00
        elif network_upper == "SWIFT":
            settlement_window = "CROSS_BORDER_CORRESPONDENT (T+1)"
            clearing_eta_seconds = 86400
            fee = 35.00
        else: # ACH
            settlement_window = "SAME_DAY_BATCH_ACH"
            clearing_eta_seconds = 14400
            fee = 0.50

        data = {
            "network": network_upper,
            "routing_reference": f"NWK-{network_upper[:3]}-{int(datetime.utcnow().timestamp())}",
            "source_account": source_account,
            "destination_account": dest_account,
            "amount": amount,
            "network_fee_usd": fee,
            "settlement_type": settlement_window,
            "status": "ACCEPTED_BY_NETWORK",
            "clearing_eta_seconds": clearing_eta_seconds
        }
        return cls._stamp_metadata(data)

# 3. KYC / AML Services Adapter (OFAC SDN & PEP Lists)
class KYCAMLServiceAdapter(BaseMockAdapter):
    SERVICE_NAME = "MOCK_OFAC_WATCHLIST_SCREENER"

    _SANCTIONED_ENTITIES = {
        "NASSAU MARITIME HOLDINGS LTD",
        "VIKTOR BOURKINE",
        "CRIMEA PETRO CORP",
        "DARKNET ESCROW SERVICES",
        "CYPRUS OFFSHORE TRADING LTD"
    }

    _PEPS = {
        "ELIZABETH VANCE (DEPUTY MINISTER)",
        "ALEXANDER KOROL (CONSUL GENERAL)"
    }

    @classmethod
    def screen_entity(cls, entity_name: str, trigger_failure: Optional[str] = None) -> Dict[str, Any]:
        cls._apply_simulation_controls(trigger_failure)
        
        normalized = entity_name.upper().strip()
        is_sanctioned = normalized in cls._SANCTIONED_ENTITIES
        is_pep = normalized in cls._PEPS

        risk_score = 99.0 if is_sanctioned else (75.0 if is_pep else 4.0)
        matched_lists = []
        if is_sanctioned:
            matched_lists.append("OFAC_SDN_LIST")
            matched_lists.append("UN_SECURITY_COUNCIL_CONSOLIDATED")
        if is_pep:
            matched_lists.append("POLITICALLY_EXPOSED_PERSONS_DATABASE")

        data = {
            "entity_name": entity_name,
            "matched": is_sanctioned or is_pep,
            "is_sanctioned": is_sanctioned,
            "is_pep": is_pep,
            "risk_score": risk_score,
            "matched_lists": matched_lists,
            "recommendation": "BLOCK_AND_ESCALATE" if is_sanctioned else ("ENHANCED_DUE_DILIGENCE" if is_pep else "CLEAR")
        }
        return cls._stamp_metadata(data)

# 4. Government APIs Adapter (IRS TIN, SSA)
class GovernmentAPIsAdapter(BaseMockAdapter):
    SERVICE_NAME = "MOCK_GOVERNMENT_TIN_SSA_GATEWAY"

    @classmethod
    def verify_taxpayer_id(cls, tin: str, legal_name: str, trigger_failure: Optional[str] = None) -> Dict[str, Any]:
        cls._apply_simulation_controls(trigger_failure)
        
        is_valid = len(tin.replace("-", "")) == 9 and not tin.startswith("000")
        data = {
            "tin_masked": f"***-**-{tin[-4:]}" if len(tin) >= 4 else "INVALID",
            "legal_name": legal_name,
            "irs_tin_match_status": "MATCHED" if is_valid else "MISMATCH",
            "fincen_registration": "ACTIVE_FINANCIAL_INSTITUTION",
            "verified": is_valid
        }
        return cls._stamp_metadata(data)

# 5. Market Data Adapter (SOFR, Treasury curves, FX rates)
class MarketDataAdapter(BaseMockAdapter):
    SERVICE_NAME = "MOCK_FED_TREASURY_MARKET_FEED"

    @classmethod
    def get_market_benchmarks(cls, trigger_failure: Optional[str] = None) -> Dict[str, Any]:
        cls._apply_simulation_controls(trigger_failure)

        data = {
            "as_of_date": datetime.utcnow().strftime("%Y-%m-%d"),
            "sofr_rate": 5.32,
            "fed_funds_effective": 5.33,
            "us_treasury_yield_curve": {
                "1M": 5.41,
                "3M": 5.38,
                "2Y": 4.65,
                "5Y": 4.31,
                "10Y": 4.28,
                "30Y": 4.45
            },
            "fx_benchmarks": {
                "EUR_USD": 1.0825,
                "GBP_USD": 1.2640,
                "USD_JPY": 154.20
            },
            "macro_commentary": "Yield curve inverted at 2Y-10Y spread (-37 bps). Policy benchmark pricing remains stable."
        }
        return cls._stamp_metadata(data)

# 6. Third-Party Services Adapter (Plaid, Twilio SMS, SendGrid Email)
class ThirdPartyServicesAdapter(BaseMockAdapter):
    SERVICE_NAME = "MOCK_COMMUNICATIONS_AND_OPEN_BANKING"

    @classmethod
    def dispatch_sms(cls, phone_number: str, text: str, trigger_failure: Optional[str] = None) -> Dict[str, Any]:
        cls._apply_simulation_controls(trigger_failure)
        data = {
            "provider": "MockTwilioGateway",
            "recipient_masked": phone_number[:3] + "****" + phone_number[-4:] if len(phone_number) >= 8 else phone_number,
            "message_sid": f"SM_{int(datetime.utcnow().timestamp())}",
            "status": "DELIVERED",
            "segments": 1
        }
        return cls._stamp_metadata(data)

    @classmethod
    def dispatch_email(cls, email: str, subject: str, trigger_failure: Optional[str] = None) -> Dict[str, Any]:
        cls._apply_simulation_controls(trigger_failure)
        data = {
            "provider": "MockSendGridGateway",
            "recipient": email,
            "subject": subject,
            "message_id": f"MSG_{int(datetime.utcnow().timestamp())}",
            "status": "DELIVERED"
        }
        return cls._stamp_metadata(data)
