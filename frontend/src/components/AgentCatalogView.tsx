import React from 'react';
import { AgentCatalogItem } from '../types';
import { Users, CheckCircle2 } from 'lucide-react';

interface AgentCatalogViewProps {
  agents: AgentCatalogItem[];
}

export const AgentCatalogView: React.FC<AgentCatalogViewProps> = ({ agents }) => {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-400" />
          Specialized Multi-Agent & Supervisor Catalog
        </h2>
        <p className="text-xs text-slate-400">
          Enterprise multi-agent automation team with role-based models, specialized capabilities, and latency SLAs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div key={agent.id} className="glass-card p-5 flex flex-col gap-3 border-slate-800 hover:border-sky-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{agent.avatar}</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">{agent.name}</h3>
                  <span className="text-[11px] font-mono text-sky-400">{agent.assigned_model}</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {agent.status}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{agent.description}</p>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">Specialized Capabilities:</span>
              <div className="flex flex-wrap gap-1.5">
                {agent.capabilities.map((cap, idx) => (
                  <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-navy-950 border border-slate-800 text-slate-300 font-mono">
                    {cap}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Latency: <strong className="text-slate-200">{agent.metrics.avg_latency_ms}ms</strong></span>
              <span>Accuracy: <strong className="text-emerald-400">{agent.metrics.accuracy}%</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
