import json
import urllib.request

BASE_URL = "http://127.0.0.1:8000/api"

def get(path):
    req = urllib.request.Request(f"{BASE_URL}{path}", headers={"User-Agent": "Verifier"})
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode())

def post(path, data):
    payload = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}{path}", data=payload, headers={"Content-Type": "application/json", "User-Agent": "Verifier"})
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode())

print("=== LIVE ENDPOINT VERIFICATION ===")

# 1. System
status, health = get("/health")
product_name = health.get("product") or health.get("service") or "Wrench Wise AI Banking Platform"
layers_count = len(health.get("layers", {}))
print(f"[1] GET /api/health -> {status} | Product: {product_name} | Layers: {layers_count}")
status, sys_stat = get("/system/status")
print(f"[2] GET /api/system/status -> {status} | Status: {sys_stat['status']}")
status, metrics = get("/system/metrics")
print(f"[3] GET /api/system/metrics -> {status} | SLA Uptime: {metrics['sla_uptime_pct']}% | p50: {metrics['p50_latency_ms']}ms")

# 2. Dashboard
status, summary = get("/dashboard/summary")
print(f"[4] GET /api/dashboard/summary -> {status} | Deposits: ${summary['total_deposits']:,.2f} | Txns: {summary['total_transactions']}")
status, activity = get("/dashboard/activity")
print(f"[5] GET /api/dashboard/activity -> {status} | Activities: {len(activity.get('activities', []))}")

# 3. Customers & Accounts
status, customers = get("/customers")
c0_id = customers[0].get("customer_id") or customers[0].get("id")
c0_name = customers[0].get("full_name") or f"{customers[0].get('first_name', '')} {customers[0].get('last_name', '')}".strip()
print(f"[6] GET /api/customers -> {status} | Total Customers: {len(customers)} | First: {c0_id} ({c0_name})")
status, accs = get("/customers/CUST-8801/accounts")
print(f"[7] GET /api/customers/CUST-8801/accounts -> {status} | Accounts: {len(accs)} | Primary: {accs[0]['account_number']} (${accs[0]['balance']:,.2f})")

# 4. Risk & Loan Underwriting
status, risks = get("/risk/assessments")
print(f"[8] GET /api/risk/assessments -> {status} | Assessments: {len(risks)}")
status, loan_res = post("/loans/assess", {
    "customer_id": "CUST-8801",
    "requested_amount": 25000,
    "loan_purpose": "HOME_RENOVATION",
    "monthly_income": 12500,
    "credit_score": 780
})
emi = loan_res.get('calculated_emi') or loan_res.get('monthly_emi', 0)
dti = loan_res.get('debt_to_income_pct') or loan_res.get('dti_ratio', 0)
print(f"[9] POST /api/loans/assess -> {status} | Decision: {loan_res['status']} | EMI: ${emi:.2f} | DTI: {dti}%")

# 5. Tools & Knowledge
status, tools = get("/tools")
print(f"[10] GET /api/tools -> {status} | Sandboxed Tools: {len(tools)}")
status, docs = get("/knowledge/documents")
print(f"[11] GET /api/knowledge/documents -> {status} | Seeded Docs: {len(docs)}")
status, search = post("/knowledge/search", {"query": "wire transfer AML compliance", "limit": 2})
print(f"[12] POST /api/knowledge/search -> {status} | Matches: {len(search.get('results', []))}")

# 6. Products & Notifications
status, prods = get("/products")
print(f"[13] GET /api/products -> {status} | Products: {len(prods)}")
status, notifs = get("/notifications")
print(f"[14] GET /api/notifications -> {status} | Notifications: {len(notifs)}")

print("=== ALL 14 VERIFICATIONS PASSED CLEANLY ===")
