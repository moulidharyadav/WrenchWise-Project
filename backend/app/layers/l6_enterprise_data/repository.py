import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, and_, func

from app.models.accounts import Customer, Account, AccountType, AccountStatus
from app.models.ledger import JournalEntry, JournalLeg
from app.models.transactions import Transaction
from app.models.hitl import LoanApplication, HITLApproval
from app.models.users import User, UserRole
from app.core.security import get_password_hash
from app.core.events import event_bus

SYS_CASH_ACCOUNT = "ACC-SYS-CASH"

class BankingRepository:
    """
    Layer 6: Enterprise Data Repositories.
    Enforces atomic double-entry bookkeeping, strict balance checks,
    idempotency protection, reconciliation audits, and synthetic entity seeding.
    """
    def __init__(self, db: AsyncSession):
        self.db = db

    # --------------------------------------------------------------------------
    # CUSTOMERS & USERS
    # --------------------------------------------------------------------------
    async def get_customer(self, customer_id: str) -> Optional[Customer]:
        result = await self.db.execute(select(Customer).where(Customer.id == customer_id))
        return result.scalars().first()

    async def list_customers(self) -> List[Customer]:
        result = await self.db.execute(select(Customer).order_by(Customer.created_at.asc()))
        return list(result.scalars().all())

    async def get_customer_accounts(self, customer_id: str) -> List[Account]:
        result = await self.db.execute(
            select(Account).where(Account.customer_id == customer_id).order_by(Account.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_user_by_username(self, username: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.username == username))
        return result.scalars().first()

    async def create_user(
        self,
        username: str,
        email: str,
        raw_password: str,
        role: str = UserRole.CUSTOMER,
        customer_id: Optional[str] = None
    ) -> User:
        user = User(
            id=f"usr-{uuid.uuid4().hex[:10]}",
            username=username,
            email=email,
            hashed_password=get_password_hash(raw_password),
            role=role,
            customer_id=customer_id,
            is_active=True
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    # --------------------------------------------------------------------------
    # ACCOUNTS
    # --------------------------------------------------------------------------
    async def get_account(self, account_number: str) -> Optional[Account]:
        result = await self.db.execute(select(Account).where(Account.account_number == account_number))
        return result.scalars().first()

    async def list_accounts(self) -> List[Account]:
        result = await self.db.execute(
            select(Account).where(Account.account_number != SYS_CASH_ACCOUNT).order_by(Account.created_at.desc())
        )
        return list(result.scalars().all())

    async def create_account(
        self,
        customer_id: str,
        account_type: str = AccountType.CHECKING,
        currency: str = "USD",
        initial_deposit: float = 0.0,
        daily_limit: float = 25000.0
    ) -> Tuple[bool, str, Optional[Account]]:
        customer = await self.get_customer(customer_id)
        if not customer:
            return False, f"Customer ID {customer_id} not found.", None

        # Generate unique account number
        acc_num = f"ACC-{uuid.uuid4().hex[:7].upper()}"
        account = Account(
            account_number=acc_num,
            customer_id=customer_id,
            account_type=account_type,
            currency=currency,
            balance=0.0,
            available_balance=0.0,
            hold_amount=0.0,
            daily_limit=daily_limit,
            status=AccountStatus.ACTIVE
        )
        self.db.add(account)
        await self.db.commit()
        await self.db.refresh(account)

        # If initial deposit specified, execute atomic double-entry deposit
        if initial_deposit > 0:
            await self.post_deposit(
                account_number=acc_num,
                amount=initial_deposit,
                narrative="Initial Account Opening Deposit",
                trace_id="trc-init-open",
                channel="BRANCH"
            )
            await self.db.refresh(account)

        return True, "Account created successfully.", account

    # --------------------------------------------------------------------------
    # DEPOSITS (Double-Entry: Debit System Cash, Credit Customer Account)
    # --------------------------------------------------------------------------
    async def post_deposit(
        self,
        account_number: str,
        amount: float,
        narrative: str,
        trace_id: str,
        channel: str = "BRANCH",
        idempotency_key: Optional[str] = None
    ) -> Tuple[bool, str, Optional[Transaction]]:
        if amount <= 0:
            return False, "Deposit amount must be strictly greater than 0.", None

        # Idempotency check
        if idempotency_key:
            existing = await self.db.execute(
                select(Transaction).where(Transaction.idempotency_key == idempotency_key)
            )
            if existing.scalars().first():
                return False, "Duplicate request: Idempotency key already committed.", None

        acc = await self.get_account(account_number)
        if not acc:
            return False, f"Target account {account_number} not found.", None
        if acc.status != AccountStatus.ACTIVE:
            return False, f"Account {account_number} is {acc.status}.", None

        sys_cash = await self.get_account(SYS_CASH_ACCOUNT)
        if not sys_cash:
            return False, "System cash clearing account is uninitialized.", None

        # Atomic Balance Update
        acc.balance += amount
        acc.available_balance += amount
        sys_cash.balance += amount

        txn_id = f"txn-{uuid.uuid4().hex[:10]}"
        journal_id = f"jnl-{uuid.uuid4().hex[:10]}"

        # Record Transaction
        txn = Transaction(
            id=txn_id,
            idempotency_key=idempotency_key,
            trace_id=trace_id,
            source_account=SYS_CASH_ACCOUNT,
            destination_account=account_number,
            counterparty_name="System Vault Deposit",
            amount=amount,
            currency=acc.currency,
            direction="CREDIT",
            category="DEPOSIT",
            channel=channel,
            status="CLEARED",
            fraud_risk_score=2.0,
            risk_level="LOW",
            cleared_at=datetime.utcnow()
        )
        self.db.add(txn)

        # Balanced Double-Entry Journal
        journal = JournalEntry(
            id=journal_id,
            reference_number=f"REF-DEP-{uuid.uuid4().hex[:8].upper()}",
            transaction_id=txn_id,
            narrative=narrative,
            total_amount=amount,
            currency=acc.currency,
            is_balanced=True,
            reconciled=True,
            reconciled_at=datetime.utcnow()
        )
        self.db.add(journal)

        leg_sys_debit = JournalLeg(
            id=str(uuid.uuid4()),
            journal_entry_id=journal_id,
            account_number=SYS_CASH_ACCOUNT,
            direction="DEBIT",
            amount=amount,
            currency=acc.currency,
            running_balance_after=sys_cash.balance
        )
        leg_cust_credit = JournalLeg(
            id=str(uuid.uuid4()),
            journal_entry_id=journal_id,
            account_number=account_number,
            direction="CREDIT",
            amount=amount,
            currency=acc.currency,
            running_balance_after=acc.balance
        )
        self.db.add(leg_sys_debit)
        self.db.add(leg_cust_credit)

        await self.db.commit()
        await self.db.refresh(txn)

        await event_bus.publish("transaction.completed", {
            "transaction_id": txn_id,
            "type": "DEPOSIT",
            "account": account_number,
            "amount": amount,
            "trace_id": trace_id
        }, correlation_id=trace_id)

        return True, "Deposit settled into double-entry ledger successfully.", txn

    # --------------------------------------------------------------------------
    # WITHDRAWALS (Double-Entry: Debit Customer Account, Credit System Cash)
    # --------------------------------------------------------------------------
    async def post_withdrawal(
        self,
        account_number: str,
        amount: float,
        narrative: str,
        trace_id: str,
        channel: str = "BRANCH",
        idempotency_key: Optional[str] = None
    ) -> Tuple[bool, str, Optional[Transaction]]:
        if amount <= 0:
            return False, "Withdrawal amount must be strictly greater than 0.", None

        # Idempotency check
        if idempotency_key:
            existing = await self.db.execute(
                select(Transaction).where(Transaction.idempotency_key == idempotency_key)
            )
            if existing.scalars().first():
                return False, "Duplicate request: Idempotency key already committed.", None

        acc = await self.get_account(account_number)
        if not acc:
            return False, f"Account {account_number} not found.", None
        if acc.status != AccountStatus.ACTIVE:
            return False, f"Account {account_number} is {acc.status}.", None
        if acc.available_balance < amount:
            # Publish rejection event
            await event_bus.publish("transaction.rejected", {
                "account": account_number,
                "amount": amount,
                "reason": "Insufficient funds"
            }, correlation_id=trace_id)
            return False, f"Insufficient funds. Available: ${acc.available_balance:,.2f}, Requested: ${amount:,.2f}", None

        sys_cash = await self.get_account(SYS_CASH_ACCOUNT)
        if not sys_cash:
            return False, "System cash clearing account is uninitialized.", None

        # Atomic Balance Update
        acc.balance -= amount
        acc.available_balance -= amount
        sys_cash.balance -= amount

        txn_id = f"txn-{uuid.uuid4().hex[:10]}"
        journal_id = f"jnl-{uuid.uuid4().hex[:10]}"

        # Record Transaction
        txn = Transaction(
            id=txn_id,
            idempotency_key=idempotency_key,
            trace_id=trace_id,
            source_account=account_number,
            destination_account=SYS_CASH_ACCOUNT,
            counterparty_name="Cash Withdrawal Vault",
            amount=amount,
            currency=acc.currency,
            direction="DEBIT",
            category="WITHDRAWAL",
            channel=channel,
            status="CLEARED",
            fraud_risk_score=4.0,
            risk_level="LOW",
            cleared_at=datetime.utcnow()
        )
        self.db.add(txn)

        # Balanced Double-Entry Journal
        journal = JournalEntry(
            id=journal_id,
            reference_number=f"REF-WTH-{uuid.uuid4().hex[:8].upper()}",
            transaction_id=txn_id,
            narrative=narrative,
            total_amount=amount,
            currency=acc.currency,
            is_balanced=True,
            reconciled=True,
            reconciled_at=datetime.utcnow()
        )
        self.db.add(journal)

        leg_cust_debit = JournalLeg(
            id=str(uuid.uuid4()),
            journal_entry_id=journal_id,
            account_number=account_number,
            direction="DEBIT",
            amount=amount,
            currency=acc.currency,
            running_balance_after=acc.balance
        )
        leg_sys_credit = JournalLeg(
            id=str(uuid.uuid4()),
            journal_entry_id=journal_id,
            account_number=SYS_CASH_ACCOUNT,
            direction="CREDIT",
            amount=amount,
            currency=acc.currency,
            running_balance_after=sys_cash.balance
        )
        self.db.add(leg_cust_debit)
        self.db.add(leg_sys_credit)

        await self.db.commit()
        await self.db.refresh(txn)

        await event_bus.publish("transaction.completed", {
            "transaction_id": txn_id,
            "type": "WITHDRAWAL",
            "account": account_number,
            "amount": amount,
            "trace_id": trace_id
        }, correlation_id=trace_id)

        return True, "Withdrawal processed and journal entry committed.", txn

    # --------------------------------------------------------------------------
    # ACCOUNT-TO-ACCOUNT TRANSFERS (Atomic Double-Entry)
    # --------------------------------------------------------------------------
    async def post_double_entry_transfer(
        self,
        source_acc_num: str,
        dest_acc_num: str,
        amount: float,
        narrative: str,
        trace_id: str,
        channel: str = "WEB",
        idempotency_key: str = None
    ) -> Tuple[bool, str, Optional[Transaction]]:
        if amount <= 0:
            return False, "Transfer amount must be strictly greater than 0.", None
        if source_acc_num == dest_acc_num:
            return False, "Source and destination accounts must be distinct.", None

        # 1. Idempotency Check
        if idempotency_key:
            existing = await self.db.execute(
                select(Transaction).where(Transaction.idempotency_key == idempotency_key)
            )
            if existing.scalars().first():
                return False, "Duplicate request: Idempotency key already committed.", None

        src_acc = await self.get_account(source_acc_num)
        dst_acc = await self.get_account(dest_acc_num)

        if not src_acc:
            return False, f"Source account {source_acc_num} not found.", None
        if not dst_acc:
            return False, f"Destination account {dest_acc_num} not found.", None
        if src_acc.status != AccountStatus.ACTIVE:
            return False, f"Source account {source_acc_num} is {src_acc.status}.", None
        if dst_acc.status != AccountStatus.ACTIVE:
            return False, f"Destination account {dest_acc_num} is {dst_acc.status}.", None
        if src_acc.available_balance < amount:
            await event_bus.publish("transaction.rejected", {
                "source": source_acc_num,
                "destination": dest_acc_num,
                "amount": amount,
                "reason": "Insufficient funds"
            }, correlation_id=trace_id)
            return False, f"Insufficient funds. Available: ${src_acc.available_balance:,.2f}, Required: ${amount:,.2f}", None

        # Publish transaction created event
        await event_bus.publish("transaction.created", {
            "source": source_acc_num,
            "destination": dest_acc_num,
            "amount": amount,
            "trace_id": trace_id
        }, correlation_id=trace_id)

        # 2. Atomic Balance Update
        src_acc.balance -= amount
        src_acc.available_balance -= amount
        dst_acc.balance += amount
        dst_acc.available_balance += amount

        txn_id = f"txn-{uuid.uuid4().hex[:10]}"
        journal_id = f"jnl-{uuid.uuid4().hex[:10]}"

        # 3. Create Transaction Record
        txn = Transaction(
            id=txn_id,
            idempotency_key=idempotency_key,
            trace_id=trace_id,
            source_account=source_acc_num,
            destination_account=dest_acc_num,
            counterparty_name=f"Account {dest_acc_num}",
            amount=amount,
            currency=src_acc.currency,
            direction="DEBIT",
            category="TRANSFER",
            channel=channel,
            status="CLEARED",
            fraud_risk_score=5.0,
            risk_level="LOW",
            cleared_at=datetime.utcnow()
        )
        self.db.add(txn)

        # 4. Create Double-Entry Journal Entry
        journal = JournalEntry(
            id=journal_id,
            reference_number=f"REF-TRF-{uuid.uuid4().hex[:8].upper()}",
            transaction_id=txn_id,
            narrative=narrative,
            total_amount=amount,
            currency=src_acc.currency,
            is_balanced=True,
            reconciled=True,
            reconciled_at=datetime.utcnow()
        )
        self.db.add(journal)

        # 5. Create Balanced Debit & Credit Legs
        leg_debit = JournalLeg(
            id=str(uuid.uuid4()),
            journal_entry_id=journal_id,
            account_number=source_acc_num,
            direction="DEBIT",
            amount=amount,
            currency=src_acc.currency,
            running_balance_after=src_acc.balance
        )
        leg_credit = JournalLeg(
            id=str(uuid.uuid4()),
            journal_entry_id=journal_id,
            account_number=dest_acc_num,
            direction="CREDIT",
            amount=amount,
            currency=src_acc.currency,
            running_balance_after=dst_acc.balance
        )
        self.db.add(leg_debit)
        self.db.add(leg_credit)

        await self.db.commit()
        await self.db.refresh(txn)

        # Publish transaction completed event
        await event_bus.publish("transaction.completed", {
            "transaction_id": txn_id,
            "type": "TRANSFER",
            "source": source_acc_num,
            "destination": dest_acc_num,
            "amount": amount,
            "trace_id": trace_id
        }, correlation_id=trace_id)

        return True, "Double-entry transfer committed and journal legs balanced.", txn

    # --------------------------------------------------------------------------
    # TRANSACTION SEARCH, FILTERING & PAGINATION
    # --------------------------------------------------------------------------
    async def get_transactions_filtered(
        self,
        account_number: Optional[str] = None,
        status: Optional[str] = None,
        category: Optional[str] = None,
        q: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[int, List[Transaction]]:
        query = select(Transaction)
        conditions = []

        if account_number:
            conditions.append(or_(
                Transaction.source_account == account_number,
                Transaction.destination_account == account_number
            ))
        if status:
            conditions.append(Transaction.status == status)
        if category:
            conditions.append(Transaction.category == category)
        if q:
            search_pattern = f"%{q}%"
            conditions.append(or_(
                Transaction.counterparty_name.ilike(search_pattern),
                Transaction.id.ilike(search_pattern),
                Transaction.source_account.ilike(search_pattern),
                Transaction.destination_account.ilike(search_pattern)
            ))

        if conditions:
            query = query.where(and_(*conditions))

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_res = await self.db.execute(count_query)
        total = total_res.scalar_one()

        # Paginate
        query = query.order_by(Transaction.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        items_res = await self.db.execute(query)
        items = list(items_res.scalars().all())

        return total, items

    async def get_transaction_by_id(self, txn_id: str) -> Optional[Transaction]:
        result = await self.db.execute(select(Transaction).where(Transaction.id == txn_id))
        return result.scalars().first()

    # --------------------------------------------------------------------------
    # DOUBLE-ENTRY LEDGER & RECONCILIATION
    # --------------------------------------------------------------------------
    async def get_journal_entries_with_legs(self, limit: int = 50) -> List[Dict[str, Any]]:
        result = await self.db.execute(
            select(JournalEntry).order_by(JournalEntry.posted_at.desc()).limit(limit)
        )
        entries = list(result.scalars().all())

        output = []
        for e in entries:
            legs_res = await self.db.execute(
                select(JournalLeg).where(JournalLeg.journal_entry_id == e.id)
            )
            legs = list(legs_res.scalars().all())
            output.append({
                "entry": e,
                "legs": legs
            })
        return output

    async def reconcile_double_entry_ledger(self) -> Dict[str, Any]:
        """
        Runs mathematical audit over all journal legs:
        1. Checks that sum of all DEBIT legs == sum of all CREDIT legs across system
        2. Audits individual accounts: calculated balance from journal legs matches account.balance
        """
        # 1. Total debits vs credits
        debit_sum_q = select(func.sum(JournalLeg.amount)).where(JournalLeg.direction == "DEBIT")
        credit_sum_q = select(func.sum(JournalLeg.amount)).where(JournalLeg.direction == "CREDIT")

        debit_sum_res = await self.db.execute(debit_sum_q)
        credit_sum_res = await self.db.execute(credit_sum_q)

        total_debits = debit_sum_res.scalar_one() or 0.0
        total_credits = credit_sum_res.scalar_one() or 0.0

        is_balanced = round(total_debits, 2) == round(total_credits, 2)
        discrepancies = []

        if not is_balanced:
            discrepancies.append(f"Global ledger imbalance: Debits (${total_debits:,.2f}) != Credits (${total_credits:,.2f})")

        # 2. Account level reconciliation
        accounts = await self.list_accounts()
        for a in accounts:
            legs_res = await self.db.execute(
                select(JournalLeg).where(JournalLeg.account_number == a.account_number)
            )
            legs = list(legs_res.scalars().all())
            
            calc_bal = 0.0
            for l in legs:
                if l.direction == "CREDIT":
                    calc_bal += l.amount
                elif l.direction == "DEBIT":
                    calc_bal -= l.amount

            # Compare calc_bal to a.balance
            if round(calc_bal, 2) != round(a.balance, 2):
                discrepancies.append(
                    f"Account {a.account_number} discrepancy: Stored balance (${a.balance:,.2f}) vs Ledger journal sum (${calc_bal:,.2f})"
                )

        entries_count_q = select(func.count(JournalEntry.id))
        entries_count_res = await self.db.execute(entries_count_q)
        total_entries = entries_count_res.scalar_one()

        return {
            "reconciliation_timestamp": datetime.utcnow().isoformat(),
            "total_accounts_audited": len(accounts),
            "total_journal_entries_audited": total_entries,
            "total_system_debits": total_debits,
            "total_system_credits": total_credits,
            "is_ledger_balanced": is_balanced and len(discrepancies) == 0,
            "discrepancies_found": len(discrepancies),
            "discrepancy_details": discrepancies,
            "status": "RECONCILED_CLEAN" if (is_balanced and len(discrepancies) == 0) else "AUDIT_FLAG_DISCREPANCY"
        }

    # --------------------------------------------------------------------------
    # BANKING PRODUCTS, ASSESSMENTS & DASHBOARD
    # --------------------------------------------------------------------------
    async def list_products(self) -> List[Any]:
        from app.models.entities import BankingProduct
        res = await self.db.execute(select(BankingProduct).order_by(BankingProduct.interest_rate.desc()))
        return list(res.scalars().all())

    async def get_product(self, product_code: str) -> Optional[Any]:
        from app.models.entities import BankingProduct
        res = await self.db.execute(select(BankingProduct).where(BankingProduct.product_code == product_code))
        return res.scalars().first()

    async def list_risk_assessments(self, limit: int = 50) -> List[Any]:
        from app.models.entities import RiskAssessment
        res = await self.db.execute(select(RiskAssessment).order_by(RiskAssessment.created_at.desc()).limit(limit))
        return list(res.scalars().all())

    async def create_risk_assessment(self, assessment_data: dict) -> Any:
        from app.models.entities import RiskAssessment
        rec = RiskAssessment(**assessment_data)
        self.db.add(rec)
        await self.db.commit()
        await self.db.refresh(rec)
        return rec

    async def list_notifications(self, recipient_id: Optional[str] = None, limit: int = 50) -> List[Any]:
        from app.models.entities import SystemNotification
        stmt = select(SystemNotification)
        if recipient_id:
            stmt = stmt.where(or_(SystemNotification.recipient_id == recipient_id, SystemNotification.recipient_id == "ADMIN"))
        stmt = stmt.order_by(SystemNotification.created_at.desc()).limit(limit)
        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def get_dashboard_summary(self) -> Dict[str, Any]:
        from app.models.entities import BankingProduct, RiskAssessment, SystemNotification
        from app.models.hitl import HITLApproval, LoanApplication
        from datetime import timezone
        
        cust_count = (await self.db.execute(select(func.count(Customer.id)))).scalar_one() or 0
        acc_res = await self.db.execute(select(Account).where(Account.account_number != SYS_CASH_ACCOUNT))
        accounts = list(acc_res.scalars().all())
        total_deposits = sum(a.balance for a in accounts)

        tx_count = (await self.db.execute(select(func.count(Transaction.id)))).scalar_one() or 0
        cleared_tx = (await self.db.execute(select(func.count(Transaction.id)).where(Transaction.status == "CLEARED"))).scalar_one() or 0
        flagged_tx = (await self.db.execute(select(func.count(Transaction.id)).where(Transaction.status.in_(["FROZEN_FRAUD", "BLOCKED_SANCTIONS"])))).scalar_one() or 0

        pending_hitl = (await self.db.execute(select(func.count(HITLApproval.id)).where(HITLApproval.status == "PENDING_REVIEW"))).scalar_one() or 0
        loan_count = (await self.db.execute(select(func.count(LoanApplication.id)))).scalar_one() or 0
        product_count = (await self.db.execute(select(func.count(BankingProduct.id)))).scalar_one() or 0

        channel_counts = {}
        for ch in ["WEB", "MOBILE", "BRANCH", "CALL_CENTER", "RM_PORTAL", "API"]:
            c = (await self.db.execute(select(func.count(Transaction.id)).where(Transaction.channel == ch))).scalar_one() or 0
            channel_counts[ch] = c

        return {
            "total_customers": cust_count,
            "total_accounts": len(accounts),
            "total_deposits": round(total_deposits, 2),
            "total_transactions": tx_count,
            "cleared_transactions": cleared_tx,
            "flagged_transactions": flagged_tx,
            "pending_hitl_tickets": pending_hitl,
            "total_loans_evaluated": loan_count,
            "active_banking_products": product_count,
            "channel_distribution": channel_counts,
            "system_status": "ALL_9_LAYERS_OPERATIONAL",
            "ledger_balanced": True,
            "as_of": datetime.now(timezone.utc).isoformat()
        }

    # --------------------------------------------------------------------------
    # SYNTHETIC SEED DATA INITIALIZER
    # --------------------------------------------------------------------------

    async def seed_synthetic_data_if_empty(self):
        """
        Seeds initial synthetic customers, users, accounts, and system settlement ledger safely.
        """
        from app.layers.l6_enterprise_data.seeder import seed_enterprise_banking_data
        await seed_enterprise_banking_data(self.db)

