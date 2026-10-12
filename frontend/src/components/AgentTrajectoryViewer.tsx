import React, { useState } from 'react';
import { AgentTrajectory } from '../types';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Coins,
  Cpu,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Terminal
} from 'lucide-react';

interface AgentTrajectoryViewerProps {
  trajectory: AgentTrajectory | null;
  loading: boolean;
}

export const AgentTrajectoryViewer: React.FC<AgentTrajectoryViewerProps> = ({
  trajectory,
  loading
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber]
    }));
  };

  if (loading) {
    return (
      <div className="glass-card p-12 flex flex-col items-center justify-center gap-3 text-center min-h-[300px]">
        <div className="w-10 h-10 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin" />
        <span className="text-sm font-semibold text-sky-400">
          Supervisor Agent Orchestrating Multi-Agent Pipeline...
        </span>
        <span className="text-xs text-slate-400">
          Safety Guardrails &rarr; Task Decomposition &rarr; MCP Tool Execution
        </span>
      </div>
    );
  }

  if (!trajectory) {
    return (
      <div className="glass-card p-12 flex flex-col items-center justify-center gap-2 text-center text-slate-500 min-h-[260px]">
        <Cpu className="w-8 h-8 text-slate-600" />
        <p className="text-sm font-medium">No Active Trajectory</p>
        <span className="text-xs text-slate-400">
          Enter a prompt or select a pre-configured banking scenario to trigger the multi-agent pipeline.
        </span>
      </div>
    );
  }

  const getVerdictBadge = () => {
    switch (trajectory.verdict) {
      case 'APPROVED':
        return {
          label: 'TRANSACTION APPROVED',
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
          icon: <CheckCircle2 className="w-4 h-4" />
        };
      case 'FLAGGED_HUMAN_REVIEW':
        return {
          label: 'FROZEN & FLAGGED (HITL REQUIRED)',
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
          icon: <ShieldAlert className="w-4 h-4" />
        };
      case 'REJECTED':
        return {
          label: 'REJECTED BY POLICY',
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
          icon: <AlertTriangle className="w-4 h-4" />
        };
      default:
        return {
          label: 'QUERY COMPLETED',
          color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
          icon: <CheckCircle2 className="w-4 h-4" />
        };
    }
  };

  const badge = getVerdictBadge();

  return (
    <div className="flex flex-col gap-4">
      {/* Trajectory Header Card */}
      <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-3 border-l-4 border-l-sky-400">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${badge.color}`}>
              {badge.icon}
              {badge.label}
            </span>
            <span className="text-xs font-mono text-slate-400">
              Trace: <strong className="text-slate-200">{trajectory.trace_id}</strong>
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Intent: <strong className="text-slate-300">{trajectory.intent}</strong> &bull; Primary Agent: {trajectory.primary_agent}
          </span>
        </div>

        {/* Telemetry Metrics Chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-300">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-navy-950 border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>{trajectory.metrics.total_latency_ms} ms</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-navy-950 border border-slate-800">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>${trajectory.metrics.cost_usd.toFixed(5)}</span>
          </div>
          <div className="px-2.5 py-1 rounded bg-navy-950 border border-slate-800 font-mono text-[11px]">
            Tokens: {trajectory.metrics.prompt_tokens + trajectory.metrics.completion_tokens}
          </div>
        </div>
      </div>

      {/* Final Synthesized Response */}
      <div className="glass-card p-5 border-sky-500/30 bg-sky-950/10 flex flex-col gap-2">
        <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">
          Multi-Agent Consensus Synthesis
        </span>
        <div className="text-xs sm:text-sm text-slate-100 leading-relaxed whitespace-pre-line font-sans">
          {trajectory.final_response}
        </div>
      </div>

      {/* Step-by-Step DAG Execution */}
      <div className="glass-card p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Terminal className="w-4 h-4 text-purple-400" />
            Agent Execution Steps ({trajectory.steps.length})
          </h4>
          <span className="text-[11px] text-slate-400">
            Click step to inspect JSON tool payloads
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {trajectory.steps.map((step) => {
            const isTool = step.action_type === 'TOOL_CALL' || step.action_type === 'TOOL_RESULT';
            const isEscalation = step.action_type === 'ESCALATION';
            const isExpanded = !!expandedSteps[step.step_number];

            return (
              <div
                key={step.step_number}
                className={`p-3 rounded-lg border text-xs transition-all ${
                  isEscalation
                    ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                    : isTool
                    ? 'bg-slate-900/60 border-slate-800 text-slate-200'
                    : 'bg-navy-950/60 border-slate-800/80 text-slate-300'
                }`}
              >
                <div
                  onClick={() => toggleStep(step.step_number)}
                  className={`flex items-center justify-between ${
                    (step.tool_input || step.tool_output) ? 'cursor-pointer' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-sky-400 font-mono font-bold flex items-center justify-center text-[10px]">
                      {step.step_number}
                    </span>
                    <strong className="text-slate-100">{step.agent_name}</strong>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                        step.action_type === 'TOOL_CALL'
                          ? 'bg-purple-500/20 text-purple-300'
                          : step.action_type === 'TOOL_RESULT'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : step.action_type === 'ESCALATION'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-sky-500/20 text-sky-300'
                      }`}
                    >
                      {step.action_type}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <span className="font-mono">{step.latency_ms}ms</span>
                    {(step.tool_input || step.tool_output) && (
                      isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </div>

                <p className="mt-2 text-slate-300 leading-relaxed">{step.content}</p>

                {/* Collapsible JSON Payloads */}
                {isExpanded && (step.tool_input || step.tool_output) && (
                  <div className="mt-2.5 p-3 rounded bg-navy-950 border border-slate-800 font-mono text-[11px] flex flex-col gap-2">
                    {step.tool_name && (
                      <div className="text-sky-400">&gt; Tool: <strong>{step.tool_name}</strong></div>
                    )}
                    {step.tool_input && (
                      <div>
                        <span className="text-slate-400">Input Parameters:</span>
                        <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap mt-0.5">
                          {JSON.stringify(step.tool_input, null, 2)}
                        </pre>
                      </div>
                    )}
                    {step.tool_output && (
                      <div>
                        <span className="text-emerald-400">Output Result:</span>
                        <pre className="text-slate-200 overflow-x-auto whitespace-pre-wrap mt-0.5">
                          {JSON.stringify(step.tool_output, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
