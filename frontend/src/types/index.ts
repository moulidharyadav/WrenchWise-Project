export type BankingChannel = 'MOBILE' | 'WEB' | 'BRANCH' | 'CALL_CENTER' | 'RM_PORTAL' | 'API_PARTNERS';

export interface AgentStep {
  step_number: number;
  agent_name: string;
  action_type: 'THINK' | 'TOOL_CALL' | 'TOOL_RESULT' | 'SYNTHESIS' | 'ESCALATION';
  content: string;
  tool_name?: string;
  tool_input?: Record<string, any>;
  tool_output?: Record<string, any>;
  latency_ms: number;
  timestamp: string;
}

export interface AgentTrajectory {
  id: string;
  trace_id: string;
  user_prompt: string;
  intent: string;
  primary_agent: string;
  participating_agents: string[];
  steps: AgentStep[];
  final_response: string;
  verdict: 'APPROVED' | 'FLAGGED_HUMAN_REVIEW' | 'REJECTED' | 'COMPLETED';
  hitl_ticket_id?: string;
  metrics: {
    total_latency_ms: number;
    prompt_tokens: number;
    completion_tokens: number;
    cost_usd: number;
    p95_sla_target_ms: number;
  };
  timestamp: string;
}

export interface AgentCatalogItem {
  id: string;
  name: string;
  role: string;
  avatar: string;
  description: string;
  layer: number;
  assigned_model: string;
  capabilities: string[];
  status: string;
  metrics: {
    accuracy: number;
    avg_latency_ms: number;
  };
}

export interface BankAccount {
  account_number: string;
  customer_id: string;
  account_type: string;
  currency: string;
  balance: number;
  available_balance: number;
  hold_amount: number;
  daily_limit: number;
  status: string;
}

export interface TransactionRecord {
  id: string;
  trace_id?: string;
  idempotency_key?: string;
  source_account: string;
  destination_account?: string;
  counterparty_name?: string;
  amount: number;
  currency: string;
  direction: string;
  category: string;
  channel: string;
  status: string;
  fraud_risk_score: number;
  risk_level: string;
  created_at: string;
  cleared_at?: string;
  failure_reason?: string;
}

export interface TransactionPaginatedResponse {
  total: number;
  page: number;
  page_size: number;
  items: TransactionRecord[];
}

export interface JournalLeg {
  id: string;
  journal_entry_id: string;
  account_number: string;
  direction: 'DEBIT' | 'CREDIT';
  amount: number;
  currency: string;
  running_balance_after: number;
}

export interface JournalEntry {
  id: string;
  reference_number: string;
  transaction_id?: string;
  narrative: string;
  total_amount: number;
  currency: string;
  posted_at: string;
  is_balanced: boolean;
  reconciled: boolean;
  legs: JournalLeg[];
}

export interface ReconciliationReport {
  reconciliation_timestamp: string;
  total_accounts_audited: number;
  total_journal_entries_audited: number;
  total_system_debits: number;
  total_system_credits: number;
  is_ledger_balanced: boolean;
  discrepancies_found: number;
  discrepancy_details: string[];
  status: string;
}

export interface BankingEvent {
  event_id: string;
  event_type: string;
  correlation_id: string;
  payload: Record<string, any>;
  timestamp: string;
  retry_count: number;
  status: string;
}

export interface HITLTicket {
  id: string;
  ticket_number: string;
  category: string;
  reference_id: string;
  amount: number;
  risk_score: number;
  reason: string;
  status: string;
  reviewed_by?: string;
  reviewer_notes?: string;
  created_at: string;
  resolved_at?: string;
}

export interface TelemetryMetrics {
  p50_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  error_rate_pct: number;
  sla_uptime_pct: number;
  token_spend_today_usd: number;
  token_budget_daily: number;
  active_models: Array<{ model: string; role: string; status: string }>;
  active_trace_count: number;
}

export interface CustomerRecord {
  id?: string;
  customer_id?: string;
  cif?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  kyc_status?: string;
  kyc_tier?: string;
  risk_tier?: string;
  monthly_income?: number;
  credit_score?: number;
  credit_bureau_score?: number;
  segment?: string;
  created_at?: string;
}

export interface BankingProduct {
  id?: string;
  product_code: string;
  product_name: string;
  category: string;
  interest_rate_pct: number;
  min_balance: number;
  term_months?: number;
  features?: string[];
  description: string;
}

export interface RiskAssessmentRecord {
  id: string;
  transaction_id: string;
  account_number: string;
  risk_score: number;
  severity: string;
  triggered_rules: string[];
  evidence: Record<string, any>;
  recommended_action: string;
  assessed_at: string;
}

export interface LoanAssessmentRecord {
  id?: string;
  loan_id?: string;
  customer_id: string;
  requested_amount: number;
  approved_amount?: number;
  loan_purpose?: string;
  monthly_income?: number;
  credit_score?: number;
  debt_to_income_pct?: number;
  dti_ratio?: number;
  calculated_emi?: number;
  monthly_emi?: number;
  interest_rate?: number;
  status: string;
  decision_reasoning?: string;
  approval_factors?: string[];
  rejection_factors?: string[];
  created_at?: string;
}

export interface DocumentRecord {
  id: string;
  title: string;
  file_type: string;
  category: string;
  chunk_count: number;
  summary: string;
  created_at: string;
}

export interface DashboardSummary {
  total_customers: number;
  total_accounts: number;
  total_deposits: number;
  total_transactions: number;
  cleared_transactions: number;
  flagged_transactions: number;
  pending_hitl_tickets: number;
  total_loans_evaluated: number;
  active_banking_products: number;
  channel_distribution: Record<string, number>;
  system_status: string;
  ledger_balanced: boolean;
  as_of: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
  customer_id?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

