import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap,
  Sliders,
  Sparkles,
  Layers,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { bankingApi } from '../services/api';

export const RiskAssessmentView: React.FC = () => {
  // Feature vector state
  const [amount, setAmount] = useState<number>(9500.0);
  const [hourOfDay, setHourOfDay] = useState<number>(3);
  const [velocity1h, setVelocity1h] = useState<number>(4);
  const [velocity24h, setVelocity24h] = useState<number>(7);
  const [distanceKm, setDistanceKm] = useState<number>(4800.0);
  const [deviceRisk, setDeviceRisk] = useState<number>(0.85);
  const [isNewCounterparty, setIsNewCounterparty] = useState<number>(1);
  const [internationalFlag, setInternationalFlag] = useState<number>(1);
  const [failedPin, setFailedPin] = useState<number>(2);

  const [loading, setLoading] = useState<boolean>(false);
  const [assessment, setAssessment] = useState<any | null>(null);

  const applyPreset = (preset: string) => {
    if (preset === 'LEGIT_GROCERY') {
      setAmount(85.50);
      setHourOfDay(14);
      setVelocity1h(1);
      setVelocity24h(2);
      setDistanceKm(4.2);
      setDeviceRisk(0.08);
      setIsNewCounterparty(0);
      setInternationalFlag(0);
      setFailedPin(0);
    } else if (preset === 'SUSPICIOUS_OFFSHORE') {
      setAmount(9850.0);
      setHourOfDay(2);
      setVelocity1h(3);
      setVelocity24h(5);
      setDistanceKm(6200.0);
      setDeviceRisk(0.82);
      setIsNewCounterparty(1);
      setInternationalFlag(1);
      setFailedPin(1);
    } else if (preset === 'VELOCITY_BURST') {
      setAmount(1200.0);
      setHourOfDay(16);
      setVelocity1h(8);
      setVelocity24h(12);
      setDistanceKm(35.0);
      setDeviceRisk(0.45);
      setIsNewCounterparty(1);
      setInternationalFlag(0);
      setFailedPin(3);
    }
  };

  const handlePredict = async () => {
    setLoading(true);
    try {
      const res = await bankingApi.predictTransactionRisk({
        amount,
        hour_of_day: hourOfDay,
        velocity_1h: velocity1h,
        velocity_24h: velocity24h,
        distance_from_home_km: distanceKm,
        device_risk_score: deviceRisk,
        is_new_counterparty: isNewCounterparty,
        international_flag: internationalFlag,
        failed_pin_attempts_24h: failedPin
      });
      setAssessment(res);
    } catch (e) {
      console.error('Prediction failed', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-navy-900/80 border border-sky-950/80 rounded-2xl p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-100">Real-Time Transaction Risk Assessment</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate feature vectors & evaluate multi-model consensus (Rule-Based + Isolation Forest + Random Forest) in real time.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono text-slate-400">Presets:</span>
          <button
            onClick={() => applyPreset('LEGIT_GROCERY')}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs hover:bg-emerald-500/20"
          >
            Legit Retail ($85.50)
          </button>
          <button
            onClick={() => applyPreset('SUSPICIOUS_OFFSHORE')}
            className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs hover:bg-rose-500/20"
          >
            Offshore Wire ($9,850)
          </button>
          <button
            onClick={() => applyPreset('VELOCITY_BURST')}
            className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs hover:bg-amber-500/20"
          >
            Velocity Spike (8 tx/hr)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Feature Sliders Console */}
        <div className="lg:col-span-7 bg-navy-900/70 border border-sky-950/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-sky-950 pb-3">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              <span>Transaction Feature Vector Generator</span>
            </h2>
            <button
              onClick={handlePredict}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold transition-all disabled:opacity-50"
            >
              {loading ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>Score Transaction</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Amount */}
            <div className="space-y-1.5 p-3 rounded-xl bg-navy-950/80 border border-sky-950">
              <div className="flex justify-between">
                <span className="text-slate-400">Amount (USD)</span>
                <span className="text-sky-300 font-bold">${amount.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="10"
                max="25000"
                step="50"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full accent-sky-400"
              />
            </div>

            {/* Hour of Day */}
            <div className="space-y-1.5 p-3 rounded-xl bg-navy-950/80 border border-sky-950">
              <div className="flex justify-between">
                <span className="text-slate-400">Hour of Day (UTC)</span>
                <span className="text-sky-300 font-bold">{hourOfDay}:00</span>
              </div>
              <input
                type="range"
                min="0"
                max="23"
                value={hourOfDay}
                onChange={(e) => setHourOfDay(Number(e.target.value))}
                className="w-full accent-sky-400"
              />
            </div>

            {/* Velocity 1h */}
            <div className="space-y-1.5 p-3 rounded-xl bg-navy-950/80 border border-sky-950">
              <div className="flex justify-between">
                <span className="text-slate-400">1-Hour Velocity</span>
                <span className="text-amber-400 font-bold">{velocity1h} txns</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                value={velocity1h}
                onChange={(e) => setVelocity1h(Number(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>

            {/* Velocity 24h */}
            <div className="space-y-1.5 p-3 rounded-xl bg-navy-950/80 border border-sky-950">
              <div className="flex justify-between">
                <span className="text-slate-400">24-Hour Velocity</span>
                <span className="text-amber-400 font-bold">{velocity24h} txns</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={velocity24h}
                onChange={(e) => setVelocity24h(Number(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>

            {/* Distance KM */}
            <div className="space-y-1.5 p-3 rounded-xl bg-navy-950/80 border border-sky-950">
              <div className="flex justify-between">
                <span className="text-slate-400">Distance from Home</span>
                <span className="text-purple-400 font-bold">{distanceKm.toLocaleString()} km</span>
              </div>
              <input
                type="range"
                min="0"
                max="12000"
                step="50"
                value={distanceKm}
                onChange={(e) => setDistanceKm(Number(e.target.value))}
                className="w-full accent-purple-400"
              />
            </div>

            {/* Device Risk Score */}
            <div className="space-y-1.5 p-3 rounded-xl bg-navy-950/80 border border-sky-950">
              <div className="flex justify-between">
                <span className="text-slate-400">Device Risk (0.0-1.0)</span>
                <span className="text-rose-400 font-bold">{deviceRisk.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={deviceRisk}
                onChange={(e) => setDeviceRisk(Number(e.target.value))}
                className="w-full accent-rose-400"
              />
            </div>
          </div>

          {/* Binary Flags */}
          <div className="grid grid-cols-3 gap-3 text-xs font-mono pt-2">
            <button
              onClick={() => setIsNewCounterparty(isNewCounterparty ? 0 : 1)}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                isNewCounterparty
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 font-bold'
                  : 'bg-navy-950 border-sky-950 text-slate-400'
              }`}
            >
              New Counterparty: {isNewCounterparty ? 'YES (+)' : 'NO'}
            </button>

            <button
              onClick={() => setInternationalFlag(internationalFlag ? 0 : 1)}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                internationalFlag
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 font-bold'
                  : 'bg-navy-950 border-sky-950 text-slate-400'
              }`}
            >
              Cross-Border Intl: {internationalFlag ? 'YES (+)' : 'NO'}
            </button>

            <div className="p-2.5 rounded-xl bg-navy-950 border border-sky-950 flex items-center justify-between">
              <span className="text-slate-400">PIN Fails:</span>
              <select
                value={failedPin}
                onChange={(e) => setFailedPin(Number(e.target.value))}
                className="bg-navy-900 border border-sky-950 rounded px-2 py-0.5 text-slate-100"
              >
                <option value={0}>0</option>
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3+</option>
              </select>
            </div>
          </div>
        </div>

        {/* Assessment Scoring Display */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-navy-900/70 border border-sky-950/80 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-sky-950 pb-3">
              <Activity className="w-4 h-4 text-rose-400" />
              <span>Multi-Model Consensus Scoring</span>
            </h2>

            {!assessment ? (
              <div className="p-8 text-center bg-navy-950/60 rounded-xl border border-sky-950 text-slate-400 text-xs">
                Click "Score Transaction" to evaluate the feature vector against the models.
              </div>
            ) : (
              <div className="space-y-4 font-mono">
                {/* Composite Score Meter */}
                <div className="p-4 rounded-xl bg-navy-950 border border-sky-950 text-center space-y-2">
                  <span className="text-xs text-slate-400 block uppercase tracking-wider">Composite Anomaly Score</span>
                  <div className={`text-4xl font-extrabold ${
                    assessment.risk_level === 'CRITICAL' ? 'text-rose-400' :
                    assessment.risk_level === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {assessment.composite_risk_score} / 100
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                      assessment.risk_level === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      assessment.risk_level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {assessment.risk_level} RISK
                    </span>
                    <span className="text-xs text-slate-400">
                      Recommendation: <strong className="text-slate-200">{assessment.action_recommendation}</strong>
                    </span>
                  </div>
                </div>

                {/* Sub-Model Breakdown */}
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded bg-navy-950/80 border border-sky-950 flex justify-between items-center">
                    <span className="text-slate-400">Random Forest Fraud Prob (40% wt):</span>
                    <span className="text-purple-400 font-bold">
                      {(assessment.model_breakdown?.random_forest_fraud_prob * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-navy-950/80 border border-sky-950 flex justify-between items-center">
                    <span className="text-slate-400">Isolation Forest Outlier Score (25% wt):</span>
                    <span className="text-sky-400 font-bold">
                      {(assessment.model_breakdown?.isolation_forest_anomaly_score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-navy-950/80 border border-sky-950 flex justify-between items-center">
                    <span className="text-slate-400">Rule-Based Baseline Score (35% wt):</span>
                    <span className="text-amber-400 font-bold">
                      {(assessment.model_breakdown?.rule_based_score * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Rules Triggered */}
                {assessment.model_breakdown?.rules_triggered?.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wide">Rules Triggered:</span>
                    <div className="space-y-1">
                      {assessment.model_breakdown.rules_triggered.map((r: string, idx: number) => (
                        <div key={idx} className="p-2 rounded bg-rose-950/30 border border-rose-900/50 text-rose-300 text-[11px]">
                          &bull; {r}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Deterministic Banking Safety Card */}
          <div className="p-4 rounded-xl bg-navy-900/40 border border-sky-950 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Deterministic Ledger Independence</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Model scores inform risk monitoring and trigger human reviews. However, double-entry ledger balance invariants and atomic transaction verification remain 100% deterministic and cannot be bypassed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
