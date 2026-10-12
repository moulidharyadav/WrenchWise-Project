import {
  AgentTrajectory,
  AgentCatalogItem,
  BankAccount,
  TransactionRecord,
  TransactionPaginatedResponse,
  JournalEntry,
  ReconciliationReport,
  BankingEvent,
  HITLTicket,
  TelemetryMetrics,
  CustomerRecord,
  BankingProduct,
  RiskAssessmentRecord,
  LoanAssessmentRecord,
  DocumentRecord,
  DashboardSummary,
  AuthUser,
  LoginResponse
} from '../types';

const API_BASE = '/api';

export const TOKEN_STORAGE_KEY = 'wrenchwise_auth_token';
export const USER_STORAGE_KEY = 'wrenchwise_auth_user';

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY);
  },
  setToken(token: string, remember: boolean = true) {
    if (remember) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    } else {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  },
  getUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_STORAGE_KEY) || sessionStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  setUser(user: AuthUser, remember: boolean = true) {
    const str = JSON.stringify(user);
    if (remember) {
      localStorage.setItem(USER_STORAGE_KEY, str);
      sessionStorage.removeItem(USER_STORAGE_KEY);
    } else {
      sessionStorage.setItem(USER_STORAGE_KEY, str);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  },
  clear() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
  }
};

async function authenticatedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = authStorage.getToken();
  const headers = new Headers(init?.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const response = await fetch(input, {
    ...init,
    headers
  });
  if (response.status === 401) {
    // Session expired or invalid
    authStorage.clear();
    window.dispatchEvent(new CustomEvent('auth:session-expired'));
  }
  return response;
}

export const bankingApi = {
  // Authentication APIs
  async login(username: string, password: string): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Authentication failed');
    }
    return res.json();
  },

  async getCurrentUser(): Promise<AuthUser> {
    const res = await authenticatedFetch(`${API_BASE}/auth/me`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Session invalid');
    }
    return res.json();
  },

  async logout(): Promise<void> {
    try {
      await authenticatedFetch(`${API_BASE}/auth/logout`, { method: 'POST' });
    } catch {
      // ignore network errors on logout
    } finally {
      authStorage.clear();
    }
  },

  async getTestAccounts(): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/test-accounts`);
    if (!res.ok) throw new Error('Failed to load test accounts');
    return res.json();
  },

  // Layer 4 Multi-Agent Orchestration
  async orchestrate(prompt: string, channel: string = 'WEB', modelOverride?: string): Promise<AgentTrajectory> {
    const res = await authenticatedFetch(`${API_BASE}/agents/orchestrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        channel,
        account_number: 'ACC-1002341',
        customer_id: 'CUST-8801',
        model_override: modelOverride
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Orchestration failed: ${res.statusText}`);
    }
    return res.json();
  },

  async getAgentCatalog(): Promise<AgentCatalogItem[]> {
    const res = await authenticatedFetch(`${API_BASE}/agents/catalog`);
    return res.json();
  },

  // Layer 6 Enterprise Data - Accounts
  async getAccounts(): Promise<BankAccount[]> {
    const res = await authenticatedFetch(`${API_BASE}/accounts`);
    return res.json();
  },

  async getAccount(accountNumber: string): Promise<BankAccount> {
    const res = await authenticatedFetch(`${API_BASE}/accounts/${accountNumber}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Account lookup failed');
    }
    return res.json();
  },

  async createAccount(customerId: string, accountType: string, currency: string, initialDeposit: number, dailyLimit?: number): Promise<BankAccount> {
    const res = await authenticatedFetch(`${API_BASE}/accounts/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: customerId,
        account_type: accountType,
        currency,
        initial_deposit: initialDeposit,
        daily_limit: dailyLimit || 25000.0
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Account creation failed');
    }
    return res.json();
  },

  // Transactions & Search
  async getTransactions(): Promise<TransactionRecord[]> {
    const res = await authenticatedFetch(`${API_BASE}/transactions?page=1&page_size=50`);
    const data = await res.json();
    return data.items || [];
  },

  async getTransactionsFiltered(params: {
    accountNumber?: string;
    status?: string;
    category?: string;
    q?: string;
    page?: number;
    pageSize?: number;
  }): Promise<TransactionPaginatedResponse> {
    const query = new URLSearchParams();
    if (params.accountNumber) query.append('account_number', params.accountNumber);
    if (params.status) query.append('status', params.status);
    if (params.category) query.append('category', params.category);
    if (params.q) query.append('q', params.q);
    query.append('page', String(params.page || 1));
    query.append('page_size', String(params.pageSize || 15));

    const res = await authenticatedFetch(`${API_BASE}/transactions?${query.toString()}`);
    return res.json();
  },

  async getTransactionDetails(txnId: string): Promise<TransactionRecord> {
    const res = await authenticatedFetch(`${API_BASE}/transactions/${txnId}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Transaction details not found');
    }
    return res.json();
  },

  // Banking Operations: Transfer, Deposit, Withdraw
  async executeTransfer(source: string, destination: string, amount: number, narrative: string, idempotencyKey?: string) {
    const res = await authenticatedFetch(`${API_BASE}/transactions/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {})
      },
      body: JSON.stringify({
        source_account: source,
        destination_account: destination,
        amount,
        narrative,
        idempotency_key: idempotencyKey
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Transfer failed');
    }
    return data;
  },

  async executeDeposit(accountNumber: string, amount: number, narrative: string, idempotencyKey?: string) {
    const res = await authenticatedFetch(`${API_BASE}/transactions/deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {})
      },
      body: JSON.stringify({
        account_number: accountNumber,
        amount,
        narrative,
        idempotency_key: idempotencyKey
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Deposit failed');
    }
    return data;
  },

  async executeWithdrawal(accountNumber: string, amount: number, narrative: string, idempotencyKey?: string) {
    const res = await authenticatedFetch(`${API_BASE}/transactions/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {})
      },
      body: JSON.stringify({
        account_number: accountNumber,
        amount,
        narrative,
        idempotency_key: idempotencyKey
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Withdrawal failed');
    }
    return data;
  },

  // Double-Entry Ledger & Reconciliation
  async getJournalEntries(limit: number = 30): Promise<JournalEntry[]> {
    const res = await authenticatedFetch(`${API_BASE}/ledger/entries?limit=${limit}`);
    return res.json();
  },

  async triggerReconciliation(): Promise<ReconciliationReport> {
    const res = await authenticatedFetch(`${API_BASE}/ledger/reconcile`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Reconciliation execution failed');
    }
    return res.json();
  },

  async getEventHistory(limit: number = 25): Promise<{ total_buffered: number; events: BankingEvent[] }> {
    const res = await authenticatedFetch(`${API_BASE}/ledger/events?limit=${limit}`);
    return res.json();
  },

  async getDLQEvents(): Promise<{ dlq_count: number; dlq_events: any[] }> {
    const res = await authenticatedFetch(`${API_BASE}/ledger/dlq`);
    return res.json();
  },

  // Layer 3 & 4 Human In The Loop (HITL)
  async getHITLTickets(): Promise<HITLTicket[]> {
    try {
      const res = await authenticatedFetch(`${API_BASE}/hitl/tickets`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  },

  async reviewHITLTicket(ticketId: string, decision: 'APPROVE' | 'REJECT', notes: string) {
    const res = await authenticatedFetch(`${API_BASE}/hitl/tickets/${ticketId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision,
        reviewer_notes: notes,
        reviewed_by: 'CHIEF_RISK_OFFICER_01'
      })
    });
    return res.json();
  },

  // Layer 7 RAG Search & Ingestion
  async searchRAG(query: string) {
    const res = await authenticatedFetch(`${API_BASE}/rag/search?q=${encodeURIComponent(query)}`);
    return res.json();
  },

  async listRAGDocuments() {
    const res = await authenticatedFetch(`${API_BASE}/rag/documents`);
    return res.json();
  },

  async ingestRAGDocument(doc: { title: string; category: string; content: string; citation: string; version?: string; author?: string }) {
    const res = await authenticatedFetch(`${API_BASE}/rag/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc)
    });
    return res.json();
  },

  // Layer 4/3 ML Models & Experiments
  async getLatestMLExperiment() {
    const res = await authenticatedFetch(`${API_BASE}/models/experiments/latest`);
    return res.json();
  },

  async runMLExperiment(params: { n_samples?: number; test_size?: number; random_seed?: number }) {
    const res = await authenticatedFetch(`${API_BASE}/models/experiments/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return res.json();
  },

  async predictTransactionRisk(features: Record<string, any>) {
    const res = await authenticatedFetch(`${API_BASE}/models/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(features)
    });
    return res.json();
  },

  // Layer 5 Tool & MCP Registry
  async getMCPTools() {
    const res = await authenticatedFetch(`${API_BASE}/mcp/tools`);
    return res.json();
  },

  async executeMCPTool(toolName: string, argumentsPayload: Record<string, any>, invokingAgent: string = 'SUPERVISOR') {
    const res = await authenticatedFetch(`${API_BASE}/mcp/tools/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_name: toolName,
        arguments: argumentsPayload,
        invoking_agent: invokingAgent
      })
    });
    return res.json();
  },

  async sendMCPJsonRpc(payload: Record<string, any>) {
    const res = await authenticatedFetch(`${API_BASE}/mcp/rpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async getMCPAuditLog(limit: number = 50) {
    const res = await authenticatedFetch(`${API_BASE}/mcp/audit-log?limit=${limit}`);
    return res.json();
  },

  // Layer 8 External Services
  async getExternalServicesCatalog() {
    const res = await authenticatedFetch(`${API_BASE}/external-services/catalog`);
    return res.json();
  },

  // Layer 9 Telemetry
  async getTelemetry(): Promise<TelemetryMetrics> {
    const res = await authenticatedFetch(`${API_BASE}/telemetry/metrics`);
    return res.json();
  },

  // Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  // Dashboard Live Metrics & Activity (Layer 6 & Layer 2)
  async getDashboardSummary(): Promise<DashboardSummary> {
    const res = await authenticatedFetch(`${API_BASE}/dashboard/summary`);
    if (!res.ok) throw new Error('Failed to fetch dashboard summary');
    return res.json();
  },

  async getDashboardActivity(limit: number = 20) {
    const res = await authenticatedFetch(`${API_BASE}/dashboard/activity?limit=${limit}`);
    return res.json();
  },

  // Layer 6 Customers & Accounts
  async getCustomers(): Promise<CustomerRecord[]> {
    const res = await authenticatedFetch(`${API_BASE}/customers`);
    if (!res.ok) throw new Error('Failed to fetch customers');
    return res.json();
  },

  async getCustomer(customerId: string): Promise<CustomerRecord> {
    const res = await authenticatedFetch(`${API_BASE}/customers/${customerId}`);
    if (!res.ok) throw new Error(`Customer ${customerId} not found`);
    return res.json();
  },

  async getCustomerAccounts(customerId: string): Promise<BankAccount[]> {
    const res = await authenticatedFetch(`${API_BASE}/customers/${customerId}/accounts`);
    if (!res.ok) throw new Error(`Failed to fetch accounts for customer ${customerId}`);
    return res.json();
  },

  // Layer 3 & 4 Risk Assessments
  async getRiskAssessments(): Promise<RiskAssessmentRecord[]> {
    const res = await authenticatedFetch(`${API_BASE}/risk/assessments`);
    if (!res.ok) throw new Error('Failed to fetch risk assessments');
    return res.json();
  },

  async createRiskAssessment(data: {
    transaction_id?: string;
    account_number: string;
    amount: number;
    channel?: string;
    narrative?: string;
  }): Promise<RiskAssessmentRecord> {
    const res = await authenticatedFetch(`${API_BASE}/risk/assessments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create risk assessment');
    return res.json();
  },

  // Layer 4 Credit & Loans
  async getLoanAssessments(): Promise<LoanAssessmentRecord[]> {
    const res = await authenticatedFetch(`${API_BASE}/loans/assessments`);
    if (!res.ok) throw new Error('Failed to fetch loan assessments');
    return res.json();
  },

  async assessLoan(data: {
    customer_id: string;
    requested_amount: number;
    loan_purpose?: string;
    monthly_income?: number;
    existing_debt_monthly?: number;
    credit_score?: number;
  }): Promise<LoanAssessmentRecord> {
    const res = await authenticatedFetch(`${API_BASE}/loans/assess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to run loan underwriting');
    return res.json();
  },

  // Layer 5 Sandboxed Tools
  async getTools(): Promise<any[]> {
    const res = await authenticatedFetch(`${API_BASE}/tools`);
    if (!res.ok) throw new Error('Failed to fetch tool registry');
    const data = await res.json();
    return Array.isArray(data) ? data : (data.tools || []);
  },

  async executeTool(toolName: string, argsPayload: Record<string, any>): Promise<any> {
    const res = await authenticatedFetch(`${API_BASE}/tools/${toolName}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(argsPayload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Tool execution failed: ${res.statusText}`);
    }
    return res.json();
  },

  // Layer 7 Knowledge & Documents
  async getKnowledgeDocuments(): Promise<DocumentRecord[]> {
    const res = await authenticatedFetch(`${API_BASE}/knowledge/documents`);
    if (!res.ok) throw new Error('Failed to fetch documents');
    const data = await res.json();
    return Array.isArray(data) ? data : (data.documents || []);
  },

  async searchKnowledge(query: string, limit: number = 5): Promise<any> {
    const res = await authenticatedFetch(`${API_BASE}/knowledge/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit })
    });
    if (!res.ok) throw new Error('Knowledge search failed');
    return res.json();
  },

  // Banking Products
  async getProducts(): Promise<BankingProduct[]> {
    const res = await authenticatedFetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error('Failed to fetch banking products');
    return res.json();
  },

  // System Notifications
  async getNotifications(limit: number = 25): Promise<any[]> {
    const res = await authenticatedFetch(`${API_BASE}/notifications?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  // Audit Logs
  async getAuditLogs(limit: number = 50): Promise<any[]> {
    const res = await authenticatedFetch(`${API_BASE}/audit/logs?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  // Agent Runs History
  async getAgentRuns(limit: number = 20): Promise<any[]> {
    const res = await authenticatedFetch(`${API_BASE}/agents/runs?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch agent runs');
    return res.json();
  },

  async getAgentRun(runId: string): Promise<any> {
    const res = await authenticatedFetch(`${API_BASE}/agents/runs/${runId}`);
    if (!res.ok) throw new Error(`Agent run ${runId} not found`);
    return res.json();
  },

  // System Status & Metrics
  async getSystemStatus(): Promise<any> {
    const res = await authenticatedFetch(`${API_BASE}/system/status`);
    if (!res.ok) throw new Error('Failed to fetch system status');
    return res.json();
  },

  async getSystemMetrics(): Promise<any> {
    const res = await authenticatedFetch(`${API_BASE}/system/metrics`);
    if (!res.ok) throw new Error('Failed to fetch system metrics');
    return res.json();
  },

  // Simulated Transactions
  async simulateTransaction(data: {
    source_account: string;
    destination_account?: string;
    amount: number;
    narrative: string;
    channel?: string;
    idempotency_key?: string;
  }): Promise<any> {
    const res = await authenticatedFetch(`${API_BASE}/transactions/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(data.idempotency_key ? { 'X-Idempotency-Key': data.idempotency_key } : {})
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Transaction simulation failed');
    }
    return res.json();
  }
};
