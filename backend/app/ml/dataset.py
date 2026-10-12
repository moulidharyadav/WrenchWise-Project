"""
Layer 4/3 ML Pipeline: Synthetic Transaction Dataset Generator.
Generates reproducible, statistically structured synthetic transactions
with realistic banking feature engineering and strict train/test separation to prevent data leakage.
"""
from typing import Dict, Any, List, Tuple
import numpy as np
from datetime import datetime

class SyntheticTransactionDataset:
    """
    Reproducible synthetic transaction dataset generator for fraud & anomaly detection experiments.
    """
    DATASET_VERSION = "v1.2-synthetic-benchmark"
    DEFAULT_SEED = 42

    FEATURE_NAMES = [
        "amount",
        "hour_of_day",
        "velocity_1h",
        "velocity_24h",
        "distance_from_home_km",
        "device_risk_score",
        "is_new_counterparty",
        "international_flag",
        "failed_pin_attempts_24h"
    ]

    FEATURE_DESCRIPTIONS = {
        "amount": "Transaction amount in USD (log-normal distribution)",
        "hour_of_day": "Hour of the day in UTC (0-23)",
        "velocity_1h": "Count of transactions from same account in last 1 hour",
        "velocity_24h": "Count of transactions from same account in last 24 hours",
        "distance_from_home_km": "Distance in km from customer home branch/city",
        "device_risk_score": "Synthetic device risk score from 0.0 (trusted) to 1.0 (untrusted/emulator)",
        "is_new_counterparty": "Binary 1 if counterparty account was never interacted with before",
        "international_flag": "Binary 1 if destination routing is international cross-border",
        "failed_pin_attempts_24h": "Number of failed authentication attempts in past 24 hours"
    }

    @classmethod
    def generate_dataset(
        cls,
        n_samples: int = 1000,
        fraud_ratio: float = 0.04,
        random_seed: int = 42
    ) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
        """
        Generates feature matrix X and ground truth label array y.
        Returns:
            X: np.ndarray of shape (n_samples, len(FEATURE_NAMES))
            y: np.ndarray of shape (n_samples,) binary 0 or 1
            metadata: dictionary describing generation parameters
        """
        rng = np.random.RandomState(random_seed)

        n_fraud = int(n_samples * fraud_ratio)
        n_legit = n_samples - n_fraud

        # --- 1. Legitimate Transactions Distribution ---
        legit_amount = rng.lognormal(mean=4.5, sigma=1.2, size=n_legit) # Mean ~$150-$300
        legit_amount = np.clip(legit_amount, 5.0, 4500.0)
        legit_hour = rng.choice(np.arange(24), size=n_legit, p=cls._get_hourly_prior())
        legit_vel_1h = rng.poisson(lam=0.4, size=n_legit)
        legit_vel_24h = legit_vel_1h + rng.poisson(lam=2.5, size=n_legit)
        legit_dist = rng.exponential(scale=25.0, size=n_legit) # Mostly local
        legit_device = rng.beta(a=1.5, b=8.0, size=n_legit) # Low device risk
        legit_new_cp = rng.binomial(n=1, p=0.15, size=n_legit)
        legit_intl = rng.binomial(n=1, p=0.03, size=n_legit)
        legit_failed_pin = rng.binomial(n=1, p=0.04, size=n_legit)

        X_legit = np.column_stack([
            legit_amount, legit_hour, legit_vel_1h, legit_vel_24h,
            legit_dist, legit_device, legit_new_cp, legit_intl, legit_failed_pin
        ])
        y_legit = np.zeros(n_legit, dtype=int)

        # --- 2. Synthetic Fraud Transactions Distribution ---
        fraud_amount = rng.lognormal(mean=8.2, sigma=1.0, size=n_fraud) # High amounts (~$3,000-$20,000)
        fraud_amount = np.clip(fraud_amount, 850.0, 24500.0)
        fraud_hour = rng.choice(np.arange(24), size=n_fraud) # Spread across night hours
        fraud_vel_1h = rng.poisson(lam=4.2, size=n_fraud) # Rapid bursts
        fraud_vel_24h = fraud_vel_1h + rng.poisson(lam=8.0, size=n_fraud)
        fraud_dist = rng.exponential(scale=3500.0, size=n_fraud) + 500.0 # High geo-anomaly
        fraud_device = rng.beta(a=7.0, b=2.0, size=n_fraud) # High device risk
        fraud_new_cp = rng.binomial(n=1, p=0.88, size=n_fraud)
        fraud_intl = rng.binomial(n=1, p=0.65, size=n_fraud)
        fraud_failed_pin = rng.choice([0, 1, 2, 3, 4], size=n_fraud, p=[0.2, 0.2, 0.3, 0.2, 0.1])

        X_fraud = np.column_stack([
            fraud_amount, fraud_hour, fraud_vel_1h, fraud_vel_24h,
            fraud_dist, fraud_device, fraud_new_cp, fraud_intl, fraud_failed_pin
        ])
        y_fraud = np.ones(n_fraud, dtype=int)

        # Combine and shuffle deterministically
        X = np.vstack([X_legit, X_fraud])
        y = np.concatenate([y_legit, y_fraud])

        indices = np.arange(n_samples)
        rng.shuffle(indices)
        X = X[indices]
        y = y[indices]

        metadata = {
            "dataset_version": cls.DATASET_VERSION,
            "random_seed": random_seed,
            "total_samples": n_samples,
            "fraud_samples": n_fraud,
            "legitimate_samples": n_legit,
            "fraud_ratio_pct": round((n_fraud / n_samples) * 100, 2),
            "features": cls.FEATURE_NAMES,
            "feature_descriptions": cls.FEATURE_DESCRIPTIONS,
            "disclaimer": "SYNTHETIC SIMULATED DATASET ONLY. Metrics reflect synthetic distributions and do not represent live banking fraud incidence."
        }
        return X, y, metadata

    @classmethod
    def get_train_test_split(
        cls,
        n_samples: int = 1200,
        test_size: float = 0.25,
        random_seed: int = 42
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, Dict[str, Any]]:
        """
        Creates train and test sets with stratified fraud proportion to prevent data leakage.
        """
        X, y, meta = cls.generate_dataset(n_samples=n_samples, random_seed=random_seed)

        rng = np.random.RandomState(random_seed)
        idx_0 = np.where(y == 0)[0]
        idx_1 = np.where(y == 1)[0]

        rng.shuffle(idx_0)
        rng.shuffle(idx_1)

        split_0 = int(len(idx_0) * (1 - test_size))
        split_1 = int(len(idx_1) * (1 - test_size))

        train_indices = np.concatenate([idx_0[:split_0], idx_1[:split_1]])
        test_indices = np.concatenate([idx_0[split_0:], idx_1[split_1:]])

        rng.shuffle(train_indices)
        rng.shuffle(test_indices)

        X_train, y_train = X[train_indices], y[train_indices]
        X_test, y_test = X[test_indices], y[test_indices]

        meta["train_samples"] = len(X_train)
        meta["test_samples"] = len(X_test)
        meta["test_size_ratio"] = test_size

        return X_train, X_test, y_train, y_test, meta

    @staticmethod
    def _get_hourly_prior() -> np.ndarray:
        """Realistic daily banking transaction activity curve (peaks 11am-4pm UTC)."""
        curve = np.array([
            0.01, 0.01, 0.01, 0.01, 0.02, 0.03,
            0.04, 0.05, 0.06, 0.07, 0.08, 0.09,
            0.08, 0.08, 0.07, 0.06, 0.05, 0.05,
            0.04, 0.04, 0.03, 0.02, 0.01, 0.01
        ])
        return curve / curve.sum()
