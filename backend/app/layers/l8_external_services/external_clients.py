"""
Layer 8 External Services Gateway.
Preserves backwards compatibility while delegating to comprehensive mock adapters.
"""
from typing import Dict, Any
from app.layers.l8_external_services.adapters import (
    CreditBureauAdapter,
    PaymentNetworksAdapter,
    KYCAMLServiceAdapter,
    GovernmentAPIsAdapter,
    MarketDataAdapter,
    ThirdPartyServicesAdapter
)

class ExternalServicesGateway:
    """
    Unified gateway for external mock financial service adapters.
    All calls are simulations and labeled accordingly.
    """

    @classmethod
    def query_credit_bureau(cls, customer_id: str) -> Dict[str, Any]:
        return CreditBureauAdapter.query_credit_profile(customer_id)

    @classmethod
    def screen_sanctions_and_pep(cls, entity_name: str) -> Dict[str, Any]:
        return KYCAMLServiceAdapter.screen_entity(entity_name)

    @classmethod
    def route_payment(cls, network: str, source_acc: str, dest_acc: str, amount: float) -> Dict[str, Any]:
        return PaymentNetworksAdapter.route_transfer(network, source_acc, dest_acc, amount)

    @classmethod
    def verify_government_id(cls, tin: str, legal_name: str) -> Dict[str, Any]:
        return GovernmentAPIsAdapter.verify_taxpayer_id(tin, legal_name)

    @classmethod
    def get_market_benchmarks(cls) -> Dict[str, Any]:
        return MarketDataAdapter.get_market_benchmarks()

    @classmethod
    def send_sms(cls, phone: str, text: str) -> Dict[str, Any]:
        return ThirdPartyServicesAdapter.dispatch_sms(phone, text)

    @classmethod
    def send_email(cls, email: str, subject: str) -> Dict[str, Any]:
        return ThirdPartyServicesAdapter.dispatch_email(email, subject)
