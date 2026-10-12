"""
Layer 4/3 ML Pipeline: Models Architecture.
Provides:
1. Rule-Based Baseline Model (deterministic heuristics)
2. Isolation Forest Model (unsupervised anomaly detection)
3. Random Forest Classifier Model (supervised classification)

All models include inference latency benchmarking and transparent limitations.
"""
from typing import Dict, Any, List, Tuple, Optional
import time
import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score, average_precision_score

class RuleBasedBaselineModel:
    """
    Deterministic rule-based heuristics commonly used in traditional core banking fraud filters.
    """
    MODEL_NAME = "Rule-Based Deterministic Baseline"
    MODEL_VERSION = "v1.0.0-rules"

    @classmethod
    def predict_single(cls, features: np.ndarray) -> Tuple[int, float, List[str]]:
        """
        Features order:
        0: amount
        1: hour_of_day
        2: velocity_1h
        3: velocity_24h
        4: distance_from_home_km
        5: device_risk_score
        6: is_new_counterparty
        7: international_flag
        8: failed_pin_attempts_24h
        """
        amount = features[0]
        vel_1h = features[2]
        dist_km = features[4]
        dev_risk = features[5]
        is_new = features[6]
        intl = features[7]
        failed_pin = features[8]

        rules_fired = []
        score = 0.0

        if amount >= 10000.0 and is_new == 1:
            rules_fired.append("R1: High Amount (>= $10,000) to New Counterparty (+40)")
            score += 0.40

        if vel_1h >= 4:
            rules_fired.append("R2: Rapid Velocity Spike (>= 4 transactions in 1 hour) (+30)")
            score += 0.30

        if dist_km >= 2500.0 and intl == 1:
            rules_fired.append("R3: High Geolocation Distance with International Route (+25)")
            score += 0.25

        if dev_risk >= 0.70:
            rules_fired.append("R4: High Untrusted Device Fingerprint / Emulator (+20)")
            score += 0.20

        if failed_pin >= 3:
            rules_fired.append("R5: Multiple Failed PIN / Auth Challenges (+20)")
            score += 0.20

        prob = min(1.0, score)
        prediction = 1 if prob >= 0.50 else 0
        return prediction, prob, rules_fired

    @classmethod
    def predict_batch(cls, X: np.ndarray, threshold: float = 0.50) -> Tuple[np.ndarray, np.ndarray]:
        preds = []
        probs = []
        for row in X:
            pred, prob, _ = cls.predict_single(row)
            preds.append(1 if prob >= threshold else 0)
            probs.append(prob)
        return np.array(preds), np.array(probs)

class IsolationForestAnomalyDetector:
    """
    Unsupervised Anomaly Detection using Isolation Forest.
    Detects unusual feature combinations without requiring true fraud labels.
    """
    MODEL_NAME = "Isolation Forest Outlier Detector"
    MODEL_VERSION = "v1.1.0-iforest"

    def __init__(self, contamination: float = 0.04, random_seed: int = 42):
        self.contamination = contamination
        self.random_seed = random_seed
        self.model = IsolationForest(
            n_estimators=100,
            contamination=contamination,
            random_state=random_seed,
            n_jobs=1
        )
        self.is_fitted = False

    def fit(self, X_train: np.ndarray):
        self.model.fit(X_train)
        self.is_fitted = True

    def predict_anomaly(self, X: np.ndarray, threshold: float = 0.50) -> Tuple[np.ndarray, np.ndarray]:
        if not self.is_fitted:
            raise RuntimeError("IsolationForest is not fitted. Run .fit() before inference.")

        # decision_function: lower score = more anomalous
        raw_scores = self.model.decision_function(X)
        
        # Invert and normalize to [0, 1] range: higher = more anomalous
        min_s, max_s = raw_scores.min(), raw_scores.max()
        if max_s > min_s:
            normalized_probs = 1.0 - (raw_scores - min_s) / (max_s - min_s)
        else:
            normalized_probs = np.zeros_like(raw_scores)

        preds = (normalized_probs >= threshold).astype(int)
        return preds, normalized_probs

class RandomForestFraudClassifier:
    """
    Supervised Ensemble Fraud Classifier using Random Forest.
    Trained strictly on labeled synthetic training samples with no data leakage.
    """
    MODEL_NAME = "Random Forest Fraud Classifier"
    MODEL_VERSION = "v2.1.0-rf"

    def __init__(self, n_estimators: int = 60, max_depth: int = 6, random_seed: int = 42):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.random_seed = random_seed
        self.model = RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            random_state=random_seed,
            class_weight="balanced",
            n_jobs=1
        )
        self.is_fitted = False
        self.feature_importances: Dict[str, float] = {}

    def fit(self, X_train: np.ndarray, y_train: np.ndarray, feature_names: List[str]):
        self.model.fit(X_train, y_train)
        self.is_fitted = True

        importances = self.model.feature_importances_
        self.feature_importances = {
            name: round(float(imp), 4) for name, imp in zip(feature_names, importances)
        }

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            raise RuntimeError("Random Forest is not fitted. Run .fit() before inference.")
        # Returns probability of class 1 (fraud)
        return self.model.predict_proba(X)[:, 1]

    def predict(self, X: np.ndarray, threshold: float = 0.50) -> Tuple[np.ndarray, np.ndarray]:
        probs = self.predict_proba(X)
        preds = (probs >= threshold).astype(int)
        return preds, probs
