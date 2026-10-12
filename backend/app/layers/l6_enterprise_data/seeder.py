import uuid
from datetime import datetime, timedelta, timezone
from typing import List
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.accounts import Customer, Account, AccountType, AccountStatus
from app.models.ledger import JournalEntry, JournalLeg
from app.models.transactions import Transaction
from app.models.users import User, UserRole
from app.models.entities import BankingProduct, RiskAssessment, SystemNotification, SystemConfigurationRecord
from app.core.security import get_password_hash

SYS_CASH_ACCOUNT = "ACC-SYS-CASH"

def utc_now():
    return datetime.now(timezone.utc)

async def seed_enterprise_banking_data(db: AsyncSession):
    """
    Comprehensive Seeder for Wrench Wise AI Banking Architecture:
    - 5+ Distinct Customer Profiles
    - Multiple Accounts per Customer
    - Configured Banking Products
    - 100+ Historical Transactions with Suspicious Scenarios
    - Double-Entry Journal Entries
    - Notifications & Risk Assessments
    - Persistent configuration
    """
    # 1. Seed Users
    default_users = [
        {"id": "usr-admin", "username": "admin_operator", "email": "admin@wrenchwise.bank", "password": "Admin@2026!", "role": UserRole.ADMIN, "customer_id": None},
        {"id": "usr-compliance", "username": "compliance_officer", "email": "compliance@wrenchwise.bank", "password": "Compliance@2026!", "role": UserRole.COMPLIANCE_OFFICER, "customer_id": None},
        {"id": "usr-teller", "username": "teller_ops", "email": "teller@wrenchwise.bank", "password": "Teller@2026!", "role": UserRole.TELLER, "customer_id": None},
        {"id": "usr-aarav", "username": "aarav_patel", "email": "aarav.patel@wrenchwise.bank", "password": "Patel@2026!", "role": UserRole.CUSTOMER, "customer_id": "CUST-8801"},
        {"id": "usr-elena", "username": "elena_rostova", "email": "elena.rostova@wrenchwise.bank", "password": "Elena@2026!", "role": UserRole.CUSTOMER, "customer_id": "CUST-8802"},
        {"id": "usr-priya", "username": "priya_sundaram", "email": "priya.sundaram@wrenchwise.bank", "password": "Priya@2026!", "role": UserRole.CUSTOMER, "customer_id": "CUST-8803"},
        {"id": "usr-marcus", "username": "marcus_vance", "email": "marcus.vance@wrenchwise.bank", "password": "Marcus@2026!", "role": UserRole.CUSTOMER, "customer_id": "CUST-8804"},
        {"id": "usr-sofia", "username": "sofia_chen", "email": "sofia.chen@wrenchwise.bank", "password": "Sofia@2026!", "role": UserRole.CUSTOMER, "customer_id": "CUST-8805"},
    ]

    for u_info in default_users:
        existing_res = await db.execute(
            select(User).where(or_(User.id == u_info["id"], User.username == u_info["username"], User.email == u_info["email"]))
        )
        existing_u = existing_res.scalars().first()
        if existing_u:
            existing_u.username = u_info["username"]
            existing_u.email = u_info["email"]
            existing_u.hashed_password = get_password_hash(u_info["password"])
            existing_u.role = u_info["role"]
            existing_u.customer_id = u_info["customer_id"]
            existing_u.is_active = True
        else:
            new_u = User(
                id=u_info["id"],
                username=u_info["username"],
                email=u_info["email"],
                hashed_password=get_password_hash(u_info["password"]),
                role=u_info["role"],
                customer_id=u_info["customer_id"],
                is_active=True
            )
            db.add(new_u)
    await db.commit()

    # 2. Seed Banking Products
    product_count = (await db.execute(select(func.count(BankingProduct.id)))).scalar_one() or 0
    if product_count == 0:
        products = [
            BankingProduct(
                id="PROD-CHK-01",
                product_code="PREMIER_CHECKING",
                name="Premier Digital Checking",
                category="CHECKING",
                description="Zero fee everyday checking account with instant RTP and Fedwire transfers, contactless debit card, and FDIC insurance up to $250k.",
                interest_rate=0.25,
                min_balance=0.0,
                max_limit=100000.0,
                features=["Zero Maintenance Fee", "Free Wire Transfers", "Mobile Check Deposit", "Real-Time Fraud Alerts"],
                terms="Simulated retail checking product. Minimum opening deposit $25. No monthly maintenance fee with e-statements.",
                is_active=True
            ),
            BankingProduct(
                id="PROD-SAV-01",
                product_code="APEX_HY_SAVINGS",
                name="Apex High-Yield Savings",
                category="SAVINGS",
                description="Market-leading annual percentage yield with daily compounding interest, unlimited monthly transfers, and automated round-up savings.",
                interest_rate=4.85,
                min_balance=100.0,
                max_limit=500000.0,
                features=["4.85% APY Compounded Daily", "No Lock-in Period", "Automated Goal Vaults", "Zero Withdrawal Penalty"],
                terms="Simulated high-yield savings. Rates variable based on Federal Reserve SOFR benchmark. FDIC insured.",
                is_active=True
            ),
            BankingProduct(
                id="PROD-CD-01",
                product_code="GUARANTEED_12M_CD",
                name="12-Month Certificate of Deposit (CD)",
                category="DEPOSIT",
                description="Guaranteed fixed-rate return locked for 12 months. Protected capital growth with zero market volatility exposure.",
                interest_rate=5.15,
                min_balance=1000.0,
                max_limit=1000000.0,
                features=["5.15% Fixed Annual Yield", "Guaranteed Principal & Interest", "Flexible Payout Schedule", "Automatic Renewal Option"],
                terms="Simulated term deposit. Early withdrawal subject to 90 days interest penalty. Principal 100% protected.",
                is_active=True
            ),
            BankingProduct(
                id="PROD-CRD-01",
                product_code="INFINITE_METAL_CARD",
                name="Wrench Wise Infinite Metal Visa",
                category="CARD",
                description="Exclusive 3% cash-back on travel and dining, airport lounge access worldwide, and zero foreign transaction fees.",
                interest_rate=16.99,
                min_balance=0.0,
                max_limit=50000.0,
                features=["3% Cash Back Worldwide", "Airport Lounge Access", "Zero Foreign FX Fees", "Instant Virtual Cards"],
                terms="Simulated revolving credit card. APR 16.99% variable. Grace period 25 days on purchases.",
                is_active=True
            ),
            BankingProduct(
                id="PROD-LON-01",
                product_code="FIXED_PERSONAL_LOAN",
                name="Express Fixed Personal Loan",
                category="LOAN",
                description="Fast multi-agent underwritten unsecured personal loan from $5,000 to $50,000 with transparent monthly EMI.",
                interest_rate=6.99,
                min_balance=5000.0,
                max_limit=50000.0,
                features=["Same-Day Decisioning", "Fixed Monthly EMI", "No Prepayment Penalty", "Flexible 12 to 60 Month Tenures"],
                terms="Simulated consumer installment loan. Subject to Debt-to-Income (DTI <= 43%) and Credit Bureau check.",
                is_active=True
            ),
            BankingProduct(
                id="PROD-BUS-01",
                product_code="COMMERCIAL_CREDIT_LINE",
                name="Commercial Working Capital Line",
                category="WEALTH",
                description="Revolving credit line for mid-market business operations, payroll smoothing, and rapid inventory financing.",
                interest_rate=7.49,
                min_balance=25000.0,
                max_limit=250000.0,
                features=["Revolving Draw Availability", "Interest Only on Drawn Funds", "Dedicated RM Support", "Automated Sweep Accounts"],
                terms="Simulated commercial banking product. Annual review required with corporate balance sheet submission.",
                is_active=True
            ),
        ]
        db.add_all(products)
        await db.commit()

    # 3. Seed Customers
    cust_count = (await db.execute(select(func.count(Customer.id)))).scalar_one() or 0
    if cust_count < 5:
        customers_to_seed = [
            Customer(
                id="CUST-8801",
                cif="CIF-9921034",
                full_name="Aarav Patel",
                email="aarav.patel@wrenchwise.bank",
                phone="+1 (555) 234-5678",
                dob="1988-06-14",
                address="42 Wall Street, Financial District, New York, NY",
                nationality="United States",
                segment="PREMIUM",
                kyc_tier="TIER_3",
                kyc_status="VERIFIED",
                credit_bureau_score=785
            ),
            Customer(
                id="CUST-8802",
                cif="CIF-9921098",
                full_name="Elena Rostova",
                email="elena.rostova@wrenchwise.bank",
                phone="+44 20 7946 0912",
                dob="1992-11-03",
                address="15 Canary Wharf, London, UK",
                nationality="United Kingdom",
                segment="RETAIL",
                kyc_tier="TIER_2",
                kyc_status="FLAGGED",
                credit_bureau_score=610
            ),
            Customer(
                id="CUST-8803",
                cif="CIF-9934112",
                full_name="Dr. Priya Sundaram",
                email="priya.sundaram@wrenchwise.bank",
                phone="+1 (555) 944-1234",
                dob="1982-04-20",
                address="88 Cambridge Center, Boston, MA",
                nationality="United States",
                segment="PRIVATE_WEALTH",
                kyc_tier="TIER_3",
                kyc_status="VERIFIED",
                credit_bureau_score=840
            ),
            Customer(
                id="CUST-8804",
                cif="CIF-9945201",
                full_name="Marcus Vance",
                email="marcus.vance@wrenchwise.bank",
                phone="+1 (415) 882-9901",
                dob="1985-09-12",
                address="500 Howard Street, San Francisco, CA",
                nationality="United States",
                segment="PREMIUM",
                kyc_tier="TIER_3",
                kyc_status="VERIFIED",
                credit_bureau_score=720
            ),
            Customer(
                id="CUST-8805",
                cif="CIF-9956314",
                full_name="Sofia Chen",
                email="sofia.chen@wrenchwise.bank",
                phone="+1 (206) 431-7722",
                dob="1994-01-25",
                address="1201 3rd Avenue, Seattle, WA",
                nationality="United States",
                segment="RETAIL",
                kyc_tier="TIER_3",
                kyc_status="VERIFIED",
                credit_bureau_score=765
            ),
        ]
        for c in customers_to_seed:
            existing = (await db.execute(select(Customer).where(Customer.id == c.id))).scalars().first()
            if not existing:
                db.add(c)
        await db.commit()

    # 4. Seed Accounts
    accounts_to_seed = [
        # System Treasury Account
        Account(account_number=SYS_CASH_ACCOUNT, customer_id="SYS-TREASURY", account_type="SETTLEMENT", currency="USD", balance=10000000.0, available_balance=10000000.0, daily_limit=0.0, status=AccountStatus.ACTIVE),
        # Aarav Patel
        Account(account_number="ACC-1002341", customer_id="CUST-8801", account_type=AccountType.CHECKING, currency="USD", balance=48500.50, available_balance=48500.50, daily_limit=25000.0, status=AccountStatus.ACTIVE),
        Account(account_number="ACC-1002342", customer_id="CUST-8801", account_type=AccountType.SAVINGS, currency="USD", balance=142000.00, available_balance=142000.00, daily_limit=50000.0, status=AccountStatus.ACTIVE),
        # Elena Rostova
        Account(account_number="ACC-2009811", customer_id="CUST-8802", account_type=AccountType.CHECKING, currency="USD", balance=8900.20, available_balance=8900.20, daily_limit=5000.0, status=AccountStatus.UNDER_REVIEW),
        Account(account_number="ACC-2009812", customer_id="CUST-8802", account_type=AccountType.SAVINGS, currency="USD", balance=15200.00, available_balance=15200.00, daily_limit=10000.0, status=AccountStatus.ACTIVE),
        # Dr. Priya Sundaram
        Account(account_number="ACC-3004519", customer_id="CUST-8803", account_type=AccountType.SALARY, currency="USD", balance=92350.75, available_balance=92350.75, daily_limit=50000.0, status=AccountStatus.ACTIVE),
        Account(account_number="ACC-3004520", customer_id="CUST-8803", account_type=AccountType.TERM_DEPOSIT, currency="USD", balance=250000.00, available_balance=250000.00, daily_limit=0.0, status=AccountStatus.ACTIVE),
        # Marcus Vance
        Account(account_number="ACC-4008101", customer_id="CUST-8804", account_type=AccountType.CHECKING, currency="USD", balance=78420.30, available_balance=78420.30, daily_limit=50000.0, status=AccountStatus.ACTIVE),
        Account(account_number="ACC-4008102", customer_id="CUST-8804", account_type=AccountType.LINE_OF_CREDIT, currency="USD", balance=150000.00, available_balance=150000.00, daily_limit=75000.0, status=AccountStatus.ACTIVE),
        # Sofia Chen
        Account(account_number="ACC-5009211", customer_id="CUST-8805", account_type=AccountType.CHECKING, currency="USD", balance=21450.60, available_balance=21450.60, daily_limit=15000.0, status=AccountStatus.ACTIVE),
        Account(account_number="ACC-5009212", customer_id="CUST-8805", account_type=AccountType.SAVINGS, currency="USD", balance=64300.00, available_balance=64300.00, daily_limit=25000.0, status=AccountStatus.ACTIVE),
    ]
    for acc in accounts_to_seed:
        existing = (await db.execute(select(Account).where(Account.account_number == acc.account_number))).scalars().first()
        if not existing:
            db.add(acc)
    await db.commit()

    # 4b. Ensure Genesis Double-Entry Journal Entry covers all customer opening balances
    genesis_jnl = (await db.execute(select(JournalEntry).where(JournalEntry.id == "jnl-init-system"))).scalars().first()
    if not genesis_jnl:
        customer_accounts = [a for a in accounts_to_seed if a.account_number != SYS_CASH_ACCOUNT]
        tot_open = sum(a.balance for a in customer_accounts)
        jnl = JournalEntry(
            id="jnl-init-system",
            reference_number="REF-SYS-GENESIS",
            transaction_id="txn-genesis",
            narrative="System Genesis Ledger Posting",
            total_amount=round(tot_open, 2),
            currency="USD",
            is_balanced=True,
            reconciled=True,
            reconciled_at=datetime.now(timezone.utc)
        )
        db.add(jnl)
        # Add debit leg for system cash
        db.add(JournalLeg(
            id=str(uuid.uuid4()),
            journal_entry_id=jnl.id,
            account_number=SYS_CASH_ACCOUNT,
            direction="DEBIT",
            amount=round(tot_open, 2),
            currency="USD",
            running_balance_after=10000000.0
        ))
        # Add credit leg for each customer account
        for a in customer_accounts:
            db.add(JournalLeg(
                id=str(uuid.uuid4()),
                journal_entry_id=jnl.id,
                account_number=a.account_number,
                direction="CREDIT",
                amount=a.balance,
                currency="USD",
                running_balance_after=a.balance
            ))
        await db.commit()

    # 5. Seed 100+ Transactions If Needed
    txn_count = (await db.execute(select(func.count(Transaction.id)))).scalar_one() or 0
    if txn_count < 100:
        base_date = datetime.now(timezone.utc) - timedelta(days=90)
        
        sample_merchants = [
            ("AWS Cloud Infrastructure", "UTILITIES", "WEB", 1420.50, 4.0, "LOW"),
            ("Whole Foods Organic Market", "GROCERIES", "POS", 184.25, 2.0, "LOW"),
            ("Delta Air Lines Flight Ticket", "TRAVEL", "WEB", 845.00, 12.0, "LOW"),
            ("Stripe Automated Merchant Payout", "SALARY", "API", 8500.00, 1.0, "LOW"),
            ("Equinox Fitness Membership", "HEALTH", "POS", 280.00, 1.5, "LOW"),
            ("Apple Store Fifth Avenue", "SHOPPING", "POS", 1299.00, 15.0, "LOW"),
            ("Starbucks Reserve Roastery", "DINING", "MOBILE", 14.75, 1.0, "LOW"),
            ("ConEdison Electricity Bill", "UTILITIES", "WEB", 215.40, 2.0, "LOW"),
            ("Uber Technologies Ride", "TRANSPORT", "MOBILE", 42.80, 2.5, "LOW"),
            ("Netflix 4K Premium Subscription", "ENTERTAINMENT", "WEB", 22.99, 1.0, "LOW"),
            ("Bloomberg Professional Terminal", "BUSINESS", "WEB", 2400.00, 8.0, "LOW"),
            ("Target Superstore Household", "SHOPPING", "POS", 92.15, 2.0, "LOW"),
            ("Chevron Gas Station Fuel", "TRANSPORT", "POS", 65.50, 3.0, "LOW"),
            ("Blue Bottle Coffee Manhattan", "DINING", "MOBILE", 9.50, 1.0, "LOW"),
            ("Metropolitan Museum Membership", "DONATION", "WEB", 150.00, 2.0, "LOW"),
        ]

        accounts_pool = ["ACC-1002341", "ACC-1002342", "ACC-2009811", "ACC-3004519", "ACC-4008101", "ACC-5009211"]
        transactions_to_insert = []

        # Generate realistic historical transactions spread across 90 days
        for i in range(105):
            days_ago = 90 - int((i / 105.0) * 89)
            txn_time = base_date + timedelta(days=days_ago, hours=(i * 7) % 24, minutes=(i * 19) % 60)
            merchant, cat, ch, amt, risk, rlevel = sample_merchants[i % len(sample_merchants)]
            
            # Vary amount slightly
            factor = 0.8 + ((i % 5) * 0.1)
            final_amount = round(amt * factor, 2)
            src_acc = accounts_pool[i % len(accounts_pool)]
            
            direction = "CREDIT" if cat == "SALARY" else "DEBIT"

            t = Transaction(
                id=f"TXN-SIM-{1000 + i}",
                idempotency_key=f"idemp-gen-{1000 + i}",
                trace_id=f"trc-batch-{1000 + i}",
                source_account=src_acc,
                destination_account="ACC-SYS-CASH" if direction == "DEBIT" else None,
                counterparty_name=merchant,
                amount=final_amount,
                currency="USD",
                direction=direction,
                category=cat,
                channel=ch,
                status="CLEARED",
                fraud_risk_score=risk,
                risk_level=rlevel,
                origin_ip=f"192.168.1.{(i % 200) + 10}",
                origin_geo="United States" if ch != "API" else "Cloud Gateway",
                created_at=txn_time,
                cleared_at=txn_time + timedelta(seconds=2)
            )
            transactions_to_insert.append(t)

        # Explicit Seeded Suspicious Scenarios
        suspicious_txns = [
            Transaction(
                id="TXN-SUSP-9901",
                idempotency_key="idemp-susp-9901",
                trace_id="trc-fraud-nassau",
                source_account="ACC-1002341",
                destination_account="ACC-OFFSHORE-CYPRUS",
                counterparty_name="Nassau Maritime Holdings Ltd",
                amount=49990.00,
                currency="USD",
                direction="DEBIT",
                category="WIRE",
                channel="WEB",
                status="FROZEN_FRAUD",
                fraud_risk_score=94.5,
                risk_level="CRITICAL",
                origin_ip="185.220.101.44",
                origin_geo="Cyprus (Tor Exit Node)",
                created_at=datetime.now(timezone.utc) - timedelta(hours=4),
                failure_reason="Triggered AML Sanctions Rule: OFAC High-Risk Flag & Impossible Travel Velocity"
            ),
            Transaction(
                id="TXN-SUSP-9902",
                idempotency_key="idemp-susp-9902",
                trace_id="trc-velocity-spike",
                source_account="ACC-2009811",
                destination_account="ACC-CRYPTO-GATEWAY",
                counterparty_name="RapidPay Escrow Exchange",
                amount=9850.00,
                currency="USD",
                direction="DEBIT",
                category="WIRE",
                channel="MOBILE",
                status="FROZEN_FRAUD",
                fraud_risk_score=88.0,
                risk_level="HIGH",
                origin_ip="194.26.29.112",
                origin_geo="Eastern Europe",
                created_at=datetime.now(timezone.utc) - timedelta(hours=14),
                failure_reason="Rapid velocity spike: 4 transfers in under 120 seconds exceeding KYC limits"
            ),
            Transaction(
                id="TXN-SUSP-9903",
                idempotency_key="idemp-susp-9903",
                trace_id="trc-midnight-atm",
                source_account="ACC-4008101",
                destination_account="ATM-CASHOUT-77",
                counterparty_name="Remote Unbranded ATM Cashout",
                amount=4500.00,
                currency="USD",
                direction="DEBIT",
                category="CASH",
                channel="ATM",
                status="CLEARED",
                fraud_risk_score=76.2,
                risk_level="HIGH",
                origin_ip="10.88.2.14",
                origin_geo="Las Vegas, NV",
                created_at=datetime.now(timezone.utc) - timedelta(days=2),
                cleared_at=datetime.now(timezone.utc) - timedelta(days=2)
            ),
        ]
        transactions_to_insert.extend(suspicious_txns)
        db.add_all(transactions_to_insert)
        await db.commit()

    # 6. Seed Risk Assessments
    risk_count = (await db.execute(select(func.count(RiskAssessment.id)))).scalar_one() or 0
    if risk_count == 0:
        sample_risks = [
            RiskAssessment(
                id="RSK-2026-001",
                transaction_id="TXN-SUSP-9901",
                customer_id="CUST-8801",
                account_number="ACC-1002341",
                risk_score=94.5,
                severity="CRITICAL",
                triggered_rules=["OFAC_WATCHLIST_SANCTIONS_MATCH", "UNUSUAL_HIGH_VALUE_WIRE", "IMPOSSIBLE_TRAVEL_VELOCITY"],
                supporting_evidence={"beneficiary": "Nassau Maritime Holdings Ltd", "ip_country": "Cyprus", "prev_location": "New York, USA (45 mins ago)"},
                recommended_action="IMMEDIATE_ACCOUNT_FREEZE_AND_SAR_FILING",
                decision="BLOCK",
                evaluated_by="RISK_FRAUD_AGENT"
            ),
            RiskAssessment(
                id="RSK-2026-002",
                transaction_id="TXN-SUSP-9902",
                customer_id="CUST-8802",
                account_number="ACC-2009811",
                risk_score=88.0,
                severity="HIGH",
                triggered_rules=["VELOCITY_BURST_THRESHOLD", "NEW_UNVERIFIED_BENEFICIARY"],
                supporting_evidence={"frequency": "4 txns in 90 seconds", "total_burst": "$24,500"},
                recommended_action="STEP_UP_MFA_AND_COMPLIANCE_SIGN_OFF",
                decision="REVIEW_REQUIRED",
                evaluated_by="RISK_FRAUD_AGENT"
            ),
            RiskAssessment(
                id="RSK-2026-003",
                transaction_id="TXN-SIM-1010",
                customer_id="CUST-8803",
                account_number="ACC-3004519",
                risk_score=4.2,
                severity="LOW",
                triggered_rules=[],
                supporting_evidence={"status": "Routine salary deposit from established corporate payroll"},
                recommended_action="AUTOMATED_CLEARANCE",
                decision="ALLOW",
                evaluated_by="RISK_FRAUD_AGENT"
            )
        ]
        db.add_all(sample_risks)
        await db.commit()

    # 7. Seed Notifications
    notif_count = (await db.execute(select(func.count(SystemNotification.id)))).scalar_one() or 0
    if notif_count == 0:
        sample_notifs = [
            SystemNotification(
                id="NOTIF-01",
                recipient_id="CUST-8801",
                category="RISK_ALERT",
                severity="CRITICAL",
                title="Wire Transfer Blocked & Account Secured",
                message="A high-risk wire transfer of $49,990.00 to Nassau Maritime Holdings Ltd was automatically flagged and held for security review.",
                reference_id="TXN-SUSP-9901",
                is_read=False
            ),
            SystemNotification(
                id="NOTIF-02",
                recipient_id="ADMIN",
                category="COMPLIANCE",
                severity="WARNING",
                title="HITL Review Ticket Generated #TKT-8801",
                message="Automated multi-agent consensus flagged suspicious offshore wire transfer. Chief Compliance sign-off required.",
                reference_id="TKT-8801",
                is_read=False
            ),
            SystemNotification(
                id="NOTIF-03",
                recipient_id="CUST-8803",
                category="TRANSACTION",
                severity="INFO",
                title="Direct Deposit Cleared",
                message="Salary deposit of $8,500.00 from Harvard Medical System successfully credited to account ACC-3004519.",
                reference_id="TXN-SIM-1010",
                is_read=True
            ),
            SystemNotification(
                id="NOTIF-04",
                recipient_id="CUST-8801",
                category="LOAN",
                severity="INFO",
                title="Personal Loan Pre-Approval",
                message="Your application for a $25,000 24-month personal loan has been conditionally approved with an EMI of $1,136.50/mo.",
                reference_id="LOAN-PRE-2026",
                is_read=False
            )
        ]
        db.add_all(sample_notifs)
        await db.commit()

    # 8. Seed System Configurations
    config_count = (await db.execute(select(func.count(SystemConfigurationRecord.key)))).scalar_one() or 0
    if config_count == 0:
        sample_configs = [
            SystemConfigurationRecord(key="PROMPT_VERSION", value="v1.2-enterprise-banking-core", description="Active agent system prompt package"),
            SystemConfigurationRecord(key="ACTIVE_MODEL_PROVIDER", value="Google Gemini / Vertex AI", description="Primary AI Gateway provider"),
            SystemConfigurationRecord(key="DEFAULT_MODEL", value="gemini-2.5-pro-experimental", description="Supervisor model identifier"),
            SystemConfigurationRecord(key="EXECUTION_MODE", value="DETERMINISTIC_HYBRID_AUTO", description="Active AI Gateway routing mode"),
            SystemConfigurationRecord(key="DAILY_TOKEN_BUDGET", value="500000", description="FinOps daily token ceiling"),
            SystemConfigurationRecord(key="HITL_THRESHOLD_USD", value="25000.00", description="Threshold for Human-In-The-Loop review"),
            SystemConfigurationRecord(key="FRAUD_CRITICAL_SCORE", value="75.0", description="Threshold for autonomous account freeze"),
        ]
        db.add_all(sample_configs)
        await db.commit()
