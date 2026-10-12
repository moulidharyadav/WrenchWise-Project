from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from app.layers.l8_external_services.adapters import (
    CreditBureauAdapter,
    PaymentNetworksAdapter,
    KYCAMLServiceAdapter,
    GovernmentAPIsAdapter,
    MarketDataAdapter,
    ThirdPartyServicesAdapter,
    ExternalServiceException
)

router = APIRouter(tags=["Layer 8: External Services Adapters"])

class CreditBureauQueryRequest(BaseModel):
    customer_id: str = Field(default="CUST-8801", description="Customer ID to query")
    trigger_failure: Optional[str] = Field(default=None, description="Optional failure mode: SIMULATE_TIMEOUT, SIMULATE_503, SIMULATE_429")

class AMLScreeningRequest(BaseModel):
    entity_name: str = Field(default="DARKNET ESCROW SERVICES", description="Entity name to screen")
    trigger_failure: Optional[str] = Field(default=None, description="Optional failure mode")

class PaymentRouteRequest(BaseModel):
    network: str = Field(default="ACH", description="ACH, FEDWIRE, SWIFT")
    source_account: str = Field(default="ACC-1002341")
    destination_account: str = Field(default="ACC-2009812")
    amount: float = Field(default=500.0, ge=0.01)
    trigger_failure: Optional[str] = Field(default=None)

@router.get("/external-services/catalog")
async def get_adapters_catalog():
    """
    Lists mock external service adapters and active simulation policies.
    """
    return {
        "disclaimer": "ALL SERVICES ARE MOCK SIMULATIONS FOR ARCHITECTURAL DEMONSTRATION. NO LIVE EXTERNAL CONNECTIONS.",
        "adapters": [
            {
                "name": "CreditBureauAdapter",
                "simulates": "Experian / CIBIL Credit Bureau",
                "capabilities": ["Credit scores", "Tradelines", "Delinquency histories"]
            },
            {
                "name": "PaymentNetworksAdapter",
                "simulates": "Fedwire, ACH, SWIFT Settlement",
                "capabilities": ["RTGS routing", "Batch ACH", "Cross-border fees"]
            },
            {
                "name": "KYCAMLServiceAdapter",
                "simulates": "OFAC SDN & PEP Lists",
                "capabilities": ["Sanctions screening", "Adverse media", "PEP detection"]
            },
            {
                "name": "GovernmentAPIsAdapter",
                "simulates": "IRS TIN Matching & SSA",
                "capabilities": ["Taxpayer ID verification", "FinCEN registration"]
            },
            {
                "name": "MarketDataAdapter",
                "simulates": "Federal Reserve & US Treasury Market Feed",
                "capabilities": ["SOFR rates", "Yield curves", "FX quotes"]
            },
            {
                "name": "ThirdPartyServicesAdapter",
                "simulates": "Twilio SMS & SendGrid Email",
                "capabilities": ["SMS dispatch", "Email alerts"]
            }
        ]
    }

@router.post("/external-services/credit-bureau/query")
async def query_credit_bureau(req: CreditBureauQueryRequest):
    try:
        return CreditBureauAdapter.query_credit_profile(req.customer_id, trigger_failure=req.trigger_failure)
    except ExternalServiceException as ese:
        raise HTTPException(status_code=ese.status_code, detail=ese.message)

@router.post("/external-services/aml/screen")
async def screen_aml(req: AMLScreeningRequest):
    try:
        return KYCAMLServiceAdapter.screen_entity(req.entity_name, trigger_failure=req.trigger_failure)
    except ExternalServiceException as ese:
        raise HTTPException(status_code=ese.status_code, detail=ese.message)

@router.post("/external-services/payment/route")
async def route_payment(req: PaymentRouteRequest):
    try:
        return PaymentNetworksAdapter.route_transfer(
            req.network, req.source_account, req.destination_account, req.amount, trigger_failure=req.trigger_failure
        )
    except ExternalServiceException as ese:
        raise HTTPException(status_code=ese.status_code, detail=ese.message)

@router.get("/external-services/market-data")
async def get_market_data():
    return MarketDataAdapter.get_market_benchmarks()
