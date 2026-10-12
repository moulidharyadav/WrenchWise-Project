import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CreditCard,
  DollarSign,
  PieChart,
  BarChart2,
  Percent,
  CheckCircle2,
  ShieldCheck,
  Bookmark,
  ExternalLink,
  RotateCcw,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';
import { bankingApi } from '../services/api';

export const FinancialAdvisoryView: React.FC = () => {
  // Loan / Credit Simulation State
  const [loanAmount, setLoanAmount] = useState<number>(25000);
  const [loanTenure, setLoanTenure] = useState<number>(24);
  const [creditResult, setCreditResult] = useState<any | null>(null);
  const [loadingCredit, setLoadingCredit] = useState<boolean>(false);

  // Financial Advisory Allocation State
  const [liquidBalance, setLiquidBalance] = useState<number>(48500.50);
  const [advisoryPlan, setAdvisoryPlan] = useState<any | null>(null);

  // Market Benchmarks
  const [marketBenchmarks, setMarketBenchmarks] = useState<any | null>(null);

  const fetchInitialData = async () => {
    try {
      // 1. Initial Advisory Plan
      const advRes = await bankingApi.executeMCPTool('generate_advisory_plan', {
        liquid_balance: liquidBalance,
        horizon_months: 12
      }, 'FINANCIAL_ADVISORY_AGENT');
      setAdvisoryPlan(advRes.result);

      // 2. Initial Market Research
      const mktRes = await bankingApi.executeMCPTool('query_market_research', {
        topic: 'INTEREST_RATES'
      }, 'RESEARCH_AGENT');
      setMarketBenchmarks(mktRes.result);

      // 3. Initial Loan Pre-Approval
      await runLoanUnderwriting(loanAmount, loanTenure);
    } catch (e) {
      console.error('Failed to load financial advisory data', e);
    }
  };

  const runLoanUnderwriting = async (amount: number, tenure: number) => {
    setLoadingCredit(true);
    try {
      const res = await bankingApi.executeMCPTool('loan_tool', {
        customer_id: 'CUST-8801',
        loan_type: 'PERSONAL_TERM',
        requested_amount: amount,
        tenure_months: tenure
      }, 'CREDIT_AGENT');
      setCreditResult(res.result);
    } catch (e) {
      console.error('Loan underwriting error', e);
    } finally {
      setLoadingCredit(false);
    }
  };

  const recalculateAdvisory = async () => {
    try {
      const advRes = await bankingApi.executeMCPTool('generate_advisory_plan', {
        liquid_balance: liquidBalance,
        horizon_months: 12
      }, 'FINANCIAL_ADVISORY_AGENT');
      setAdvisoryPlan(advRes.result);
    } catch (e) {
      console.error('Advisory update error', e);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-navy-900/80 border border-sky-950/80 rounded-2xl p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-100">Credit Assessment, Product Catalog & Financial Advisory</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Credit Agent Underwriting &bull; Banking Product Catalog &bull; Financial Advisory Asset Allocation &bull; Research Agent Macro Yields
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
          <Info className="w-4 h-4" />
          <span>Educational Planning Model (Fiduciary Disclaimer Governed)</span>
        </div>
      </div>

      {/* Grid: Credit Underwriting & Financial Advisory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Credit Assessment & Loan Underwriting Simulator */}
        <div className="bg-navy-900/70 border border-sky-950/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-sky-950 pb-3">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Percent className="w-4 h-4 text-sky-400" />
              <span>Simulated Credit Bureau & Loan Eligibility</span>
            </h2>
            <span className="text-[10px] font-mono text-slate-400">Bureau Score: 785 (Excellent)</span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Requested Principal (USD)</span>
                <span className="text-sky-300 font-bold">${loanAmount.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="5000"
                max="60000"
                step="1000"
                value={loanAmount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setLoanAmount(val);
                  runLoanUnderwriting(val, loanTenure);
                }}
                className="w-full accent-sky-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Tenure in Months</span>
                <span className="text-sky-300 font-bold">{loanTenure} Months</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[12, 24, 36, 48].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setLoanTenure(t);
                      runLoanUnderwriting(loanAmount, t);
                    }}
                    className={`p-2 rounded-lg border text-center font-bold transition-all ${
                      loanTenure === t
                        ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                        : 'bg-navy-950 border-sky-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t} Mo
                  </button>
                ))}
              </div>
            </div>

            {creditResult && (
              <div className="p-4 rounded-xl bg-navy-950/90 border border-sky-950 space-y-3 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Underwriting Verdict:</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    creditResult.underwriting_verdict.includes('PRE_APPROVED') || creditResult.underwriting_verdict.includes('ELIGIBLE')
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {creditResult.underwriting_verdict}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-sky-950">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Estimated APR</span>
                    <span className="text-emerald-400 font-bold text-sm">{creditResult.interest_rate_apr || 8.49}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Monthly EMI Payment</span>
                    <span className="text-sky-300 font-bold text-sm">${creditResult.monthly_emi_usd?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-sky-950">
                  <span>Total Repayment: ${creditResult.total_repayment_usd?.toLocaleString()}</span>
                  <span>Pre-Approved Max: ${creditResult.max_eligible_limit?.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Financial Advisory Asset Allocation */}
        <div className="bg-navy-900/70 border border-sky-950/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-sky-950 pb-3">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-400" />
              <span>Financial Advisory Yield & Reserve Strategy</span>
            </h2>
            <button
              onClick={recalculateAdvisory}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Recompute
            </button>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Liquid Account Balance</span>
                <span className="text-emerald-400 font-bold">${liquidBalance.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="10000"
                max="100000"
                step="2500"
                value={liquidBalance}
                onChange={(e) => {
                  setLiquidBalance(Number(e.target.value));
                }}
                className="w-full accent-amber-400"
              />
            </div>

            {advisoryPlan && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-navy-950 border border-sky-950">
                    <span className="text-slate-500 block text-[10px]">Emergency Reserve Buffer</span>
                    <span className="text-sky-400 font-bold text-sm">${advisoryPlan.recommended_emergency_buffer?.toLocaleString()}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-navy-950 border border-sky-950">
                    <span className="text-slate-500 block text-[10px]">Investable Surplus</span>
                    <span className="text-emerald-400 font-bold text-sm">${advisoryPlan.investable_surplus?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-navy-950 border border-sky-950 space-y-2">
                  <span className="text-slate-400 font-bold block">Recommended Allocation:</span>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cash Liquidity Reserve (30%):</span>
                      <span className="text-slate-200 font-bold">30.0%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">High-Yield Term Certificate (5.45% APY):</span>
                      <span className="text-emerald-400 font-bold">50.0%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Diversified High-Grade Bond Index:</span>
                      <span className="text-purple-400 font-bold">20.0%</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-sky-950 flex justify-between text-slate-300 font-bold">
                    <span>Projected Annual Return:</span>
                    <span className="text-emerald-400">+${advisoryPlan.projected_annual_yield_usd?.toLocaleString()} USD</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 leading-tight">
                  Disclaimer: {advisoryPlan.regulatory_disclaimer}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Banking Product Catalog Cards */}
      <div className="bg-navy-900/70 border border-sky-950/80 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-sky-950 pb-3">
          <CreditCard className="w-4 h-4 text-purple-400" />
          <span>Core Banking Product Suite</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-navy-950/80 border border-sky-950 space-y-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              SAVINGS
            </span>
            <h3 className="text-xs font-bold text-slate-100">Horizon High-Yield Savings</h3>
            <div className="text-xl font-extrabold text-emerald-400 font-mono">4.85% APY</div>
            <p className="text-[11px] text-slate-400">Daily compounding interest, $500 minimum balance, FDIC insured up to $250k.</p>
          </div>

          <div className="p-4 rounded-xl bg-navy-950/80 border border-sky-950 space-y-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
              TERM DEPOSIT
            </span>
            <h3 className="text-xs font-bold text-slate-100">Platinum 12-Month Fixed CD</h3>
            <div className="text-xl font-extrabold text-teal-400 font-mono">5.45% APY</div>
            <p className="text-[11px] text-slate-400">Guaranteed fixed coupon, $5,000 opening deposit, penalty applies for early withdrawal.</p>
          </div>

          <div className="p-4 rounded-xl bg-navy-950/80 border border-sky-950 space-y-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              CARDS
            </span>
            <h3 className="text-xs font-bold text-slate-100">Elite World Mastercard</h3>
            <div className="text-xl font-extrabold text-purple-400 font-mono">3% Cashback</div>
            <p className="text-[11px] text-slate-400">Zero foreign exchange fees, worldwide lounge access, concierge service, $95 annual fee.</p>
          </div>

          <div className="p-4 rounded-xl bg-navy-950/80 border border-sky-950 space-y-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              LENDING
            </span>
            <h3 className="text-xs font-bold text-slate-100">Personal Signature Loan</h3>
            <div className="text-xl font-extrabold text-sky-400 font-mono">From 8.49% APR</div>
            <p className="text-[11px] text-slate-400">Up to $50,000 automated pre-approval, flexible 12-60 month tenures, zero prepayment fees.</p>
          </div>
        </div>
      </div>

      {/* Market Data Benchmark Curves */}
      {marketBenchmarks && (
        <div className="p-4 rounded-2xl bg-navy-900/50 border border-sky-950 text-xs font-mono flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BarChart2 className="w-5 h-5 text-sky-400" />
            <div>
              <span className="text-slate-300 font-bold block">Federal Reserve & Macro Benchmark Rates ({marketBenchmarks.as_of_date})</span>
              <span className="text-[10px] text-slate-400">{marketBenchmarks.macro_summary}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-slate-500 block text-[10px]">SOFR Rate</span>
              <span className="text-slate-200 font-bold">{marketBenchmarks.benchmark_rates?.sofr}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">10Y US Treasury</span>
              <span className="text-purple-400 font-bold">{marketBenchmarks.benchmark_rates?.['10y_treasury']}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Fed Funds Effective</span>
              <span className="text-emerald-400 font-bold">{marketBenchmarks.benchmark_rates?.fed_funds_rate}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Wall St Prime</span>
              <span className="text-amber-400 font-bold">{marketBenchmarks.benchmark_rates?.prime_rate}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
