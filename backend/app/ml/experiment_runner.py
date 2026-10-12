"""
Layer 4/3 ML Pipeline: Experiment Runner & Evaluation Engine.
Provides:
- Repeatable experiment execution with fixed seeds and zero data leakage
- Comprehensive metrics: Precision, Recall, F1, FPR, ROC-AUC, PR-AUC, Latency
- Model comparison (Rule-Based vs Isolation Forest vs Random Forest)
- Feature importance analysis
- Configurable decision threshold sweep
- Feature drift monitoring hook (Population Stability Index - PSI)
- Live inference integration for Risk/Fraud Agent and Supervisor
"""
from typing import Dict, Any, List, Tuple, Optional
import time
import numpy as np
from datetime import datetime
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score, average_precision_score, confusion_matrix
from app.ml.dataset import SyntheticTransactionDataset
from app.ml.models import RuleBasedBaselineModel, IsolationForestAnomalyDetector, RandomForestFraudClassifier

class MLExperimentRunner:
    """
    Manages model training, evaluation, comparison, drift monitoring, and live scoring.
    """
    _latest_experiment: Optional[Dict[str, Any]] = None
    _trained_rf: Optional[RandomForestFraudClassifier] = None
    _trained_iforest: Optional[IsolationForestAnomalyDetector] = None
    _rule_baseline = RuleBasedBaselineModel

    @classmethod
    def get_latest_experiment(cls) -> Dict[str, Any]:
        if cls._latest_experiment is None:
            cls.run_comprehensive_benchmark()
        return cls._latest_experiment

    @classmethod
    def run_comprehensive_benchmark(
        cls,
        n_samples: int = 1200,
        test_size: float = 0.25,
        random_seed: int = 42
    ) -> Dict[str, Any]:
        """
        Executes a repeatable benchmark experiment across all three model architectures.
        """
        experiment_id = f"EXP-{int(datetime.utcnow().timestamp())}"
        start_time = time.time()

        # 1. Dataset Generation (Stratified, strictly separated to prevent leakage)
        X_train, X_test, y_train, y_test, meta = SyntheticTransactionDataset.get_train_test_split(
            n_samples=n_samples,
            test_size=test_size,
            random_seed=random_seed
        )

        # 2. Train Models
        # A. Isolation Forest (Unsupervised on train set features)
        iforest = IsolationForestAnomalyDetector(contamination=0.04, random_seed=random_seed)
        iforest.fit(X_train)
        cls._trained_iforest = iforest

        # B. Random Forest (Supervised on train set)
        rf = RandomForestFraudClassifier(n_estimators=60, max_depth=6, random_seed=random_seed)
        rf.fit(X_train, y_train, SyntheticTransactionDataset.FEATURE_NAMES)
        cls._trained_rf = rf

        # 3. Benchmark Inference Latency (ms per transaction over 100 single calls)
        latencies_rf = cls._measure_latency(lambda x: rf.predict(x), X_test[:100])
        latencies_if = cls._measure_latency(lambda x: iforest.predict_anomaly(x), X_test[:100])
        latencies_rb = cls._measure_latency(lambda x: cls._rule_baseline.predict_batch(x), X_test[:100])

        # 4. Model Predictions on Unseen Test Set
        # Baseline
        pred_rb, prob_rb = cls._rule_baseline.predict_batch(X_test, threshold=0.50)
        eval_rb = cls._compute_metrics("Rule-Based Deterministic Baseline", y_test, pred_rb, prob_rb, latencies_rb)

        # Isolation Forest
        pred_if, prob_if = iforest.predict_anomaly(X_test, threshold=0.50)
        eval_if = cls._compute_metrics("Isolation Forest Anomaly Detector", y_test, pred_if, prob_if, latencies_if)

        # Random Forest
        pred_rf, prob_rf = rf.predict(X_test, threshold=0.50)
        eval_rf = cls._compute_metrics("Random Forest Classifier", y_test, pred_rf, prob_rf, latencies_rf)

        # 5. Threshold Analysis for Random Forest (Configurable Decision Boundary)
        threshold_sweep = []
        for thresh in [0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80]:
            p = (prob_rf >= thresh).astype(int)
            prec = precision_score(y_test, p, zero_division=0)
            rec = recall_score(y_test, p, zero_division=0)
            f1 = f1_score(y_test, p, zero_division=0)
            threshold_sweep.append({
                "threshold": thresh,
                "precision": round(float(prec), 3),
                "recall": round(float(rec), 3),
                "f1_score": round(float(f1), 3),
                "flagged_count": int(p.sum())
            })

        # 6. Feature Importance Rankings (Random Forest MDI)
        sorted_importances = sorted(
            rf.feature_importances.items(),
            key=lambda x: x[1],
            reverse=True
        )
        ranked_importances = [
            {"feature": k, "importance_score": v, "description": SyntheticTransactionDataset.FEATURE_DESCRIPTIONS.get(k, "")}
            for k, v in sorted_importances
        ]

        # 7. Drift Monitoring Hook (Population Stability Index)
        drift_report = cls._calculate_drift(X_train, X_test, SyntheticTransactionDataset.FEATURE_NAMES)

        elapsed_seconds = round(time.time() - start_time, 2)

        cls._latest_experiment = {
            "experiment_id": experiment_id,
            "timestamp": datetime.utcnow().isoformat(),
            "execution_duration_sec": elapsed_seconds,
            "dataset_provenance": meta,
            "models_evaluated": [eval_rb, eval_if, eval_rf],
            "threshold_sweep": threshold_sweep,
            "feature_importances": ranked_importances,
            "drift_monitoring": drift_report,
            "limitations_and_ethics": (
                "CRITICAL LIMITATION DISCLOSURE: All evaluations are performed strictly on synthetic simulated transaction "
                "distributions. Synthetic labels and precision/recall metrics must not be interpreted as evidence of live production "
                "fraud detection efficacy. Unsupervised Isolation Forest operates without label supervision. Deterministic core banking "
                "ledger balances and authorization rules remain completely decoupled from model predictions."
            )
        }
        return cls._latest_experiment

    @classmethod
    def predict_transaction(cls, feature_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Live transaction risk inference used by Risk/Fraud Agent and Supervisor.
        Accepts raw feature dictionary and returns multi-model consensus assessment.
        """
        if cls._trained_rf is None or cls._trained_iforest is None:
            cls.run_comprehensive_benchmark()

        features_array = np.array([[
            float(feature_dict.get("amount", 250.0)),
            float(feature_dict.get("hour_of_day", 14)),
            float(feature_dict.get("velocity_1h", 1)),
            float(feature_dict.get("velocity_24h", 2)),
            float(feature_dict.get("distance_from_home_km", 15.0)),
            float(feature_dict.get("device_risk_score", 0.15)),
            float(feature_dict.get("is_new_counterparty", 0)),
            float(feature_dict.get("international_flag", 0)),
            float(feature_dict.get("failed_pin_attempts_24h", 0))
        ]])

        # 1. Rule-Based Evaluation
        _, rb_score, rules = cls._rule_baseline.predict_single(features_array[0])

        # 2. Isolation Forest Anomaly
        _, if_score = cls._trained_iforest.predict_anomaly(features_array)

        # 3. Random Forest Fraud Probability
        rf_score = cls._trained_rf.predict_proba(features_array)[0]

        # Consensus composite score (40% RF, 35% Rules, 25% Isolation Forest)
        composite_score = round(float((0.40 * rf_score) + (0.35 * rb_score) + (0.25 * if_score[0])) * 100, 1)

        risk_level = "CRITICAL" if composite_score >= 70.0 else "MEDIUM" if composite_score >= 35.0 else "LOW"

        return {
            "composite_risk_score": composite_score,
            "risk_level": risk_level,
            "action_recommendation": "FREEZE_AND_ESCALATE" if composite_score >= 70.0 else "ALLOW",
            "model_breakdown": {
                "random_forest_fraud_prob": round(float(rf_score), 4),
                "isolation_forest_anomaly_score": round(float(if_score[0]), 4),
                "rule_based_score": round(float(rb_score), 4),
                "rules_triggered": rules
            },
            "provenance": {
                "rf_model_version": cls._trained_rf.MODEL_VERSION,
                "if_model_version": cls._trained_iforest.MODEL_VERSION,
                "rule_model_version": cls._rule_baseline.MODEL_VERSION,
                "evaluated_at": datetime.utcnow().isoformat()
            }
        }

    @classmethod
    def _compute_metrics(
        cls,
        model_name: str,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_prob: np.ndarray,
        latencies_ms: Dict[str, float]
    ) -> Dict[str, Any]:
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
        fpr = fp / max(1, (fp + tn))
        prec = precision_score(y_true, y_pred, zero_division=0)
        rec = recall_score(y_true, y_pred, zero_division=0)
        f1 = f1_score(y_true, y_pred, zero_division=0)

        try:
            roc_auc = roc_auc_score(y_true, y_prob)
        except Exception:
            roc_auc = 0.50

        try:
            pr_auc = average_precision_score(y_true, y_prob)
        except Exception:
            pr_auc = 0.0

        return {
            "model_name": model_name,
            "precision": round(float(prec), 3),
            "recall": round(float(rec), 3),
            "f1_score": round(float(f1), 3),
            "false_positive_rate": round(float(fpr), 3),
            "roc_auc": round(float(roc_auc), 3),
            "pr_auc": round(float(pr_auc), 3),
            "confusion_matrix": {
                "true_positives": int(tp),
                "false_positives": int(fp),
                "true_negatives": int(tn),
                "false_negatives": int(fn)
            },
            "inference_latency_ms": latencies_ms
        }

    @classmethod
    def _measure_latency(cls, predict_func, X_sample: np.ndarray) -> Dict[str, float]:
        times = []
        for i in range(len(X_sample)):
            t0 = time.perf_counter()
            predict_func(X_sample[i:i+1])
            times.append((time.perf_counter() - t0) * 1000)
        return {
            "p50_ms": round(float(np.percentile(times, 50)), 3),
            "p95_ms": round(float(np.percentile(times, 95)), 3),
            "p99_ms": round(float(np.percentile(times, 99)), 3)
        }

    @classmethod
    def _calculate_drift(cls, baseline: np.ndarray, current: np.ndarray, feature_names: List[str]) -> Dict[str, Any]:
        """
        Population Stability Index (PSI) per feature.
        PSI < 0.10: Stable / No significant change
        0.10 <= PSI <= 0.25: Moderate shift
        PSI > 0.25: Significant drift detected
        """
        feature_psis = {}
        max_psi = 0.0

        for idx, fname in enumerate(feature_names):
            b_feat = baseline[:, idx]
            c_feat = current[:, idx]

            # 5 quantile bins based on baseline
            quantiles = np.percentile(b_feat, [20, 40, 60, 80])
            b_counts, _ = np.histogram(b_feat, bins=[-np.inf] + list(quantiles) + [np.inf])
            c_counts, _ = np.histogram(c_feat, bins=[-np.inf] + list(quantiles) + [np.inf])

            b_pct = np.maximum(b_counts / len(b_feat), 0.0001)
            c_pct = np.maximum(c_counts / len(c_feat), 0.0001)

            psi = np.sum((c_pct - b_pct) * np.log(c_pct / b_pct))
            psi = max(0.0, round(float(psi), 4))
            feature_psis[fname] = psi
            max_psi = max(max_psi, psi)

        return {
            "overall_status": "SIGNIFICANT_DRIFT" if max_psi > 0.25 else ("MODERATE_DRIFT" if max_psi >= 0.10 else "STABLE"),
            "max_psi": max_psi,
            "feature_psis": feature_psis,
            "threshold_interpretation": {
                "< 0.10": "Stable / In Control",
                "0.10 - 0.25": "Moderate Population Shift",
                "> 0.25": "Action Required: Retrain Model"
            }
        }
