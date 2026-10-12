import React from 'react';
import { TelemetryMetrics } from '../types';
import { Activity, Clock, Coins, ShieldCheck, Zap } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface FinOpsTelemetryViewProps {
  telemetry: TelemetryMetrics | null;
}

export const FinOpsTelemetryView: React.FC<FinOpsTelemetryViewProps> = ({ telemetry }) => {
  const chartData = [
    { time: '10:00', p95: 58, cost: 0.02 },
    { time: '10:30', p95: 64, cost: 0.05 },
    { time: '11:00', p95: 72, cost: 0.08 },
    { time: '11:30', p95: 61, cost: 0.11 },
    { time: '12:00', p95: 68, cost: 0.14 },
    { time: '12:30', p95: 65, cost: 0.1425 },
  ];

  if (!telemetry) {
    return <div className="glass-card p-8 text-center text-slate-500 text-xs">Loading telemetry...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          Cross-Cutting Observability & FinOps Platform
        </h2>
        <p className="text-xs text-slate-400">
          Real-time OpenTelemetry trace spans, P95 latency distribution, and token expenditure accounting.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400">P95 Latency</span>
            <div className="text-lg font-bold text-slate-100 font-mono">{telemetry.p95_latency_ms} ms</div>
            <span className="text-[10px] text-emerald-400">Target &lt;250ms</span>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400">SLA Availability</span>
            <div className="text-lg font-bold text-slate-100 font-mono">{telemetry.sla_uptime_pct}%</div>
            <span className="text-[10px] text-slate-400">Error rate: {telemetry.error_rate_pct}%</span>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400">FinOps Spend Today</span>
            <div className="text-lg font-bold text-slate-100 font-mono">${telemetry.token_spend_today_usd.toFixed(4)}</div>
            <span className="text-[10px] text-slate-400">Budget: 500k tokens</span>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400">Active Traces</span>
            <div className="text-lg font-bold text-slate-100 font-mono">{telemetry.active_trace_count}</div>
            <span className="text-[10px] text-purple-400">OpenTelemetry Gen</span>
          </div>
        </div>
      </div>

      {/* Latency & FinOps Chart */}
      <div className="glass-card p-5">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">
          Real-Time Latency & Cumulative Inference Cost (Telemetry Stream)
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorP95" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0b1329', borderColor: '#334155', fontSize: '11px' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Area type="monotone" dataKey="p95" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#colorP95)" name="P95 Latency (ms)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active Model Routing Matrix */}
      <div className="glass-card p-5">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
          Active Experimental Model Routing Matrix
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {telemetry.active_models.map((m, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-navy-950 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="font-mono font-bold text-sky-400">{m.model}</span>
                <p className="text-[11px] text-slate-400 mt-0.5">{m.role}</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {m.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
