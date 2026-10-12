import React, { useState, useEffect } from 'react';
import {
  Brain,
  Play,
  RotateCcw,
  BarChart2,
  TrendingUp,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Layers,
  Sparkles
} from 'lucide-react';
import { bankingApi } from '../services/api';

export const ModelExperimentsView: React.FC = () => {
  const [experiment, setExperiment] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedThreshold, setSelectedThreshold] = useState<number>(0.50);

  const fetchLatestExperiment = async () => {
    try {
      const data = await bankingApi.getLatestMLExperiment();
      setExperiment(data);
    } catch (e) {
      console.error('Failed to load ML experiment', e);
    }
  };

  const handleRunBenchmark = async () => {
    setLoading(true);
    try {
      const res = await bankingApi.runMLExperiment({
        n_samples: 1200,
        test_size: 0.25,
        random_seed: 42
      });
      setExperiment(res);
    } catch (e) {
      console.error('Failed to run ML benchmark', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestExperiment();
  }, []);

  const models = experiment?.models_evaluated || [];
  const thresholdSweep = experiment?.threshold_sweep || [];
  const featureImportances = experiment?.feature_importances || [];
  const drift = experiment?.drift_monitoring;
  const provenance = experiment?.dataset_provenance;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-navy-900/80 border border-sky-950/80 rounded-2xl p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Brain className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-100">Experimental Models Pipeline & Benchmarks</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Reproducible Synthetic Dataset &bull; Rule-Based Baseline &bull; Isolation Forest &bull; Random Forest &bull; Drift Tracking (PSI)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunBenchmark}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-semibold transition-all shadow-lg shadow-purple-950/20 disabled:opacity-50"
          >
            {loading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{loading ? 'Evaluating Pipeline...' : 'Run Benchmark (Seed 42)'}</span>
          </button>
        </div>
      </div>

      {/* Dataset Provenance Card */}
      {provenance && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-navy-900/50 border border-sky-950/80 rounded-2xl text-xs font-mono">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Dataset Version</span>
            <span className="text-slate-200 font-bold">{provenance.dataset_version}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Random Seed</span>
            <span className="text-purple-400 font-bold">{provenance.random_seed} (Reproducible)</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Total / Test Split</span>
            <span className="text-slate-200 font-bold">{provenance.total_samples} / {provenance.test_samples} (25%)</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Synthetic Fraud Rate</span>
            <span className="text-rose-400 font-bold">{provenance.fraud_ratio_pct}% ({provenance.fraud_samples} pos)</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Execution Duration</span>
            <span className="text-emerald-400 font-bold">{experiment.execution_duration_sec}s</span>
          </div>
        </div>
      )}

      {/* Model Comparison Table */}
      <div className="bg-navy-900/70 border border-sky-950/80 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Architecture Benchmark Comparison</span>
          </h2>
          <span className="text-[11px] font-mono text-slate-400">Strict Train/Test Split (No Data Leakage)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-sky-950/80 text-slate-400">
                <th className="pb-3 font-semibold">Model Architecture</th>
                <th className="pb-3 font-semibold">Precision</th>
                <th className="pb-3 font-semibold">Recall</th>
                <th className="pb-3 font-semibold">F1-Score</th>
                <th className="pb-3 font-semibold">False Pos Rate</th>
                <th className="pb-3 font-semibold">ROC-AUC</th>
                <th className="pb-3 font-semibold">PR-AUC</th>
                <th className="pb-3 font-semibold">Latency (p50)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-950/50">
              {models.map((m: any, idx: number) => {
                const isWinner = m.model_name.includes('Random Forest');
                return (
                  <tr key={idx} className={`hover:bg-sky-950/20 ${isWinner ? 'bg-purple-950/20' : ''}`}>
                    <td className="py-3.5 font-bold text-slate-200 flex items-center gap-2">
                      {isWinner && <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                      <span>{m.model_name}</span>
                    </td>
                    <td className="py-3.5 text-emerald-400 font-bold">{(m.precision * 100).toFixed(1)}%</td>
                    <td className="py-3.5 text-sky-400 font-bold">{(m.recall * 100).toFixed(1)}%</td>
                    <td className="py-3.5 text-purple-400 font-bold">{(m.f1_score * 100).toFixed(1)}%</td>
                    <td className="py-3.5 text-slate-300">{(m.false_positive_rate * 100).toFixed(1)}%</td>
                    <td className="py-3.5 text-amber-400">{m.roc_auc.toFixed(3)}</td>
                    <td className="py-3.5 text-teal-400">{m.pr_auc.toFixed(3)}</td>
                    <td className="py-3.5 text-slate-400">{m.inference_latency_ms?.p50_ms} ms</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Threshold Sweep & Feature Importances Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurable Threshold Sweep */}
        <div className="bg-navy-900/70 border border-sky-950/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              <span>Configurable Decision Thresholds</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-400">Random Forest Classifier</span>
          </div>

          <p className="text-xs text-slate-400">
            Tune the classification cutoff threshold to adjust trade-offs between precision and recall.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-sky-950 text-slate-400">
                  <th className="pb-2">Threshold</th>
                  <th className="pb-2">Precision</th>
                  <th className="pb-2">Recall</th>
                  <th className="pb-2">F1</th>
                  <th className="pb-2">Alerts Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-950/40">
                {thresholdSweep.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-sky-950/20">
                    <td className="py-2 font-bold text-sky-400">{row.threshold.toFixed(2)}</td>
                    <td className="py-2 text-emerald-400">{(row.precision * 100).toFixed(1)}%</td>
                    <td className="py-2 text-sky-300">{(row.recall * 100).toFixed(1)}%</td>
                    <td className="py-2 text-purple-400">{row.f1_score.toFixed(3)}</td>
                    <td className="py-2 text-slate-400">{row.flagged_count} txns</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feature Importance Rankings */}
        <div className="bg-navy-900/70 border border-sky-950/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              <span>MDI Feature Importance Ranking</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-400">Mean Decrease in Impurity</span>
          </div>

          <div className="space-y-3">
            {featureImportances.slice(0, 6).map((feat: any, i: number) => {
              const pct = (feat.importance_score * 100).toFixed(1);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300 font-semibold">{feat.feature}</span>
                    <span className="text-emerald-400 font-bold">{pct}%</span>
                  </div>
                  <div className="w-full bg-navy-950 h-2 rounded-full overflow-hidden border border-sky-950">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(5, feat.importance_score * 100))}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block truncate">{feat.description}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Population Stability Index (Drift Monitoring) & Limitations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Drift Monitoring */}
        {drift && (
          <div className="bg-navy-900/70 border border-sky-950/80 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>Feature Drift Monitor (Population Stability Index - PSI)</span>
              </h2>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                drift.overall_status === 'STABLE'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {drift.overall_status} (Max PSI: {drift.max_psi})
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Continuously measures population distribution shift between reference training data and streaming transactions.
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2">
              {Object.entries(drift.feature_psis || {}).slice(0, 6).map(([fname, psi]: any) => (
                <div key={fname} className="p-2 rounded bg-navy-950 border border-sky-950 flex justify-between">
                  <span className="text-slate-400 truncate">{fname}:</span>
                  <span className={psi > 0.25 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                    {psi}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Limitations & Provenance Disclosure */}
        <div className="bg-navy-900/70 border border-sky-950/80 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-4 h-4" />
            <h2 className="text-sm font-bold">Scientific & Ethical Limitations Disclosure</h2>
          </div>
          <p className="text-xs text-slate-300 font-mono leading-relaxed bg-navy-950/80 p-3.5 rounded-xl border border-sky-950">
            {experiment?.limitations_and_ethics ||
              'All evaluations are performed strictly on synthetic simulated transaction distributions. Deterministic core banking ledger balances and authorization rules remain independent of model predictions.'}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Deterministic Separation: Ledgers cannot be bypassed by ML scores.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
