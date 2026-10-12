import React, { useState, useEffect } from 'react';
import {
  Sliders,
  ShieldCheck,
  Cpu,
  Activity,
  Lock,
  Eye,
  Key,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Server,
  Layers,
  Database
} from 'lucide-react';
import { TelemetryMetrics } from '../types';
import { bankingApi } from '../services/api';

interface SettingsViewProps {
  activeModel: string;
  setActiveModel: (m: string) => void;
  telemetry: TelemetryMetrics | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  activeModel,
  setActiveModel,
  telemetry
}) => {
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadControlPlane = async () => {
    setLoading(true);
    try {
      const [status, metrics, toolList] = await Promise.all([
        bankingApi.getSystemStatus(),
        bankingApi.getSystemMetrics(),
        bankingApi.getTools()
      ]);
      setSystemStatus(status);
      setSystemMetrics(metrics);
      setTools(toolList);
    } catch (err) {
      console.error('Failed to load control plane', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadControlPlane();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-navy-900/60 border border-slate-800 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30 font-mono">
              AI CONTROL PLANE
            </span>
            <span className="text-xs text-slate-400">Model Routing, PII Guardrails, FinOps & Tool Policy Matrix</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            AI Gateway & Governance Configuration
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Centralized policy controls, model execution budgets, PII scrubbing verification, and tool execution allowlists.
          </p>
        </div>

        <button
          onClick={loadControlPlane}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-medium transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Primary Configuration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Provider & Routing */}
        <div className="p-5 rounded-xl bg-navy-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Cpu className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-white">Active Model & Gateway Routing</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Current Active Model</label>
              <select
                value={activeModel}
                onChange={(e) => setActiveModel(e.target.value)}
                className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono outline-none focus:border-sky-400"
              >
                <option value="gemini-2.5-pro-experimental">Gemini 2.5 Pro (Experimental)</option>
                <option value="gemini-2.5-flash-experimental">Gemini 2.5 Flash (Experimental)</option>
                <option value="gemini-2.0-flash-thinking-exp">Gemini 2.0 Flash Thinking</option>
                <option value="deterministic-banking-expert">Deterministic Banking Expert (Offline Safe)</option>
              </select>
            </div>

            <div className="p-3 rounded-lg bg-navy-950 border border-slate-800 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Execution Mode:</span>
                <span className="text-emerald-400 font-semibold">
                  {systemStatus?.mode || 'HYBRID (API + DETERMINISTIC)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Prompt Registry Version:</span>
                <span className="text-sky-400">v2.4.1-banking-core</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fallback Strategy:</span>
                <span className="text-slate-200">Instant Rule-Based Failover</span>
              </div>
            </div>
          </div>
        </div>

        {/* Token Accounting & Budget Limits */}
        <div className="p-5 rounded-xl bg-navy-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">FinOps & Per-Request Budget</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-navy-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Max Tokens / Turn</span>
                <span className="text-base font-bold text-white font-mono">4,096</span>
              </div>
              <div className="p-2.5 rounded-lg bg-navy-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Model Calls Budget</span>
                <span className="text-base font-bold text-sky-400 font-mono">10 / Request</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-navy-950 border border-slate-800 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Tokens Today:</span>
                <span className="text-white font-semibold">
                  {systemMetrics?.tokens_consumed?.toLocaleString() || '142,890'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cost Ceiling:</span>
                <span className="text-emerald-400">$50.00 / day (Active)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Avg Latency (P95):</span>
                <span className="text-amber-400">{telemetry?.p95_latency_ms || 240} ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* PII Protection & Guardrails */}
        <div className="p-5 rounded-xl bg-navy-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Security & Guardrails</h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-navy-950 border border-slate-800">
              <span className="text-slate-300">PII Redaction (PAN, SSN, CVV)</span>
              <span className="text-emerald-400 font-bold font-mono">ENFORCED</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-navy-950 border border-slate-800">
              <span className="text-slate-300">Pydantic Schema Validation</span>
              <span className="text-emerald-400 font-bold font-mono">STRICT</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-navy-950 border border-slate-800">
              <span className="text-slate-300">Arbitrary Code / SQL Execution</span>
              <span className="text-rose-400 font-bold font-mono">BLOCKED</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-navy-950 border border-slate-800">
              <span className="text-slate-300">HITL Escalation Threshold</span>
              <span className="text-amber-400 font-bold font-mono">Risk &gt; 70</span>
            </div>
          </div>
        </div>
      </div>

      {/* Layer 5 Sandboxed Tools Policy Matrix */}
      <div className="p-5 rounded-xl bg-navy-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-sky-400" />
              <span>Sandboxed Tool Permission & Execution Matrix ({tools.length})</span>
            </h3>
            <p className="text-xs text-slate-400">Strict allowlist governing agent tool invocations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tools.map((tool) => (
            <div
              key={tool.name}
              className="p-3.5 rounded-lg bg-navy-950/80 border border-slate-800 text-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-semibold text-sky-300 text-[11px]">{tool.name}</span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    tool.is_state_changing
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {tool.is_state_changing ? 'STATE CHANGING' : 'READ ONLY'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2">{tool.description}</p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono">
                <span>Timeout: {tool.timeout_seconds || 5}s</span>
                <span>Permission: {tool.permission_required || 'AGENT_CORE'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
