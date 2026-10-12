import React, { useState } from 'react';
import {
  Globe,
  ShieldCheck,
  Cpu,
  Activity,
  Terminal,
  Database,
  BookOpen,
  Cloud,
  Layers,
  ChevronRight
} from 'lucide-react';

export const ArchitectureBlueprint: React.FC = () => {
  const [selectedLayer, setSelectedLayer] = useState<number>(4);

  const layers = [
    {
      num: 1,
      title: 'Banking Channels & Client Touchpoints',
      icon: <Globe className="w-5 h-5 text-sky-400" />,
      color: 'border-sky-500/40 bg-sky-950/20 text-sky-400',
      components: ['Mobile App', 'Web Banking', 'Branch Terminal', 'Call Center', 'RM Portal', 'API Partners'],
      desc: 'Omni-channel touchpoints serving retail, wealth, and institutional customers with synchronized states.'
    },
    {
      num: 2,
      title: 'API Gateway & Security Perimeter',
      icon: <ShieldCheck className="w-5 h-5 text-indigo-400" />,
      color: 'border-indigo-500/40 bg-indigo-950/20 text-indigo-400',
      components: ['API Gateway', 'WAF', 'OAuth2/OIDC', 'Rate Limiting', 'Session Mgmt', 'Threat Protection', 'Trace ID'],
      desc: 'Edge security perimeter enforcing rate limiting, validating JWT tokens, and attaching correlation trace IDs.'
    },
    {
      num: 3,
      title: 'AI Gateway & Control Plane',
      icon: <Cpu className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400',
      components: ['Prompt Management', 'Model Routing', 'Token Budget', 'Guardrails', 'PII Detection', 'Content Safety', 'Human-in-the-Loop'],
      desc: 'Tokenizes sensitive customer PANs/SSNs, monitors inference budgets, and checks prompt injection defense.'
    },
    {
      num: 4,
      title: 'Multi-Agent Orchestration Engine',
      icon: <Activity className="w-5 h-5 text-purple-400" />,
      color: 'border-purple-500/40 bg-purple-950/20 text-purple-400',
      components: [
        '🧠 Supervisor Orchestrator',
        '👤 Customer Agent',
        '🏦 Banking Product Agent',
        '🚨 Risk / Fraud Agent',
        '💳 Credit Agent',
        '⚖️ Compliance Agent',
        '📊 Financial Advisory Agent',
        '🔍 Research Agent',
        '📄 Document Agent',
        '🔔 Notification Agent'
      ],
      desc: 'Supervisor performs intent classification, plans DAG workflows, selects agents, and validates consensus.'
    },
    {
      num: 5,
      title: 'Agent Tooling & MCP Integration',
      icon: <Terminal className="w-5 h-5 text-pink-400" />,
      color: 'border-pink-500/40 bg-pink-950/20 text-pink-400',
      components: ['Tool Registry', 'MCP Gateway', 'Authorization', 'Schema Validation', 'Tool Sandbox', 'Approval Matrix', 'Audit Logging'],
      desc: 'Sandboxed Model Context Protocol (MCP) execution engine enforcing strict permission boundaries and schema validation.'
    },
    {
      num: 6,
      title: 'Enterprise Core Banking & Data Ledger',
      icon: <Database className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/40 bg-amber-950/20 text-amber-400',
      components: ['Core Banking Ledger', 'Customer 360', 'CRM Store', 'Loans System', 'Real-time Transactions'],
      desc: 'ACID double-entry ledger, customer demographic store, and relational transaction pipeline.'
    },
    {
      num: 7,
      title: 'Knowledge Base & Regulatory RAG',
      icon: <BookOpen className="w-5 h-5 text-teal-400" />,
      color: 'border-teal-500/40 bg-teal-950/20 text-teal-400',
      components: ['FATF Policy Docs', 'SOPs', 'Basel III Regulations', 'Loan Underwriting Guidelines', 'BM25 + Semantic Vector Search'],
      desc: 'Retrieval-Augmented Generation grounding multi-agent reasoning on official bank policies with citations.'
    },
    {
      num: 8,
      title: 'External Banking Networks & Integrations',
      icon: <Cloud className="w-5 h-5 text-blue-400" />,
      color: 'border-blue-500/40 bg-blue-950/20 text-blue-400',
      components: ['Credit Bureau (Experian/CIBIL)', 'Payment Networks (SWIFT/ACH)', 'Market Data Feed', 'OFAC / PEP Watchlists'],
      desc: 'External third-party verification feeds for credit scoring, real-time sanctions screening, and market prices.'
    },
    {
      num: 9,
      title: 'Production Telemetry & Observability Platform',
      icon: <Layers className="w-5 h-5 text-rose-400" />,
      color: 'border-rose-500/40 bg-rose-950/20 text-rose-400',
      components: ['Observability (OpenTelemetry)', 'Evaluation & Groundedness', 'Security & Zero Trust', 'FinOps & Token Costs', 'P95/P99 Telemetry'],
      desc: 'Distributed trace spans, token expenditure accounting, latency budgets, and SLA monitoring.'
    }
  ];

  const current = layers.find((l) => l.num === selectedLayer) || layers[3];

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            Real-Time Banking System Reference Blueprint
          </h2>
          <p className="text-xs text-slate-400">
            Click on any architectural domain below to inspect its components, protocols, and data contracts.
          </p>
        </div>
        <div className="text-xs text-slate-400 px-3 py-1.5 rounded-lg bg-navy-950/80 border border-slate-800 font-mono">
          Domain Selected: <strong className="text-sky-400">{current.title}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Architecture Stack Overview */}
        <div className="lg:col-span-7 flex flex-col gap-2.5">
          {layers.map((layer) => {
            const isSelected = selectedLayer === layer.num;
            return (
              <div
                key={layer.num}
                onClick={() => setSelectedLayer(layer.num)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? `${layer.color} border-l-4 shadow-md`
                    : 'bg-navy-900/60 border-slate-800/80 hover:bg-slate-800/40 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-700/40">
                    {layer.icon}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-100">{layer.title}</h3>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{layer.desc}</p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'translate-x-1 text-sky-400' : 'text-slate-500'}`} />
              </div>
            );
          })}
        </div>

        {/* Right: Selected Domain Deep Dive */}
        <div className="lg:col-span-5 glass-card p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60">
              {current.icon}
            </div>
            <div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                ACTIVE DOMAIN
              </span>
              <h3 className="text-sm font-bold text-slate-100 mt-1">{current.title}</h3>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-300 mb-1">Architecture Function</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{current.desc}</p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-300 mb-2.5">Integrated Components</h4>
            <div className="flex flex-wrap gap-2">
              {current.components.map((comp, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2.5 py-1 rounded-md bg-navy-950 border border-slate-700/60 text-slate-200 font-mono"
                >
                  {comp}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-auto p-3.5 rounded-lg bg-navy-950/70 border border-slate-800/80 text-[11px] text-slate-400">
            <div className="font-semibold text-sky-400 mb-1">Production Verification</div>
            Every component in this domain is actively wired to the FastAPI backend and telemetry tracer.
          </div>
        </div>
      </div>
    </div>
  );
};
