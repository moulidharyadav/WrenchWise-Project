import React, { useState } from 'react';
import { BankAccount, TransactionRecord } from '../types';
import { bankingApi } from '../services/api';
import { ArrowUpRight, ArrowDownLeft, Send, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { StatusSelect } from './StatusSelect';

interface LedgerTableProps {
  accounts: BankAccount[];
  transactions: TransactionRecord[];
  onRefresh: () => void;
}

export const LedgerTable: React.FC<LedgerTableProps> = ({ accounts, transactions, onRefresh }) => {
  const [sourceAcc, setSourceAcc] = useState('ACC-1002341');
  const [destAcc, setDestAcc] = useState('ACC-1002342');
  const [amount, setAmount] = useState('500');
  const [transferMsg, setTransferMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTransferMsg(null);
    try {
      const idempotencyKey = `idemp-${Date.now()}`;
      const res = await bankingApi.executeTransfer(
        sourceAcc,
        destAcc,
        parseFloat(amount),
        'Online Double-Entry Transfer',
        idempotencyKey
      );
      if (res.success) {
        setTransferMsg(`✅ Settled: ${res.message} (Txn: ${res.transaction_id})`);
        onRefresh();
      } else {
        setTransferMsg(`❌ Error: ${res.detail || 'Transfer failed'}`);
      }
    } catch (err: any) {
      setTransferMsg(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Transfer Console (Double-Entry Posting Form) */}
      <div className="glass-card p-5 border-sky-500/20">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
          Double-Entry Ledger Posting Console (Idempotent)
        </h3>
        <form onSubmit={handleTransfer} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Source Account (Debit)</label>
            <StatusSelect
              value={sourceAcc}
              onChange={(val) => setSourceAcc(val)}
              options={accounts.map((a) => ({
                value: a.account_number,
                label: `${a.account_number} ($${a.available_balance.toLocaleString()})`
              }))}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Destination Account (Credit)</label>
            <StatusSelect
              value={destAcc}
              onChange={(val) => setDestAcc(val)}
              options={accounts.map((a) => ({
                value: a.account_number,
                label: `${a.account_number} ($${a.available_balance.toLocaleString()})`
              }))}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Amount ($ USD)</label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-navy-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-mono outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg p-2 text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            {loading ? 'Posting...' : 'Post Balanced Entry'}
          </button>
        </form>

        {transferMsg && (
          <div className="mt-3 text-xs p-2.5 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono">
            {transferMsg}
          </div>
        )}
      </div>

      {/* Account Balances Table */}
      <div className="glass-card p-5">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
          Core Accounts & Liquidity Balances
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="p-2.5 font-semibold">Account Number</th>
                <th className="p-2.5 font-semibold">Customer</th>
                <th className="p-2.5 font-semibold">Type</th>
                <th className="p-2.5 font-semibold">Book Balance</th>
                <th className="p-2.5 font-semibold">Available Liquidity</th>
                <th className="p-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.account_number} className="border-b border-slate-800/60 hover:bg-slate-800/20">
                  <td className="p-2.5 font-mono text-sky-400 font-semibold">{a.account_number}</td>
                  <td className="p-2.5 text-slate-300">{a.customer_id}</td>
                  <td className="p-2.5 text-slate-400">{a.account_type}</td>
                  <td className="p-2.5 font-semibold text-slate-100">${a.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-2.5 font-semibold text-emerald-400">${a.available_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-2.5">
                    <StatusBadge status={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-card p-5">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
          Real-Time Transaction Log & Audit Trail ({transactions.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="p-2.5 font-semibold">Txn ID</th>
                <th className="p-2.5 font-semibold">Source Account</th>
                <th className="p-2.5 font-semibold">Beneficiary / Counterparty</th>
                <th className="p-2.5 font-semibold">Amount</th>
                <th className="p-2.5 font-semibold">Fraud Risk Score</th>
                <th className="p-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-slate-800/60 hover:bg-slate-800/20">
                  <td className="p-2.5 font-mono text-sky-400">{tx.id}</td>
                  <td className="p-2.5 text-slate-300 font-mono">{tx.source_account}</td>
                  <td className="p-2.5 text-slate-300">{tx.counterparty_name || 'N/A'}</td>
                  <td className="p-2.5 font-semibold">
                    <span className={`inline-flex items-center gap-1 ${tx.direction === 'DEBIT' ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {tx.direction === 'DEBIT' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                      ${tx.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="p-2.5 font-mono font-bold">
                    <span className={tx.fraud_risk_score >= 75 ? 'text-rose-400' : tx.fraud_risk_score >= 35 ? 'text-amber-400' : 'text-emerald-400'}>
                      {tx.fraud_risk_score}/100
                    </span>
                  </td>
                  <td className="p-2.5">
                    <StatusBadge status={tx.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
