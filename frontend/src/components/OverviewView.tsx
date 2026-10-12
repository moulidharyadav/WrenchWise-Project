import React, { useState, useEffect } from 'react';
import {
  Users,
  Wallet,
  ArrowUpRight,
  ShieldAlert,
  FileCheck,
  TrendingUp,
  Activity,
  RefreshCw,
  Layers,
  Sparkles,
  CreditCard,
  Building,
  Smartphone,
  PhoneCall,
  UserCheck,
  Network
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import { DashboardSummary } from '../types';
import { bankingApi } from '../services/api';

interface OverviewViewProps {
  onNavigateTab: (tab: string) => void;
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  WEB: <Building className="w-4 h-4 text-sky-400" />,
  MOBILE: <Smartphone className="w-4 h-4 text-emerald-400" />,
  BRANCH: <Building className="w-4 h-4 text-purple-400" />,
  CALL_CENTER: <PhoneCall className="w-4 h-4 text-amber-400" />,
  RM_PORTAL: <UserCheck className="w-4 h-4 text-teal-400" />,
  API: <Network className="w-4 h-4 text-indigo-400" />
};

const COLORS = ['#38bdf8', '#34d399', '#a78bfa', '#fbbf24', '#2dd4bf', '#818cf8'];

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigateTab }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [sum, act] = await Promise.all([
        bankingApi.getDashboardSummary(),
        bankingApi.getDashboardActivity(12)
      ]);
      setSummary(sum);
      setActivities(act.activities || []);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 15000);
    return () => clearInterval(interval);
  }, []);

  const channelChartData = summary?.channel_distribution
    ? Object.entries(summary.channel_distribution).map(([name, value]) => ({
        name,
        value: Number(value)
      }))
    : [];

  const kpis = [
    {
      title: 'Total Core Deposits',
      value: summary ? `$${summary.total_deposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '$0.00',
      subtitle: `${summary?.total_accounts || 0} active accounts across 5 customer tiers`,
      icon: <Wallet className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500/20 bg-emerald-500/5',
      tab: 'customers'
    },
    {
      title: 'Cleared Transactions',
      value: summary ? summary.cleared_transactions.toString() : '0',
      subtitle: `Out of ${summary?.total_transactions || 0} total ledger postings`,
      icon: <FileCheck className="w-5 h-5 text-sky-400" />,
      color: 'border-sky-500/20 bg-sky-500/5',
      tab: 'transactions'
    },
    {
      title: 'Flagged Risk & Fraud',
      value: summary ? summary.flagged_transactions.toString() : '0',
      subtitle: 'Velocity anomalies & sanction alerts',
      icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
      color: 'border-rose-500/20 bg-rose-500/5',
      tab: 'risk'
    },
    {
      title: 'Human-in-the-Loop Reviews',
      value: summary ? summary.pending_hitl_tickets.toString() : '0',
      subtitle: 'Awaiting Compliance Officer sign-off',
      icon: <Activity className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/20 bg-amber-500/5',
      tab: 'risk'
    },
    {
      title: 'Simulated Customers',
      value: summary ? summary.total_customers.toString() : '0',
      subtitle: 'Full KYC & Credit Score profiles seeded',
      icon: <Users className="w-5 h-5 text-cyan-400" />,
      color: 'border-cyan-500/20 bg-cyan-500/5',
      tab: 'customers'
    },
    {
      title: 'Configured Banking Products',
      value: summary ? summary.active_banking_products.toString() : '0',
      subtitle: 'Savings, Fixed Deposits, Cards & Mortgages',
      icon: <CreditCard className="w-5 h-5 text-purple-400" />,
      color: 'border-purple-500/20 bg-purple-500/5',
      tab: 'loans'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-gradient-to-r from-navy-900/90 via-slate-900/80 to-navy-950/90 border border-sky-500/20 backdrop-blur-md shadow-lg shadow-sky-950/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-400">
              Double-Entry Ledger: {summary?.ledger_balanced ? 'RECONCILED (ZERO DISCREPANCY)' : 'PENDING'}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Wrench Wise AI Banking Operations Console
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Real-time multi-agent supervisor coordinating customer operations, fraud surveillance, RAG-grounded advisory, and automated underwriting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-slate-400 block font-mono">
              Last Sync: {lastRefreshed.toLocaleTimeString()}
            </span>
            <span className="text-[11px] text-sky-400 font-mono">SQLite Persistent Engine</span>
          </div>
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-medium transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            onClick={() => onNavigateTab(kpi.tab)}
            className={`p-4 rounded-xl border ${kpi.color} backdrop-blur-sm cursor-pointer transition hover:translate-y-[-2px] hover:shadow-md hover:border-sky-400/40`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-300">{kpi.title}</span>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-700/50">
                {kpi.icon}
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{kpi.value}</div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>{kpi.subtitle}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Channel Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Channel Volume Breakdown */}
        <div className="p-5 rounded-xl bg-navy-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Channel Distribution</h3>
              <p className="text-xs text-slate-400">Transactions received across simulated touchpoints</p>
            </div>
            <Layers className="w-4 h-4 text-sky-400" />
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {channelChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800">
            {channelChartData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs p-1.5 rounded bg-slate-900/50">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-slate-300 font-mono text-[11px]">{item.name}</span>
                </div>
                <span className="font-semibold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Multi-Agent Operations Stream */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-navy-900/60 border border-slate-800 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Live Activity & Ledger Feed</h3>
              <p className="text-xs text-slate-400">Real-time audit log from multi-agent executions and transactions</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-emerald-400 font-mono">SSE Stream Active</span>
            </div>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[300px] pr-1">
            {activities.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500">
                No recent activity recorded yet.
              </div>
            ) : (
              activities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-lg bg-navy-950/80 border border-slate-800/80 hover:border-sky-500/30 transition flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-slate-900 border border-slate-700/60">
                      {act.type === 'TRANSACTION' ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-sky-400" />
                      ) : act.type === 'AGENT_RUN' ? (
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Activity className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-slate-200">{act.title}</div>
                      <div className="text-[11px] text-slate-400">{act.detail}</div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                        act.status === 'CLEARED' || act.status === 'SUCCESS' || act.status === 'COMPLETED'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : act.status === 'FLAGGED'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {act.status}
                    </span>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      {new Date(act.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* System Navigation Quick Jump */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Operations Quick Jump & Workflow Verification
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            { label: 'AI Command Center', tab: 'command', icon: <Sparkles className="w-3.5 h-3.5" /> },
            { label: 'Customers & Accounts', tab: 'customers', icon: <Users className="w-3.5 h-3.5" /> },
            { label: 'Simulate Transactions', tab: 'transactions', icon: <ArrowUpRight className="w-3.5 h-3.5" /> },
            { label: 'Risk & Fraud Engine', tab: 'risk', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
            { label: 'Credit & Loans', tab: 'loans', icon: <TrendingUp className="w-3.5 h-3.5" /> },
            { label: 'Knowledge Base / RAG', tab: 'knowledge', icon: <Layers className="w-3.5 h-3.5" /> },
            { label: 'AI Control Plane', tab: 'settings', icon: <Activity className="w-3.5 h-3.5" /> },
          ].map((item) => (
            <button
              key={item.tab}
              onClick={() => onNavigateTab(item.tab)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-navy-900 hover:bg-sky-500/20 border border-slate-700/60 hover:border-sky-500/40 text-slate-300 hover:text-sky-300 text-xs font-medium transition cursor-pointer"
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
