import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  TrendingUp,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Calculator,
  ChevronRight,
  Sparkles,
  Users
} from 'lucide-react';
import { LoanAssessmentRecord, BankingProduct, CustomerRecord } from '../types';
import { bankingApi } from '../services/api';

export const CreditLoansView: React.FC = () => {
  const [assessments, setAssessments] = useState<LoanAssessmentRecord[]>([]);
  const [products, setProducts] = useState<BankingProduct[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [assessing, setAssessing] = useState(false);

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('CUST-8801');
  const [requestedAmount, setRequestedAmount] = useState<number>(35000);
  const [loanPurpose, setLoanPurpose] = useState<string>('HOME_RENOVATION');
  const [monthlyIncome, setMonthlyIncome] = useState<number>(12500);
  const [existingDebt, setExistingDebt] = useState<number>(1200);
  const [creditScore, setCreditScore] = useState<number>(780);
  const [latestAssessment, setLatestAssessment] = useState<LoanAssessmentRecord | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assData, prodData, custList] = await Promise.all([
        bankingApi.getLoanAssessments(),
        bankingApi.getProducts(),
        bankingApi.getCustomers()
      ]);
      setAssessments(assData);
      setProducts(prodData);
      setCustomers(custList);
    } catch (err) {
      console.error('Failed to load credit and loan data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCustomerChange = (cid: string) => {
    setSelectedCustomerId(cid);
    const found = customers.find((c) => c.customer_id === cid);
    if (found) {
      setMonthlyIncome(found.monthly_income || 10000);
      setCreditScore(found.credit_score || 720);
    }
  };

  const handleRunUnderwriting = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssessing(true);
    try {
      const result = await bankingApi.assessLoan({
        customer_id: selectedCustomerId,
        requested_amount: requestedAmount,
        loan_purpose: loanPurpose,
        monthly_income: monthlyIncome,
        existing_debt_monthly: existingDebt,
        credit_score: creditScore
      });
      setLatestAssessment(result);
      await loadData();
    } catch (err) {
      console.error('Underwriting failed', err);
    } finally {
      setAssessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-navy-900/60 border border-slate-800 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-mono">
              CREDIT AGENT
            </span>
            <span className="text-xs text-slate-400">Deterministic Underwriting Engine & Financial Products</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Credit Assessment & Loan Underwriting
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulated credit assessment using debt-to-income (DTI) ratio, EMI calculation, and policy compliance verification.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-medium transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Underwriting Simulator & Live Result */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan Calculator Form */}
        <div className="p-5 rounded-xl bg-navy-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Calculator className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-white">
              Simulated Loan Eligibility Application
            </h3>
          </div>

          <form onSubmit={handleRunUnderwriting} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-sky-400"
                >
                  {customers.map((c) => (
                    <option key={c.customer_id} value={c.customer_id}>
                      {c.first_name} {c.last_name} ({c.customer_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Loan Purpose</label>
                <select
                  value={loanPurpose}
                  onChange={(e) => setLoanPurpose(e.target.value)}
                  className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-sky-400"
                >
                  <option value="HOME_RENOVATION">Home Renovation</option>
                  <option value="VEHICLE_PURCHASE">Auto / Vehicle Purchase</option>
                  <option value="BUSINESS_EXPANSION">Small Business Expansion</option>
                  <option value="DEBT_CONSOLIDATION">Debt Consolidation</option>
                  <option value="EDUCATION">Higher Education</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Requested Amount ($)</label>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(Number(e.target.value))}
                  className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-sky-400 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Monthly Income ($)</label>
                <input
                  type="number"
                  min="500"
                  step="100"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                  className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-sky-400 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Existing Debt Monthly ($)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={existingDebt}
                  onChange={(e) => setExistingDebt(Number(e.target.value))}
                  className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-sky-400 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Simulated Bureau Score (300-850)</label>
                <input
                  type="number"
                  min="300"
                  max="850"
                  value={creditScore}
                  onChange={(e) => setCreditScore(Number(e.target.value))}
                  className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-sky-400 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={assessing}
              className="w-full py-2.5 px-4 rounded-lg bg-sky-500 hover:bg-sky-400 text-navy-950 font-bold transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Sparkles className={`w-4 h-4 ${assessing ? 'animate-spin' : ''}`} />
              <span>{assessing ? 'Evaluating via Credit & Compliance Agents...' : 'Run Automated Underwriting'}</span>
            </button>
          </form>
        </div>

        {/* Assessment Decision Card */}
        <div className="p-5 rounded-xl bg-navy-900/60 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Underwriting Assessment Result</span>
              </h3>
              {latestAssessment && (
                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border ${
                    latestAssessment.status === 'APPROVED'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : latestAssessment.status === 'REFERRED_HITL'
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {latestAssessment.status}
                </span>
              )}
            </div>

            {latestAssessment ? (
              <div className="space-y-3 mt-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-navy-950 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Calculated Monthly EMI</span>
                    <span className="text-xl font-bold text-white font-mono mt-0.5 block">
                      ${(latestAssessment.calculated_emi ?? latestAssessment.monthly_emi ?? 0).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500">60-Month Amortization (7.5% APR)</span>
                  </div>
                  <div className="p-3 rounded-lg bg-navy-950 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Debt-to-Income (DTI)</span>
                    <span
                      className={`text-xl font-bold font-mono mt-0.5 block ${
                        (latestAssessment.debt_to_income_pct ?? latestAssessment.dti_ratio ?? 0) <= 43 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {(latestAssessment.debt_to_income_pct ?? latestAssessment.dti_ratio ?? 0)}%
                    </span>
                    <span className="text-[10px] text-slate-500">Policy Ceiling: 43.0%</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-navy-950/70 border border-slate-800">
                  <span className="text-slate-300 font-semibold block mb-1">
                    Approval Factors:
                  </span>
                  <ul className="space-y-1 text-slate-400">
                    {latestAssessment.approval_factors?.map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {(latestAssessment.rejection_factors?.length ?? 0) > 0 && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <span className="text-rose-300 font-semibold block mb-1">
                      Risk / Rejection Factors:
                    </span>
                    <ul className="space-y-1 text-rose-400">
                      {latestAssessment.rejection_factors?.map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-xs text-slate-500">
                Submit an application to run real-time multi-agent underwriting.
              </div>
            )}
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
            Note: All loan eligibility calculations use deterministic banking business rules and simulated bureau models.
          </div>
        </div>
      </div>

      {/* Configured Banking Products Section */}
      <div className="p-5 rounded-xl bg-navy-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Landmark className="w-4 h-4 text-purple-400" />
              <span>Configured Simulated Banking Products ({products.length})</span>
            </h3>
            <p className="text-xs text-slate-400">Seeded offerings referenced by the Banking Product Agent</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((prod) => (
            <div
              key={prod.product_code}
              className="p-4 rounded-xl bg-navy-950/80 border border-slate-800 hover:border-sky-500/30 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/20">
                    {prod.category}
                  </span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {prod.interest_rate_pct}% APY
                  </span>
                </div>
                <h4 className="font-semibold text-white text-xs mb-1">{prod.product_name}</h4>
                <p className="text-[11px] text-slate-400 mb-3">{prod.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Min Balance: ${prod.min_balance?.toLocaleString()}</span>
                <span className="font-mono text-slate-500">{prod.product_code}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Underwriting History Log */}
      <div className="p-5 rounded-xl bg-navy-900/60 border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-white">Historical Underwriting Assessments</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Assessment ID</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Requested</th>
                <th className="py-2.5 px-3">DTI</th>
                <th className="py-2.5 px-3">Est. EMI</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {assessments.map((ass, idx) => (
                <tr key={ass.id || ass.loan_id || idx} className="hover:bg-slate-900/40">
                  <td className="py-2.5 px-3 font-mono text-[11px] text-sky-400">
                    {(ass.id || ass.loan_id || 'LOAN-001').slice(0, 8)}...
                  </td>
                  <td className="py-2.5 px-3 font-mono">{ass.customer_id}</td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-white">${ass.requested_amount?.toLocaleString()}</td>
                  <td className="py-2.5 px-3 font-mono">{ass.debt_to_income_pct ?? ass.dti_ratio ?? 0}%</td>
                  <td className="py-2.5 px-3 font-mono">${(ass.calculated_emi ?? ass.monthly_emi ?? 0).toFixed(2)}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        ass.status === 'APPROVED'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : ass.status === 'REFERRED_HITL'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {ass.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                    {new Date(ass.created_at || Date.now()).toLocaleString()}
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
