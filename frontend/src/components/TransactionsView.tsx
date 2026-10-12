import React, { useState, useEffect } from 'react';
import { TransactionRecord } from '../types';
import { bankingApi } from '../services/api';
import {
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  FileText
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { StatusSelect } from './StatusSelect';

interface TransactionsViewProps {
  onRefreshParent?: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = () => {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal State
  const [selectedTxn, setSelectedTxn] = useState<TransactionRecord | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await bankingApi.getTransactionsFiltered({
        q: searchTerm || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        page,
        pageSize
      });
      setTransactions(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, pageSize, statusFilter, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-400" />
            Transaction History & Search
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit-grade immutable transaction ledger, correlation tracing, and multi-factor filtering.
          </p>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Total Committed Records: <strong className="text-white font-bold">{total}</strong>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by counterparty, account number, or transaction ID..."
              className="w-full bg-navy-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <StatusSelect
            value={statusFilter}
            onChange={(val) => { setStatusFilter(val); setPage(1); }}
            placeholder="All Statuses"
            options={[
              { value: 'CLEARED', label: 'CLEARED' },
              { value: 'PENDING', label: 'PENDING' },
              { value: 'REJECTED', label: 'REJECTED' },
            ]}
          />

          {/* Category Filter */}
          <StatusSelect
            value={categoryFilter}
            onChange={(val) => { setCategoryFilter(val); setPage(1); }}
            placeholder="All Categories"
            options={[
              { value: 'TRANSFER', label: 'TRANSFER' },
              { value: 'DEPOSIT', label: 'DEPOSIT' },
              { value: 'WITHDRAWAL', label: 'WITHDRAWAL' },
              { value: 'SHOPPING', label: 'SHOPPING' },
            ]}
          />
        </div>
      </div>

      {/* Transaction Table */}
      <div className="glass-card overflow-hidden border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-navy-900/60 text-slate-400">
                <th className="p-3 font-semibold">Txn ID</th>
                <th className="p-3 font-semibold">Source Account</th>
                <th className="p-3 font-semibold">Destination / Counterparty</th>
                <th className="p-3 font-semibold">Category</th>
                <th className="p-3 font-semibold">Amount</th>
                <th className="p-3 font-semibold">Risk Score</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No transactions match your search filter criteria.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTxn(tx)}
                    className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors cursor-pointer"
                  >
                    <td className="p-3 font-mono font-semibold text-sky-400">{tx.id}</td>
                    <td className="p-3 font-mono text-slate-300">{tx.source_account}</td>
                    <td className="p-3 text-slate-300">
                      {tx.destination_account ? (
                        <span className="font-mono">{tx.destination_account}</span>
                      ) : (
                        <span>{tx.counterparty_name || 'N/A'}</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700/60">
                        {tx.category}
                      </span>
                    </td>
                    <td className="p-3 font-semibold">
                      <span className={`inline-flex items-center gap-1 ${tx.direction === 'DEBIT' ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {tx.direction === 'DEBIT' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                        ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold">
                      <span className={tx.fraud_risk_score >= 75 ? 'text-rose-400' : tx.fraud_risk_score >= 35 ? 'text-amber-400' : 'text-emerald-400'}>
                        {tx.fraud_risk_score}/100
                      </span>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedTxn(tx); }}
                        className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3 h-3 text-sky-400" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="p-3 bg-navy-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong> ({total} total transactions)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-navy-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-white">Transaction Metadata & Audit Proof</h3>
              </div>
              <button
                onClick={() => setSelectedTxn(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-navy-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Transaction ID</span>
                <span className="font-mono text-sky-400 font-bold">{selectedTxn.id}</span>
              </div>

              <div className="p-2.5 bg-navy-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Trace / Correlation ID</span>
                <span className="font-mono text-purple-300 font-bold">{selectedTxn.trace_id || 'N/A'}</span>
              </div>

              <div className="p-2.5 bg-navy-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Source Account</span>
                <span className="font-mono text-white font-semibold">{selectedTxn.source_account}</span>
              </div>

              <div className="p-2.5 bg-navy-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Destination Account</span>
                <span className="font-mono text-white font-semibold">{selectedTxn.destination_account || 'N/A'}</span>
              </div>

              <div className="p-2.5 bg-navy-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Amount</span>
                <span className="font-mono text-base font-bold text-white">
                  ${selectedTxn.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} {selectedTxn.currency}
                </span>
              </div>

              <div className="p-2.5 bg-navy-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Fraud Risk Score</span>
                <span className="font-mono font-bold text-base text-emerald-400">
                  {selectedTxn.fraud_risk_score} / 100 ({selectedTxn.risk_level})
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-400">
                <span>Payment Channel</span>
                <strong className="text-white font-mono">{selectedTxn.channel}</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-400">
                <span>Idempotency Key</span>
                <strong className="text-amber-300 font-mono text-[11px]">{selectedTxn.idempotency_key || 'N/A'}</strong>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800 text-slate-400">
                <span>Status Lifecycle</span>
                <StatusBadge status={selectedTxn.status} size="sm" />
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-400">
                <span>Created Timestamp</span>
                <strong className="text-slate-300 font-mono text-[11px]">{selectedTxn.created_at}</strong>
              </div>
              {selectedTxn.failure_reason && (
                <div className="p-2.5 bg-rose-950/40 border border-rose-500/40 rounded text-rose-300 text-xs">
                  Failure Reason: {selectedTxn.failure_reason}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedTxn(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
