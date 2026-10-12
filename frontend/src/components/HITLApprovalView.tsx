import React, { useState } from 'react';
import { HITLTicket } from '../types';
import { bankingApi } from '../services/api';
import { ShieldAlert, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface HITLApprovalViewProps {
  tickets: HITLTicket[];
  onRefresh: () => void;
}

export const HITLApprovalView: React.FC<HITLApprovalViewProps> = ({ tickets, onRefresh }) => {
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const handleDecision = async (ticketId: string, decision: 'APPROVE' | 'REJECT') => {
    setSubmittingId(ticketId);
    try {
      const notes = reviewNotes[ticketId] || (decision === 'APPROVE' ? 'Approved after manual audit' : 'Rejected due to sanctions match');
      await bankingApi.reviewHITLTicket(ticketId, decision, notes);
      onRefresh();
    } catch (err) {
      console.error('Decision failed', err);
    } finally {
      setSubmittingId(null);
    }
  };

  const pendingTickets = tickets.filter((t) => t.status === 'PENDING_REVIEW');
  const resolvedTickets = tickets.filter((t) => t.status !== 'PENDING_REVIEW');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          Human-in-the-Loop (HITL) Supervisory Governance
        </h2>
        <p className="text-xs text-slate-400">
          Safety escalation: High-value transfers, velocity anomalies, and OFAC matches requiring human concurrence.
        </p>
      </div>

      {/* Pending Tickets */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          Pending Review Queue ({pendingTickets.length})
        </h3>

        {pendingTickets.length === 0 ? (
          <div className="glass-card p-8 text-center text-slate-500 text-xs">
            No pending tickets. All operations are cleared by autonomous agents.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingTickets.map((t) => (
              <div key={t.id} className="glass-card p-5 border-rose-500/30 flex flex-col gap-3 bg-rose-950/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-rose-400">{t.ticket_number}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    RISK SCORE {t.risk_score}/100
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-100">{t.category}</h4>
                  <p className="text-xs text-slate-300 mt-1">{t.reason}</p>
                </div>

                <div className="text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800">
                  <span>Amount: <strong className="text-slate-100">${t.amount.toLocaleString()}</strong></span>
                  <span className="font-mono text-[11px]">{t.reference_id}</span>
                </div>

                {/* Supervisor Notes & Decision Buttons */}
                <div className="flex flex-col gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Enter compliance reviewer notes..."
                    value={reviewNotes[t.id] || ''}
                    onChange={(e) => setReviewNotes({ ...reviewNotes, [t.id]: e.target.value })}
                    className="w-full bg-navy-950 border border-slate-700 rounded-md p-2 text-xs text-slate-200 outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDecision(t.id, 'APPROVE')}
                      disabled={submittingId === t.id}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2 rounded-md flex items-center justify-center gap-1 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve Override
                    </button>
                    <button
                      onClick={() => handleDecision(t.id, 'REJECT')}
                      disabled={submittingId === t.id}
                      className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs py-2 rounded-md flex items-center justify-center gap-1 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Block & File SAR
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolved Tickets */}
      {resolvedTickets.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Resolved Audit History ({resolvedTickets.length})
          </h3>
          <div className="glass-card p-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="p-2 font-semibold">Ticket</th>
                  <th className="p-2 font-semibold">Decision</th>
                  <th className="p-2 font-semibold">Amount</th>
                  <th className="p-2 font-semibold">Reviewer</th>
                  <th className="p-2 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody>
                {resolvedTickets.map((t) => (
                  <tr key={t.id} className="border-b border-slate-800/60">
                    <td className="p-2 font-mono text-sky-400">{t.ticket_number}</td>
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-2 text-slate-200">${t.amount.toLocaleString()}</td>
                    <td className="p-2 text-slate-400">{t.reviewed_by || 'COMPLIANCE'}</td>
                    <td className="p-2 text-slate-300">{t.reviewer_notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
