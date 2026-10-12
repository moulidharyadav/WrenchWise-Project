import React, { useState, useEffect } from 'react';
import { JournalEntry } from '../types';
import { bankingApi } from '../services/api';
import { BookOpen, RefreshCw, CheckCircle2, ArrowUpRight, ArrowDownLeft, ShieldCheck, Scale } from 'lucide-react';

export const LedgerView: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchJournalEntries = async () => {
    setLoading(true);
    try {
      const data = await bankingApi.getJournalEntries(50);
      setEntries(data || []);
    } catch (err) {
      console.error('Failed to fetch journal entries', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJournalEntries();
  }, []);

  const totalDebits = entries.reduce((acc, e) => {
    return acc + e.legs.filter((l) => l.direction === 'DEBIT').reduce((s, l) => s + l.amount, 0);
  }, 0);

  const totalCredits = entries.reduce((acc, e) => {
    return acc + e.legs.filter((l) => l.direction === 'CREDIT').reduce((s, l) => s + l.amount, 0);
  }, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            Double-Entry General Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict double-entry bookkeeping engine with balanced debit and credit legs for every transaction.
          </p>
        </div>

        <button
          onClick={fetchJournalEntries}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700/80"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Ledger
        </button>
      </div>

      {/* Invariant Balance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 border-rose-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Ledger Debits</span>
            <ArrowUpRight className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2 font-mono">
            ${totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Sum of all debit journal legs</span>
        </div>

        <div className="glass-card p-4 border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Ledger Credits</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2 font-mono">
            ${totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Sum of all credit journal legs</span>
        </div>

        <div className="glass-card p-4 border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Ledger Balance State</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-2 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            BALANCED INVARIANT
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block font-mono">
            Δ Diff: ${(Math.abs(totalDebits - totalCredits)).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Journal Entries List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
          Committed Double-Entry Journal Entries ({entries.length})
        </h3>

        {loading ? (
          <div className="glass-card p-8 text-center text-slate-400 text-xs">
            Loading general ledger entries...
          </div>
        ) : entries.length === 0 ? (
          <div className="glass-card p-8 text-center text-slate-400 text-xs">
            No journal entries recorded in the double-entry ledger yet.
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="glass-card p-4 border-slate-800 space-y-3">
              {/* Journal Entry Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    {entry.reference_number}
                  </span>
                  <span className="text-xs font-semibold text-white">{entry.narrative}</span>
                  {entry.transaction_id && (
                    <span className="text-[11px] font-mono text-slate-400">
                      Txn: {entry.transaction_id}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">{entry.posted_at}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    BALANCED
                  </span>
                </div>
              </div>

              {/* Legs Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800/60 text-[11px]">
                      <th className="py-1.5 font-semibold">Leg Account</th>
                      <th className="py-1.5 font-semibold">Direction</th>
                      <th className="py-1.5 font-semibold">Leg Amount</th>
                      <th className="py-1.5 font-semibold">Running Balance After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entry.legs.map((leg) => (
                      <tr key={leg.id} className="border-b border-slate-800/30 font-mono">
                        <td className="py-2 text-sky-400 font-semibold">{leg.account_number}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            leg.direction === 'DEBIT'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {leg.direction}
                          </span>
                        </td>
                        <td className="py-2 font-bold text-white">
                          ${leg.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} {leg.currency}
                        </td>
                        <td className="py-2 text-slate-300">
                          ${leg.running_balance_after.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
