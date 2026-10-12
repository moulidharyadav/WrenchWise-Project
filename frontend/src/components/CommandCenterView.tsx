import React, { useState, useEffect } from 'react';
import {
  BankingChannel,
  AgentTrajectory,
  AgentCatalogItem
} from '../types';
import { bankingApi } from '../services/api';
import { AgentTrajectoryViewer } from './AgentTrajectoryViewer';
import {
  Send,
  Sparkles,
  DollarSign,
  AlertTriangle,
  FileText,
  Shield,
  TrendingUp,
  Activity,
  Layers,
  Cpu,
  Search,
  Bell,
  BookOpen,
  Terminal,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';

interface CommandCenterViewProps {
  onOrchestrate: (prompt: string, channel: BankingChannel) => Promise<void>;
  trajectory: AgentTrajectory | null;
  loading: boolean;
  agents: AgentCatalogItem[];
  channel: BankingChannel;
  setChannel: (c: BankingChannel) => void;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  onOrchestrate,
  trajectory,
  loading,
  agents,
  channel,
  setChannel
}) => {
  const [prompt, setPrompt] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'CONSOLE' | 'AGENTS' | 'AUDIT_TOOLS'>('CONSOLE');
  const [toolLogs, setToolLogs] = useState<any[]>([]);
  const [loadingTools, setLoadingTools] = useState(false);

  // The 7 Required Demonstration Scenarios
  const demonstrationScenarios = [
    {
      id: 'account_inquiry',
      title: 'Account Inquiry',
      badge: 'Customer Agent',
      icon: <FileText className="w-4 h-4 text-sky-400" />,
      prompt: 'What is my current checking account balance and recent transactions?'
    },
    {
      id: 'product_request',
      title: 'Product Information Request',
      badge: 'Product Agent',
      icon: <Search className="w-4 h-4 text-purple-400" />,
      prompt: 'Show me high-yield savings accounts and certificate of deposit interest rates.'
    },
    {
      id: 'loan_simulation',
      title: 'Loan Eligibility Simulation',
      badge: 'Credit Underwriting',
      icon: <DollarSign className="w-4 h-4 text-emerald-400" />,
      prompt: 'I want to apply for a $25,000 personal loan for 24 months. Please check my credit score, calculate my monthly EMI, and underwrite my application.'
    },
    {
      id: 'suspicious_transfer',
      title: 'Suspicious Transaction Investigation',
      badge: 'Fraud & HITL Shield',
      icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
      prompt: 'Wire transfer $49,990 from checking account ACC-1002341 to Nassau Maritime Holdings Ltd in Larnaca Cyprus.'
    },
    {
      id: 'compliance_policy',
      title: 'Compliance Policy Question',
      badge: 'AML & FATF RAG',
      icon: <Shield className="w-4 h-4 text-teal-400" />,
      prompt: 'What are our FATF Recommendation 16 and AML wire transfer reporting requirements?'
    },
    {
      id: 'document_summary',
      title: 'Document Summarization',
      badge: 'Document Agent OCR',
      icon: <BookOpen className="w-4 h-4 text-amber-400" />,
      prompt: 'Ingest and summarize the employee W2 payslip: Employer TechGlobal Inc, Monthly Gross $8,500 USD, Tax Withheld $1,820 USD.'
    },
    {
      id: 'notification_alert',
      title: 'Notification Generation',
      badge: 'Notification Dispatch',
      icon: <Bell className="w-4 h-4 text-indigo-400" />,
      prompt: 'Send urgent security alert: unauthorized login attempt detected from unrecognized IP.'
    }
  ];

  const fetchToolLogs = async () => {
    setLoadingTools(true);
    try {
      const res = await fetch('/api/v1/agents/tool-calls?limit=30');
      const data = await res.json();
      setToolLogs(data || []);
    } catch (e) {
      console.error('Failed to load tool call audit', e);
    } finally {
      setLoadingTools(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'AUDIT_TOOLS') {
      fetchToolLogs();
    }
  }, [activeSubTab]);

  const handleScenarioClick = (p: string) => {
    setPrompt(p);
    onOrchestrate(p, channel);
  };

  const activeAgentSet = new Set(trajectory?.participating_agents || ['SUPERVISOR']);

  return (
    <div className="flex flex-col gap-6">
      {/* Omni-Channel Ribbon (Layer 1) */}
      <div className="glass-card p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300">Banking Channel:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['WEB', 'MOBILE', 'BRANCH', 'CALL_CENTER', 'RM_PORTAL', 'API_PARTNERS'] as BankingChannel[]).map((ch) => (
              <button
                key={ch}
                onClick={() => setChannel(ch)}
                className={`text-xs px-2.5 py-1 rounded-md font-mono font-semibold transition-all ${
                  channel === ch
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                    : 'bg-navy-950/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        {/* View Switcher Sub-Tabs */}
        <div className="flex items-center gap-1 bg-navy-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveSubTab('CONSOLE')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              activeSubTab === 'CONSOLE'
                ? 'bg-sky-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            AI Assistant & Timeline
          </button>
          <button
            onClick={() => setActiveSubTab('AGENTS')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              activeSubTab === 'AGENTS'
                ? 'bg-sky-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            9-Agent Matrix
          </button>
          <button
            onClick={() => setActiveSubTab('AUDIT_TOOLS')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              activeSubTab === 'AUDIT_TOOLS'
                ? 'bg-sky-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            MCP Tool Audit Log
          </button>
        </div>
      </div>

      {activeSubTab === 'CONSOLE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Natural Language Prompt Console + 7 Scenarios */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Prompt Console */}
            <div className="glass-card p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  Supervisor AI Assistant
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Deterministic Fallback: READY</span>
              </div>

              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter any banking instruction or select a pre-configured scenario below..."
                className="w-full bg-navy-950 border border-slate-700/80 rounded-lg p-3 text-xs text-slate-100 outline-none focus:border-sky-400 resize-none font-sans"
              />

              <button
                onClick={() => onOrchestrate(prompt, channel)}
                disabled={loading || !prompt.trim()}
                className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-sky-600/20"
              >
                {loading ? <Activity className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {loading ? 'Supervisor Orchestrating DAG Workflow...' : 'Execute Multi-Agent Workflow'}
              </button>
            </div>

            {/* All 7 Demonstration Scenarios Quick-Launch */}
            <div className="glass-card p-5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Demonstration Scenarios ({demonstrationScenarios.length})
                </h3>
                <span className="text-[10px] text-sky-400">1-Click Launch</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-1">
                Trigger each required banking multi-agent workflow:
              </p>

              {demonstrationScenarios.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => handleScenarioClick(sc.prompt)}
                  disabled={loading}
                  className="p-2.5 rounded-lg bg-navy-950/70 border border-slate-800 hover:border-sky-500/40 hover:bg-slate-800/40 text-left transition-all flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                      {sc.icon}
                      {sc.title}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                      {sc.badge}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 line-clamp-1">{sc.prompt}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Active Agents Matrix + Trajectory Viewer */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Active Agents Mini Grid */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  Engaged Agents in Workflow
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {activeAgentSet.size} Active in Pipeline
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {agents.map((ag) => {
                  const isActive = activeAgentSet.has(ag.id);
                  return (
                    <div
                      key={ag.id}
                      className={`p-2 rounded-lg border text-xs flex items-center gap-2 transition-all ${
                        isActive
                          ? 'bg-purple-950/30 border-purple-500/50 text-purple-200 shadow-sm shadow-purple-500/20'
                          : 'bg-navy-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="text-base">{ag.avatar}</span>
                      <div className="truncate">
                        <div className="font-semibold truncate text-[11px]">{ag.name.replace(' Agent', '')}</div>
                        <div className="text-[9px] font-mono opacity-80">{isActive ? 'ENGAGED' : 'STANDBY'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step-by-Step Trajectory Viewer */}
            <AgentTrajectoryViewer trajectory={trajectory} loading={loading} />
          </div>
        </div>
      )}

      {/* View Sub-Tab: All 9 Specialized Agents Matrix */}
      {activeSubTab === 'AGENTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((ag) => (
            <div key={ag.id} className="glass-card p-5 border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{ag.avatar}</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{ag.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">{ag.assigned_model}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {ag.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{ag.description}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800/80 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Accuracy Benchmark</span>
                  <strong className="text-emerald-400 font-mono">{ag.metrics?.accuracy}%</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Average Latency</span>
                  <strong className="text-sky-400 font-mono">{ag.metrics?.avg_latency_ms} ms</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Capabilities:</span>
                  <div className="flex flex-wrap gap-1">
                    {ag.capabilities?.map((c) => (
                      <span key={c} className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-300">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Sub-Tab: MCP Tool Audit Inspector */}
      {activeSubTab === 'AUDIT_TOOLS' && (
        <div className="glass-card p-5 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-400" />
                MCP Tool Execution Audit Log
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Every tool call is verified for least-privilege authorization, schema compliance, and recorded immutably.
              </p>
            </div>
            <button
              onClick={fetchToolLogs}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          {loadingTools ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading tool audit logs...</div>
          ) : toolLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No tool calls recorded yet. Execute any scenario to inspect tool calls.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-navy-900/60 text-slate-400">
                    <th className="p-2.5 font-semibold">Timestamp</th>
                    <th className="p-2.5 font-semibold">Invoking Agent</th>
                    <th className="p-2.5 font-semibold">Tool Name</th>
                    <th className="p-2.5 font-semibold">Arguments</th>
                    <th className="p-2.5 font-semibold">Status</th>
                    <th className="p-2.5 font-semibold">Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {toolLogs.map((log, i) => (
                    <tr key={i} className="border-b border-slate-800/40 font-mono text-[11px]">
                      <td className="p-2.5 text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td className="p-2.5 font-bold text-purple-300">{log.invoking_agent}</td>
                      <td className="p-2.5 font-bold text-sky-400">{log.tool_name}</td>
                      <td className="p-2.5 text-slate-300 max-w-xs truncate">{JSON.stringify(log.arguments)}</td>
                      <td className="p-2.5">
                        {log.success ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> SUCCESS
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> DENIED/ERROR
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-slate-400">{log.latency_ms} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
