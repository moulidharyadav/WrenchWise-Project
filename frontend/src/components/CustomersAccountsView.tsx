import React, { useState, useEffect } from 'react';
import {
  Users,
  Wallet,
  ShieldCheck,
  CreditCard,
  Building,
  TrendingUp,
  RefreshCw,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { CustomerRecord, BankAccount } from '../types';
import { bankingApi } from '../services/api';

interface CustomersAccountsViewProps {
  onRefreshParent?: () => void;
}

export const CustomersAccountsView: React.FC<CustomersAccountsViewProps> = ({ onRefreshParent }) => {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('CUST-8801');
  const [customerAccounts, setCustomerAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await bankingApi.getCustomers();
      setCustomers(data);
      if (data.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(data[0].customer_id || data[0].id || 'CUST-8801');
      }
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async (customerId: string) => {
    try {
      const accs = await bankingApi.getCustomerAccounts(customerId);
      setCustomerAccounts(accs);
    } catch (err) {
      console.error('Failed to load accounts for customer', err);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      loadAccounts(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  const getCustId = (c: any) => c?.customer_id || c?.id || '';
  const getCustName = (c: any) => c?.full_name || `${c?.first_name || ''} ${c?.last_name || ''}`.trim() || getCustId(c);

  const selectedCustomer: any = customers.find((c: any) => getCustId(c) === selectedCustomerId);

  const filteredCustomers = customers.filter((c: any) => {
    const q = searchQuery.toLowerCase();
    const name = getCustName(c).toLowerCase();
    const cid = getCustId(c).toLowerCase();
    const email = (c.email || '').toLowerCase();
    return name.includes(q) || cid.includes(q) || email.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-navy-900/60 border border-slate-800 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30 font-mono">
              ENTERPRISE DATA
            </span>
            <span className="text-xs text-slate-400">Simulated Customers & Account Entities</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Customers & Account Balances
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Persisted banking relationship records with verified KYC, risk classification, credit profiles, and multi-currency accounts.
          </p>
        </div>

        <button
          onClick={() => {
            loadCustomers();
            if (selectedCustomerId) loadAccounts(selectedCustomerId);
            if (onRefreshParent) onRefreshParent();
          }}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-medium transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Data</span>
        </button>
      </div>

      {/* Main Grid: Customer List & Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Directory */}
        <div className="p-4 rounded-xl bg-navy-900/60 border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <span>Customer Directory ({customers.length})</span>
            </h3>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Filter by name, ID or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-navy-950 border border-slate-700/60 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-400 placeholder-slate-500"
            />
          </div>

          {/* List */}
          <div className="space-y-2 overflow-y-auto max-h-[480px]">
            {filteredCustomers.map((cust) => {
              const cid = getCustId(cust);
              const isSelected = cid === selectedCustomerId;
              return (
                <div
                  key={cid}
                  onClick={() => setSelectedCustomerId(cid)}
                  className={`p-3 rounded-lg border transition cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500/15 border-sky-500/40 text-white shadow-xs'
                      : 'bg-navy-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs">
                      {getCustName(cust)}
                    </span>
                    <span className="font-mono text-[10px] text-sky-400 px-1.5 py-0.5 rounded bg-slate-900">
                      {cid}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{cust.email}</div>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      KYC: {cust.kyc_status}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/20">
                      Score: {cust.credit_score || cust.credit_bureau_score || 750}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">
                      Tier: {cust.risk_tier || cust.kyc_tier || 'TIER_1'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Customer Details & Accounts */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCustomer ? (
            <>
              {/* Profile Card */}
              <div className="p-5 rounded-xl bg-navy-900/60 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400">
                      CUSTOMER IDENTIFIER: {getCustId(selectedCustomer)}
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      {getCustName(selectedCustomer)}
                    </h3>
                    <p className="text-xs text-slate-400">{selectedCustomer.email} &bull; {selectedCustomer.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>KYC {selectedCustomer.kyc_status}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-navy-950/70 border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Credit Score</span>
                    <span className="text-base font-bold text-white font-mono mt-0.5 block">
                      {selectedCustomer.credit_score || selectedCustomer.credit_bureau_score || 750}
                    </span>
                    <span className="text-[10px] text-emerald-400">Prime Segment</span>
                  </div>
                  <div className="p-3 rounded-lg bg-navy-950/70 border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Monthly Income</span>
                    <span className="text-base font-bold text-white font-mono mt-0.5 block">
                      ${(selectedCustomer.monthly_income || 10500)?.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400">Verified Direct Deposit</span>
                  </div>
                  <div className="p-3 rounded-lg bg-navy-950/70 border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Risk Classification</span>
                    <span className="text-base font-bold text-amber-400 font-mono mt-0.5 block">
                      {selectedCustomer.risk_tier || selectedCustomer.kyc_tier || 'STANDARD'}
                    </span>
                    <span className="text-[10px] text-slate-400">Tier Assessment</span>
                  </div>
                  <div className="p-3 rounded-lg bg-navy-950/70 border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Accounts Linked</span>
                    <span className="text-base font-bold text-sky-400 font-mono mt-0.5 block">
                      {customerAccounts.length}
                    </span>
                    <span className="text-[10px] text-slate-400">Core Portfolio</span>
                  </div>
                </div>
              </div>

              {/* Linked Accounts */}
              <div className="p-5 rounded-xl bg-navy-900/60 border border-slate-800 space-y-4">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span>Portfolio Accounts ({customerAccounts.length})</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customerAccounts.map((acc) => (
                    <div
                      key={acc.account_number}
                      className="p-4 rounded-xl bg-navy-950/90 border border-slate-800 hover:border-sky-500/30 transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/20">
                            {acc.account_type}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400">
                            {acc.status}
                          </span>
                        </div>
                        <div className="font-mono text-xs text-slate-400 mb-1">
                          {acc.account_number}
                        </div>
                        <div className="text-2xl font-bold text-white font-mono">
                          ${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Daily Limit: ${acc.daily_limit?.toLocaleString()}</span>
                        <span>Available: ${acc.available_balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-slate-500 text-xs">
              Select a customer to view accounts and detailed portfolio.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
