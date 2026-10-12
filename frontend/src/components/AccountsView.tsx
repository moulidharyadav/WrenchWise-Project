import React, { useState } from 'react';
import { BankAccount } from '../types';
import { bankingApi } from '../services/api';
import { CreditCard, Plus, ShieldCheck, DollarSign, Wallet, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AccountsViewProps {
  accounts: BankAccount[];
  onRefresh: () => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({ accounts, onRefresh }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customerId, setCustomerId] = useState('CUST-8801');
  const [accountType, setAccountType] = useState('CHECKING');
  const [currency, setCurrency] = useState('USD');
  const [initialDeposit, setInitialDeposit] = useState('1000');
  const [dailyLimit, setDailyLimit] = useState('25000');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const totalBookBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const totalAvailableLiquidity = accounts.reduce((sum, a) => sum + (a.available_balance || 0), 0);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const depositNum = parseFloat(initialDeposit);
    const limitNum = parseFloat(dailyLimit);

    if (isNaN(depositNum) || depositNum < 0) {
      setErrorMsg('Initial deposit must be a valid non-negative number.');
      setLoading(false);
      return;
    }

    try {
      const created = await bankingApi.createAccount(
        customerId,
        accountType,
        currency,
        depositNum,
        limitNum
      );
      setSuccessMsg(`Account ${created.account_number} created successfully with $${depositNum.toLocaleString()} initial deposit!`);
      setShowCreateModal(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-sky-400" />
            Core Accounts & Liquidity Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time balance tracking, segregated ledger holds, and synthetic retail/corporate accounts (Enterprise Core Data Engine).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefresh}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700/80"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Balances
          </button>
          <button
            onClick={() => { setShowCreateModal(true); setErrorMsg(null); setSuccessMsg(null); }}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm shadow-sky-600/30"
          >
            <Plus className="w-4 h-4" />
            Open New Account
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Aggregate Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 border-sky-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Book Balance</span>
            <DollarSign className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2 font-mono">
            ${totalBookBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">General ledger cleared assets</span>
        </div>

        <div className="glass-card p-4 border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Available Liquidity</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2 font-mono">
            ${totalAvailableLiquidity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Immediately spendable funds</span>
        </div>

        <div className="glass-card p-4 border-purple-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Active Accounts</span>
            <CreditCard className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300 mt-2 font-mono">
            {accounts.length} <span className="text-xs font-normal text-slate-400">accounts</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Checking, Savings & Salary</span>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map((acc) => (
          <div
            key={acc.account_number}
            className="glass-card p-5 border-slate-800 hover:border-sky-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono">{acc.account_number}</h3>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">{acc.account_type} &bull; {acc.currency}</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border ${
                  acc.status === 'ACTIVE'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}>
                  {acc.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-800/80 my-2">
                <div>
                  <span className="text-[11px] text-slate-400 block">Book Balance</span>
                  <span className="text-base font-bold text-white font-mono">
                    ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Available Balance</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    ${acc.available_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2">
              <span>Customer: <strong className="text-slate-300 font-mono">{acc.customer_id}</strong></span>
              <span>Daily Limit: <strong className="text-slate-300 font-mono">${(acc.daily_limit || 25000).toLocaleString()}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Open Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-navy-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-400" />
                Open New Bank Account
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-2.5 bg-rose-950/40 border border-rose-500/40 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="space-y-3.5">
              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Customer Profile (Synthetic CIF)</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full bg-navy-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 outline-none font-mono"
                >
                  <option value="CUST-8801">CUST-8801 - Aarav Patel (Premium Tier 3)</option>
                  <option value="CUST-8802">CUST-8802 - Elena Rostova (Retail Tier 2)</option>
                  <option value="CUST-8803">CUST-8803 - Dr. Priya Sundaram (Private Wealth)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Account Type</label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="w-full bg-navy-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 outline-none"
                  >
                    <option value="CHECKING">CHECKING</option>
                    <option value="SAVINGS">SAVINGS</option>
                    <option value="SALARY">SALARY</option>
                    <option value="TERM_DEPOSIT">TERM_DEPOSIT</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-navy-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 outline-none font-mono"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Initial Opening Deposit ($ USD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(e.target.value)}
                  placeholder="e.g. 1000.00"
                  className="w-full bg-navy-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 outline-none font-mono"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Automatically settled via atomic double-entry debit from System Settlement Cash.
                </span>
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Daily Transfer Limit ($ USD)</label>
                <input
                  type="number"
                  min="100"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                  className="w-full bg-navy-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
