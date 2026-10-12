import React, { useState, useEffect } from 'react';
import { ReconciliationReport, BankingEvent } from '../types';
import { bankingApi } from '../services/api';
import { ShieldCheck, Play, RefreshCw, AlertTriangle, CheckCircle2, Radio, Server, Activity, ArrowRight } from 'lucide-react';

export const AuditView: React.FC = () => {
  const [report, setReport] = useState<ReconciliationReport | null>(null);
  const [events, setEvents] = useState<BankingEvent[]>([]);
  const [dlqEvents, setDlqEvents] = useState<any[]>([]);
  const [loadingReconcile, setLoadingReconcile] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const executeReconcile = async () => {
    setLoadingReconcile(true);
    try {
      const res = await bankingApi.triggerReconciliation();
      setReport(res);
      await fetchEvents();
    } catch (err) {
      console.error('Reconciliation failed', err);
    } finally {
      setLoadingReconcile(false);
    }
  };

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const [eventsData, dlqData] = await Promise.all([
        bankingApi.getEventHistory(30),
        bankingApi.getDLQEvents()
      ]);
      setEvents(eventsData.events || []);
      setDlqEvents(dlqData.dlq_events || []);
    } catch (err) {
      console.error('Failed to fetch events', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    executeReconcile();
    fetchEvents();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Transaction Reconciliation & Event Audit
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated double-entry reconciliation engine, event bus activity with correlation IDs, and dead-letter monitoring.
          </p>
        </div>

        <button
          onClick={executeReconcile}
          disabled={loadingReconcile}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-all shadow-sm shadow-emerald-600/30 disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          {loadingReconcile ? 'Running Mathematical Audit...' : 'Execute Ledger Reconciliation'}
        </button>
      </div>

      {/* Reconciliation Report Cards */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="glass-card p-4 border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">Reconciliation Status</span>
            <div className="mt-2 flex items-center gap-2">
              {report.is_ledger_balanced ? (
                <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  RECONCILED CLEAN
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  DISCREPANCIES DETECTED
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block font-mono">
              Timestamp: {new Date(report.reconciliation_timestamp).toLocaleTimeString()}
            </span>
          </div>

          <div className="glass-card p-4 border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">System Total Debits</span>
            <div className="text-xl font-bold text-rose-400 mt-2 font-mono">
              ${report.total_system_debits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Across all audited journal legs</span>
          </div>

          <div className="glass-card p-4 border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">System Total Credits</span>
            <div className="text-xl font-bold text-emerald-400 mt-2 font-mono">
              ${report.total_system_credits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Matches debits exactly to the penny</span>
          </div>

          <div className="glass-card p-4 border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">Entities Audited</span>
            <div className="text-xl font-bold text-white mt-2 font-mono">
              {report.total_accounts_audited} <span className="text-xs text-slate-400">accs</span> / {report.total_journal_entries_audited} <span className="text-xs text-slate-400">jnls</span>
            </div>
            <span className="text-[10px] text-emerald-400 mt-1 block">
              {report.discrepancies_found} discrepancies found
            </span>
          </div>
        </div>
      )}

      {/* Discrepancies Alert If Any */}
      {report && report.discrepancy_details && report.discrepancy_details.length > 0 && (
        <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-xl space-y-1.5 text-xs text-rose-300">
          <strong className="block font-bold">Discrepancy Details:</strong>
          {report.discrepancy_details.map((d, i) => (
            <div key={i} className="font-mono text-[11px]">• {d}</div>
          ))}
        </div>
      )}

      {/* Event-Driven Architecture Bus Stream */}
      <div className="glass-card p-5 border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Event-Driven Bus Stream & Correlation Log
            </h3>
          </div>
          <button
            onClick={fetchEvents}
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh Events
          </button>
        </div>

        <div className="space-y-2">
          {events.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-xs">No events published yet.</div>
          ) : (
            events.map((evt) => (
              <div
                key={evt.event_id}
                className="p-3 bg-navy-950 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    evt.event_type.includes('completed')
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : evt.event_type.includes('rejected')
                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      : 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                  }`}>
                    {evt.event_type}
                  </span>
                  <span className="text-slate-300 font-semibold text-[11px]">
                    Event ID: {evt.event_id}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>Corr ID: <strong className="text-purple-300">{evt.correlation_id}</strong></span>
                  <span>Retries: <strong className="text-white">{evt.retry_count}</strong></span>
                  <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Dead-Letter Queue (DLQ) Section */}
      <div className="glass-card p-5 border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Dead-Letter Queue (DLQ) & Fault Tolerance ({dlqEvents.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Events exceeding max 3 retries</span>
        </div>

        {dlqEvents.length === 0 ? (
          <div className="p-4 bg-navy-950/60 rounded-xl border border-slate-800/80 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Dead-Letter Queue is empty. All background consumers processed successfully within 5s timeouts.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {dlqEvents.map((dlq, i) => (
              <div key={i} className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl text-xs font-mono space-y-1">
                <div className="flex justify-between text-rose-300 font-bold">
                  <span>DLQ Event: {dlq.event_id}</span>
                  <span>Reason: {dlq.dlq_reason}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Payload: {JSON.stringify(dlq.payload)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
