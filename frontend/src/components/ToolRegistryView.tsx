import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Search,
  Code,
  ShieldCheck,
  ShieldAlert,
  Play,
  RotateCcw,
  CheckCircle2,
  Terminal,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { bankingApi } from '../services/api';

export const ToolRegistryView: React.FC = () => {
  const [tools, setTools] = useState<any[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  // MCP JSON-RPC Console State
  const [rpcMethod, setRpcMethod] = useState<string>('tools/list');
  const [rpcParams, setRpcParams] = useState<string>('{}');
  const [rpcResponse, setRpcResponse] = useState<any | null>(null);
  const [rpcLoading, setRpcLoading] = useState<boolean>(false);

  const fetchToolsAndAudit = async () => {
    try {
      const [toolsRes, auditRes] = await Promise.all([
        bankingApi.getMCPTools(),
        bankingApi.getMCPAuditLog(30)
      ]);
      setTools(toolsRes.tools || []);
      setAuditLog(auditRes.log_entries || []);
    } catch (e) {
      console.error('Failed to load MCP tools', e);
    }
  };

  useEffect(() => {
    fetchToolsAndAudit();
  }, []);

  const handleExecuteRpc = async (e: React.FormEvent) => {
    e.preventDefault();
    setRpcLoading(true);
    try {
      let parsedParams = {};
      try {
        parsedParams = JSON.parse(rpcParams);
      } catch (err) {
        alert('Invalid JSON in params input');
        setRpcLoading(false);
        return;
      }

      const payload = {
        jsonrpc: '2.0',
        id: `REQ-${Date.now()}`,
        method: rpcMethod,
        params: parsedParams
      };

      const res = await bankingApi.sendMCPJsonRpc(payload);
      setRpcResponse(res);
      await fetchToolsAndAudit();
    } catch (err: any) {
      setRpcResponse({ error: err.message });
    } finally {
      setRpcLoading(false);
    }
  };

  const categories = ['ALL', ...Array.from(new Set(tools.map((t) => t.category).filter(Boolean)))];

  const filteredTools = tools.filter((t) => {
    const matchesCat = selectedCategory === 'ALL' || t.category === selectedCategory;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-navy-900/80 border border-sky-950/80 rounded-2xl p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Wrench className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-100">Tool Registry & MCP Protocol Server</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Standard Model Context Protocol (MCP) Server &bull; 12 Sandboxed Banking Tools &bull; Schema Validation &bull; Least Privilege
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchToolsAndAudit}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-semibold transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Refresh Registry</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-sky-500/20 border border-sky-500/40 text-sky-300 font-bold'
                  : 'bg-navy-900/60 border border-sky-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools or schemas..."
            className="w-full pl-9 pr-3 py-1.5 bg-navy-900/60 border border-sky-950 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500/60"
          />
        </div>
      </div>

      {/* 12 Tools Catalog Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map((tool) => {
          const isExpanded = expandedTool === tool.name;
          return (
            <div
              key={tool.name}
              className="bg-navy-900/70 border border-sky-950/80 rounded-2xl p-5 space-y-3 hover:border-sky-800 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-sky-400" />
                    <span>{tool.name}</span>
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {tool.category}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{tool.description}</p>

                <div className="space-y-1.5 pt-2 text-[11px] font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Permission Required:</span>
                    <span className="text-amber-400 font-semibold">{tool.permission}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Sensitive Operation:</span>
                    <span className={tool.is_sensitive ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                      {tool.is_sensitive ? 'YES (HITL Gate)' : 'NO'}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] text-slate-500 block uppercase font-mono mb-1">Authorized Whitelist:</span>
                  <div className="flex flex-wrap gap-1">
                    {(tool.authorized_agents || []).map((ag: string) => (
                      <span key={ag} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-navy-950 border border-sky-950 text-slate-300">
                        {ag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Schema Inspector Toggle */}
              <div className="pt-3 border-t border-sky-950">
                <button
                  onClick={() => setExpandedTool(isExpanded ? null : tool.name)}
                  className="w-full py-1.5 px-3 rounded-lg bg-navy-950 hover:bg-navy-900 border border-sky-950 text-[11px] font-mono text-sky-400 flex items-center justify-between transition-all"
                >
                  <span>{isExpanded ? 'Hide JSON Schema' : 'Inspect Schema'}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {isExpanded && (
                  <div className="mt-2 p-3 bg-navy-950 rounded-xl border border-sky-950 text-[10px] font-mono space-y-2 max-h-48 overflow-y-auto">
                    <span className="text-slate-400 block font-bold">Input Schema:</span>
                    <pre className="text-emerald-400 whitespace-pre-wrap">
                      {JSON.stringify(tool.input_schema, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* JSON-RPC MCP Test Console & Live Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive MCP JSON-RPC Console */}
        <div className="bg-navy-900/70 border border-sky-950/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-sky-950 pb-3">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-400" />
              <span>Model Context Protocol (MCP) JSON-RPC 2.0 Console</span>
            </h2>
            <span className="text-[10px] font-mono text-purple-400">Spec: 2024-11-05</span>
          </div>

          <form onSubmit={handleExecuteRpc} className="space-y-3 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">MCP Method</label>
              <select
                value={rpcMethod}
                onChange={(e) => {
                  setRpcMethod(e.target.value);
                  if (e.target.value === 'tools/call') {
                    setRpcParams(JSON.stringify({ name: 'get_account_balances', arguments: { account_number: 'ACC-1002341' } }, null, 2));
                  } else if (e.target.value === 'resources/read') {
                    setRpcParams(JSON.stringify({ uri: 'banking://policies/aml_sanctions' }, null, 2));
                  } else {
                    setRpcParams('{}');
                  }
                }}
                className="w-full px-3 py-2 bg-navy-950 border border-sky-950 rounded-lg text-slate-100"
              >
                <option value="tools/list">tools/list (List all MCP Tools)</option>
                <option value="tools/call">tools/call (Invoke Sandboxed Tool)</option>
                <option value="resources/list">resources/list (List Banking Resources)</option>
                <option value="resources/read">resources/read (Read Resource Content)</option>
                <option value="initialize">initialize (Protocol Handshake)</option>
                <option value="ping">ping (Health Ping)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">JSON-RPC Params</label>
              <textarea
                rows={4}
                value={rpcParams}
                onChange={(e) => setRpcParams(e.target.value)}
                className="w-full px-3 py-2 bg-navy-950 border border-sky-950 rounded-lg text-slate-100 font-mono"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={rpcLoading}
                className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {rpcLoading ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>Send JSON-RPC Request</span>
              </button>
            </div>
          </form>

          {rpcResponse && (
            <div className="p-3 bg-navy-950 rounded-xl border border-sky-950 space-y-1">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Response Envelope:</span>
              <pre className="text-[11px] font-mono text-purple-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
                {JSON.stringify(rpcResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Real-Time Tool Execution Audit Log */}
        <div className="bg-navy-900/70 border border-sky-950/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-sky-950 pb-3">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Immutable Tool Audit Trail ({auditLog.length})</span>
            </h2>
            <span className="text-[10px] font-mono text-slate-400">Strict Authorization Logging</span>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {auditLog.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No tool calls logged yet.</div>
            ) : (
              auditLog.map((log, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-navy-950/90 border border-sky-950 text-xs font-mono space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sky-300 font-bold">{log.tool_name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      log.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {log.success ? 'SUCCESS' : 'BLOCKED / FAILED'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Agent: {log.invoking_agent}</span>
                    <span>Latency: {log.latency_ms} ms</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate pt-0.5">
                    Args: {JSON.stringify(log.arguments)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
