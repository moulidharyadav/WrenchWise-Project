import React, { useState, useEffect } from 'react';
import {
  BankingChannel,
  AgentTrajectory,
  AgentCatalogItem,
  BankAccount,
  TransactionRecord,
  HITLTicket,
  TelemetryMetrics
} from './types';
import { bankingApi } from './services/api';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { OverviewView } from './components/OverviewView';
import { CommandCenterView } from './components/CommandCenterView';
import { AgentCatalogView } from './components/AgentCatalogView';
import { CustomersAccountsView } from './components/CustomersAccountsView';
import { TransactionsView } from './components/TransactionsView';
import { TransferView } from './components/TransferView';
import { LedgerView } from './components/LedgerView';
import { RiskAssessmentView } from './components/RiskAssessmentView';
import { HITLApprovalView } from './components/HITLApprovalView';
import { CreditLoansView } from './components/CreditLoansView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { DocumentsView } from './components/DocumentsView';
import { NotificationCenterView } from './components/NotificationCenterView';
import { ToolRegistryView } from './components/ToolRegistryView';
import { FinOpsTelemetryView } from './components/FinOpsTelemetryView';
import { AuditView } from './components/AuditView';
import { ArchitectureBlueprint } from './components/ArchitectureBlueprint';
import { SettingsView } from './components/SettingsView';
import { LoginPage } from './components/LoginPage';
import { useAuth } from './context/AuthContext';

export function App() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<string>(() => {
    // Preserve requested tab across refresh
    return localStorage.getItem('wrenchwise_active_tab') || 'overview';
  });
  const [activeModel, setActiveModel] = useState<string>('gemini-2.5-pro-experimental');
  const [activeRole, setActiveRole] = useState<string>('CUSTOMER');
  const [channel, setChannel] = useState<BankingChannel>('WEB');

  // Application Data States
  const [agents, setAgents] = useState<AgentCatalogItem[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [hitlTickets, setHitlTickets] = useState<HITLTicket[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryMetrics | null>(null);
  const [trajectory, setTrajectory] = useState<AgentTrajectory | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [systemHealthy, setSystemHealthy] = useState<boolean>(true);
  const [notificationCount, setNotificationCount] = useState<number>(3);

  // Sub-tabs for bundled views
  const [txnSubTab, setTxnSubTab] = useState<'LIST' | 'TRANSFER' | 'LEDGER'>('LIST');
  const [riskSubTab, setRiskSubTab] = useState<'SCORING' | 'HITL'>('SCORING');
  const [obsSubTab, setObsSubTab] = useState<'FINOPS' | 'AUDIT'>('FINOPS');

  // Sync role when user changes
  useEffect(() => {
    if (user && user.role) {
      setActiveRole(user.role);
    }
  }, [user]);

  // Persist tab selection
  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem('wrenchwise_active_tab', tab);
  };

  // Initial & Continuous Data Fetch (only when authenticated)
  const refreshAllData = async () => {
    if (!isAuthenticated) return;
    try {
      const [agentsData, accountsData, txnsData, hitlData, telemetryData] = await Promise.all([
        bankingApi.getAgentCatalog(),
        bankingApi.getAccounts(),
        bankingApi.getTransactions(),
        bankingApi.getHITLTickets(),
        bankingApi.getTelemetry()
      ]);
      setAgents(agentsData);
      setAccounts(accountsData);
      setTransactions(txnsData);
      setHitlTickets(hitlData);
      setTelemetry(telemetryData);
      setSystemHealthy(true);
    } catch (err) {
      console.error('Failed to load banking state', err);
      setSystemHealthy(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    refreshAllData();

    // SSE Event Stream for live real-time banking updates
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events/stream');
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'HEARTBEAT') {
            setSystemHealthy(true);
          } else {
            console.log('Real-time banking event received via SSE:', data);
            refreshAllData();
          }
        } catch (e) {
          // ignore heartbeat parse errors
        }
      };
      eventSource.onerror = () => {
        // Fallback polling keeps state fresh
      };
    } catch (e) {
      console.warn('SSE connection error, falling back to interval refresh', e);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [isAuthenticated]);

  // Multi-Agent Orchestration Handler
  const handleOrchestrate = async (prompt: string, selectedChannel: BankingChannel) => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    try {
      const res = await bankingApi.orchestrate(prompt, selectedChannel, activeModel);
      setTrajectory(res);
      await refreshAllData();
    } catch (err) {
      console.error('Orchestration failure', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalSearch = (term: string) => {
    const lower = term.toLowerCase();
    if (lower.includes('acc') || lower.includes('cust') || lower.includes('balance')) {
      setActiveTab('customers');
    } else if (lower.includes('fraud') || lower.includes('risk') || lower.includes('hitl')) {
      setActiveTab('risk');
    } else if (lower.includes('loan') || lower.includes('credit')) {
      setActiveTab('loans');
    } else if (lower.includes('tool') || lower.includes('mcp')) {
      setActiveTab('tools');
    } else if (lower.includes('doc') || lower.includes('policy')) {
      setActiveTab('documents');
    } else {
      setActiveTab('transactions');
    }
  };

  const pendingHitlCount = hitlTickets.filter((t) => t.status === 'PENDING_REVIEW').length;

  // 1. Loading state while verifying token against backend GET /api/auth/me
  if (authLoading) {
    return (
      <div className="min-h-screen w-full bg-[#070d1e] flex flex-col items-center justify-center text-slate-100">
        <div className="relative flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400 shadow-lg shadow-sky-500/20">
            <svg
              className="animate-spin h-6 w-6 text-sky-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          </div>
          <div className="text-center">
            <h2 className="text-sm font-bold tracking-wider text-white uppercase">Wrench Wise AI Banking</h2>
            <p className="text-xs text-slate-400 mt-1">Verifying secure banking session...</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Guard: Display LoginPage first if no valid session
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={refreshAllData} />;
  }

  // 3. Authenticated: Render banking dashboard with protected routes
  return (
    <div className="min-h-screen flex flex-col bg-navy-950 text-slate-100 font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Navbar with user profile & logout */}
      <Navbar
        systemHealthy={systemHealthy}
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        onSearchSelect={handleGlobalSearch}
        notificationCount={notificationCount}
        onOpenNotifications={() => handleSelectTab('notifications')}
        currentUser={user}
        onLogout={logout}
      />

      {/* Main Workspace with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar with 14 items */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleSelectTab}
          hitlCount={pendingHitlCount}
          notificationCount={notificationCount}
        />

        {/* Dynamic Tab Body */}
        <main className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full">
          {/* 1. Overview */}
          {activeTab === 'overview' && (
            <OverviewView onNavigateTab={(tab) => handleSelectTab(tab)} />
          )}

          {/* 2. AI Command Center */}
          {activeTab === 'command' && (
            <CommandCenterView
              onOrchestrate={handleOrchestrate}
              trajectory={trajectory}
              loading={loading}
              agents={agents}
              channel={channel}
              setChannel={setChannel}
            />
          )}

          {/* 3. Multi-Agent Orchestration */}
          {activeTab === 'orchestration' && (
            <div className="space-y-6">
              <AgentCatalogView agents={agents} />
            </div>
          )}

          {/* 4. Customers & Accounts */}
          {activeTab === 'customers' && (
            <CustomersAccountsView onRefreshParent={refreshAllData} />
          )}

          {/* 5. Transactions */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  onClick={() => setTxnSubTab('LIST')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    txnSubTab === 'LIST'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Transaction History & Search
                </button>
                <button
                  onClick={() => setTxnSubTab('TRANSFER')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    txnSubTab === 'TRANSFER'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Deposit, Withdraw & Wire Transfer
                </button>
                <button
                  onClick={() => setTxnSubTab('LEDGER')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    txnSubTab === 'LEDGER'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Double-Entry Ledger Legs
                </button>
              </div>

              {txnSubTab === 'LIST' && (
                <TransactionsView onRefreshParent={refreshAllData} />
              )}
              {txnSubTab === 'TRANSFER' && (
                <TransferView accounts={accounts} onRefresh={refreshAllData} />
              )}
              {txnSubTab === 'LEDGER' && <LedgerView />}
            </div>
          )}

          {/* 6. Risk & Fraud */}
          {activeTab === 'risk' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  onClick={() => setRiskSubTab('SCORING')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    riskSubTab === 'SCORING'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Risk Scoring & Transaction Surveillance
                </button>
                <button
                  onClick={() => setRiskSubTab('HITL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    riskSubTab === 'HITL'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Human-in-the-Loop Reviews</span>
                  {pendingHitlCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                      {pendingHitlCount}
                    </span>
                  )}
                </button>
              </div>

              {riskSubTab === 'SCORING' && <RiskAssessmentView />}
              {riskSubTab === 'HITL' && (
                <HITLApprovalView tickets={hitlTickets} onRefresh={refreshAllData} />
              )}
            </div>
          )}

          {/* 7. Credit & Loans */}
          {activeTab === 'loans' && <CreditLoansView />}

          {/* 8. Knowledge Base */}
          {activeTab === 'knowledge' && <KnowledgeBaseView />}

          {/* 9. Documents */}
          {activeTab === 'documents' && <DocumentsView />}

          {/* 10. Notifications */}
          {activeTab === 'notifications' && <NotificationCenterView />}

          {/* 11. API & Tool Registry */}
          {activeTab === 'tools' && <ToolRegistryView />}

          {/* 12. Observability & Audit */}
          {activeTab === 'observability' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  onClick={() => setObsSubTab('FINOPS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    obsSubTab === 'FINOPS'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  FinOps & Latency Telemetry
                </button>
                <button
                  onClick={() => setObsSubTab('AUDIT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    obsSubTab === 'AUDIT'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cryptographic Audit & Event Trail
                </button>
              </div>

              {obsSubTab === 'FINOPS' && <FinOpsTelemetryView telemetry={telemetry} />}
              {obsSubTab === 'AUDIT' && <AuditView />}
            </div>
          )}

          {/* 13. Architecture */}
          {activeTab === 'architecture' && <ArchitectureBlueprint />}

          {/* 14. Settings & AI Control Plane */}
          {activeTab === 'settings' && (
            <SettingsView
              activeModel={activeModel}
              setActiveModel={setActiveModel}
              telemetry={telemetry}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-navy-950 px-6 py-3 text-center text-xs text-slate-500 flex items-center justify-between">
        <span>Wrench Wise AI Banking &bull; Simulated Real-Time Architecture with Multi-Agent Automation</span>
        <span className="font-mono text-[11px] text-slate-400">BCBS 238 &bull; FATF Recommendation 16 &bull; Production Blueprint</span>
      </footer>
    </div>
  );
}

export default App;
