from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from app.ml.experiment_runner import MLExperimentRunner

router = APIRouter(tags=["Layer 4/3: Experimental ML Pipeline"])

class RunExperimentRequest(BaseModel):
    n_samples: int = Field(default=1200, ge=200, le=5000, description="Total synthetic samples")
    test_size: float = Field(default=0.25, ge=0.1, le=0.5, description="Test split fraction")
    random_seed: int = Field(default=42, description="Deterministic random seed")

class PredictTransactionRiskRequest(BaseModel):
    amount: float = Field(default=250.0, description="Transaction amount in USD")
    hour_of_day: int = Field(default=14, ge=0, le=23, description="Hour of the day (0-23)")
    velocity_1h: int = Field(default=1, ge=0, description="Tx count in last 1 hour")
    velocity_24h: int = Field(default=2, ge=0, description="Tx count in last 24 hours")
    distance_from_home_km: float = Field(default=15.0, ge=0.0, description="Geo distance from home in km")
    device_risk_score: float = Field(default=0.15, ge=0.0, le=1.0, description="Device untrusted score (0.0 to 1.0)")
    is_new_counterparty: int = Field(default=0, ge=0, le=1, description="Binary 1 if counterparty is new")
    international_flag: int = Field(default=0, ge=0, le=1, description="Binary 1 if international transfer")
    failed_pin_attempts_24h: int = Field(default=0, ge=0, description="Failed PIN count")

@router.get("/models/experiments/latest")
async def get_latest_ml_experiment():
    """
    Returns latest ML benchmark results, model comparisons (Rule vs Isolation Forest vs Random Forest),
    threshold curves, feature importances, and drift monitoring.
    """
    return MLExperimentRunner.get_latest_experiment()

@router.post("/models/experiments/run")
async def run_ml_experiment(req: RunExperimentRequest):
    """
    Triggers a reproducible benchmark experiment run with strict data leakage prevention.
    """
    res = MLExperimentRunner.run_comprehensive_benchmark(
        n_samples=req.n_samples,
        test_size=req.test_size,
        random_seed=req.random_seed
    )
    return res

@router.post("/models/predict")
async def predict_transaction_risk(req: PredictTransactionRiskRequest):
    """
    Evaluates a live transaction feature vector against Rule-Based, Isolation Forest,
    and Random Forest models, returning composite risk score and model provenance.
    """
    return MLExperimentRunner.predict_transaction(req.model_dump())
