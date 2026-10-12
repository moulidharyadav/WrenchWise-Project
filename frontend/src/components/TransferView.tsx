import React, { useState } from 'react';
import { BankAccount } from '../types';
import { bankingApi } from '../services/api';
import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight, Send, ShieldCheck, Key, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface TransferViewProps {
  accounts: BankAccount[];
  onRefresh: () => void;
}

export const TransferView: React.FC<TransferViewProps> = ({ accounts, onRefresh }) => {
  const [operation, setOperation] = useState<'TRANSFER' | 'DEPOSIT' | 'WITHDRAWAL'>('TRANSFER');
  const [sourceAcc, setSourceAcc] = useState('ACC-1002341');
  const [destAcc, setDestAcc] = useState('ACC-1002342');
  const [targetAcc, setTargetAcc] = useState('ACC-1002341');
  const [amount, setAmount] = useState('750');
  const [narrative, setNarrative] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState(`idemp-${Date.now()}`);
  const [autoGenKey, setAutoGenKey] = useState(true);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string; details?: any } | null>(null);

  const selectedSourceAccount = accounts.find((a) => a.account_number === sourceAcc);
  const selectedTargetAccount = accounts.find((a) => a.account_number === targetAcc);

  const regenerateKey = () => {
    setIdempotencyKey(`idemp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setStatusMsg({ type: 'ERROR', text: 'Transaction amount must be strictly greater than $0.00.' });
      setLoading(false);
      return;
    }

    try {
      if (operation === 'TRANSFER') {
        if (sourceAcc === destAcc) {
          setStatusMsg({ type: 'ERROR', text: 'Source and destination accounts must be distinct.' });
          setLoading(false);
          return;
        }

        const res = await bankingApi.executeTransfer(
          sourceAcc,
          destAcc,
          amountNum,
          narrative || 'Online Account-to-Account Transfer',
          idempotencyKey
        );

        setStatusMsg({
          type: 'SUCCESS',
          text: `Double-entry transfer completed: $${amountNum.toLocaleString()} transferred from ${sourceAcc} to ${destAcc}.`,
          details: res
        });
      } else if (operation === 'DEPOSIT') {
        const res = await bankingApi.executeDeposit(
          targetAcc,
          amountNum,
          narrative || 'Branch Cash Vault Deposit',
          idempotencyKey
        );

        setStatusMsg({
          type: 'SUCCESS',
          text: `Cash deposit of $${amountNum.toLocaleString()} credited to account ${targetAcc}.`,
          details: res
        });
      } else if (operation === 'WITHDRAWAL') {
        const res = await bankingApi.executeWithdrawal(
          targetAcc,
          amountNum,
          narrative || 'Counter Cash Withdrawal',
          idempotencyKey
        );

        setStatusMsg({
          type: 'SUCCESS',
          text: `Cash withdrawal of $${amountNum.toLocaleString()} debited from account ${targetAcc}.`,
          details: res
        });
      }

      if (autoGenKey) {
        regenerateKey();
      }
      onRefresh();
    } catch (err: any) {
      setStatusMsg({
        type: 'ERROR',
        text: err.message || 'Operation failed. Please review your balance and input details.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-sky-400" />
          Banking Transaction Engine
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Atomic double-entry transaction posting, idempotency replay prevention, and automated balance reconciliation.
        </p>
      </div>

      {/* Operation Tabs */}
      <div className="flex p-1 bg-navy-900 border border-slate-800 rounded-xl gap-1">
        <button
          onClick={() => { setOperation('TRANSFER'); setStatusMsg(null); }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
            operation === 'TRANSFER'
              ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          Account-to-Account Transfer
        </button>

        <button
          onClick={() => { setOperation('DEPOSIT'); setStatusMsg(null); }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
            operation === 'DEPOSIT'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
          Branch Cash Deposit
        </button>

        <button
          onClick={() => { setOperation('WITHDRAWAL'); setStatusMsg(null); }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
            operation === 'WITHDRAWAL'
              ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          Counter Cash Withdrawal
        </button>
      </div>

      {/* Feedback Banner */}
      {statusMsg && (
        <div className={`p-4 rounded-xl border text-xs flex flex-col gap-1.5 ${
          statusMsg.type === 'SUCCESS'
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
        }`}>
          <div className="flex items-center gap-2 font-semibold">
            {statusMsg.type === 'SUCCESS' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          {statusMsg.details && (
            <div className="font-mono text-[11px] text-slate-300 mt-1 p-2 bg-navy-950/80 rounded border border-slate-800 flex flex-wrap gap-4">
              <span>Txn ID: <strong>{statusMsg.details.transaction_id}</strong></span>
              <span>Trace ID: <strong>{statusMsg.details.trace_id}</strong></span>
              <span>Status: <strong className="text-emerald-400">{statusMsg.details.status}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Form Container */}
      <div className="glass-card p-6 border-slate-800">
        <form onSubmit={handleSubmit} className="space-y-4">
          {operation === 'TRANSFER' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1.5 font-medium">Source Account (Debit)</label>
                <select
                  value={sourceAcc}
                  onChange={(e) => setSourceAcc(e.target.value)}
                  className="w-full bg-navy-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 outline-none font-mono"
                >
                  {accounts.map((a) => (
                    <option key={a.account_number} value={a.account_number}>
                      {a.account_number} &bull; ${a.available_balance.toLocaleString()} available
                    </option>
                  ))}
                </select>
                {selectedSourceAccount && (
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Available Balance: <strong className="text-emerald-400 font-mono">${selectedSourceAccount.available_balance.toLocaleString()}</strong>
                  </span>
                )}
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1.5 font-medium">Destination Account (Credit)</label>
                <select
                  value={destAcc}
                  onChange={(e) => setDestAcc(e.target.value)}
                  className="w-full bg-navy-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 outline-none font-mono"
                >
                  {accounts.map((a) => (
                    <option key={a.account_number} value={a.account_number}>
                      {a.account_number} &bull; ${a.available_balance.toLocaleString()} available
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Beneficiary Account (Target Customer)
                </span>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs text-slate-300 block mb-1.5 font-medium">
                {operation === 'DEPOSIT' ? 'Deposit Target Account (Credit)' : 'Withdrawal Account (Debit)'}
              </label>
              <select
                value={targetAcc}
                onChange={(e) => setTargetAcc(e.target.value)}
                className="w-full bg-navy-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 outline-none font-mono"
              >
                {accounts.map((a) => (
                  <option key={a.account_number} value={a.account_number}>
                    {a.account_number} &bull; ${a.available_balance.toLocaleString()} available
                  </option>
                ))}
              </select>
              {selectedTargetAccount && (
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Current Balance: <strong className="text-emerald-400 font-mono">${selectedTargetAccount.available_balance.toLocaleString()}</strong>
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-300 block mb-1.5 font-medium">Transaction Amount ($ USD)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 500.00"
                className="w-full bg-navy-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1.5 font-medium">Payment Narrative / Reference</label>
              <input
                type="text"
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                placeholder={
                  operation === 'TRANSFER'
                    ? 'e.g. Supplier Invoice Settlement'
                    : operation === 'DEPOSIT'
                    ? 'e.g. Cash Deposit Vault 104'
                    : 'e.g. ATM Counter Cash Dispense'
                }
                className="w-full bg-navy-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 outline-none"
              />
            </div>
          </div>

          {/* Idempotency Protection Section */}
          <div className="p-3.5 bg-navy-950/70 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Idempotency Key Protection
              </span>
              <button
                type="button"
                onClick={regenerateKey}
                className="text-[11px] text-sky-400 hover:text-sky-300 underline"
              >
                Generate New Key
              </button>
            </div>

            <input
              type="text"
              value={idempotencyKey}
              onChange={(e) => setIdempotencyKey(e.target.value)}
              className="w-full bg-navy-900 border border-slate-700 rounded-lg p-2 text-xs text-amber-300 font-mono outline-none"
            />

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Prevents duplicate debit execution on network replays or retries.</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoGenKey}
                  onChange={(e) => setAutoGenKey(e.target.checked)}
                  className="rounded text-sky-500"
                />
                Auto-refresh key after submit
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
              operation === 'TRANSFER'
                ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30'
                : operation === 'DEPOSIT'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
            } disabled:opacity-50`}
          >
            <Send className="w-4 h-4" />
            {loading ? 'Executing Atomic Ledger Posting...' : `Submit ${operation}`}
          </button>
        </form>
      </div>
    </div>
  );
};
