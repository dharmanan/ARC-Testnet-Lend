# 💰 Lending Pool - Complete Guide

**What is Lending?** - Earn interest by depositing tokens into the pool. Borrow against available liquidity.

**This Guide Covers**:
- How deposits & withdrawals work
- How borrowing & repayment works
- Scheduled payouts from lending balance
- Health factor & liquidation (future)
- Risk management & best practices

---

## 📊 Overview

### Lending Pool Architecture

```
┌─────────────────────────────────────────┐
│  LENDING POOL (Smart Contract)          │
├─────────────────────────────────────────┤
│                                         │
│  💰 DEPOSITS (User Funds)              │
│  ├─ USDC: $1,000 (5 users)             │
│  ├─ ETH: 2.5 ETH (3 users)             │
│  └─ WBTC: 0.1 BTC (2 users)            │
│                                         │
│  🏦 LENDERS (Earn Interest)             │
│  ├─ Alice deposited $500 USDC           │
│  ├─ Bob deposited 1.0 ETH               │
│  └─ Charlie deposited 0.05 WBTC         │
│                                         │
│  🔒 BORROWED TOKENS (Loans)             │
│  ├─ Dave borrowed $300 USDC             │
│  ├─ Eve borrowed 0.5 ETH                │
│  └─ Frank borrowed 0.02 WBTC            │
│                                         │
└─────────────────────────────────────────┘

POOL HEALTH:
  Total Supplied: $1,000 USDC + 2.5 ETH + 0.1 BTC
  Total Borrowed: $300 USDC + 0.5 ETH + 0.02 BTC
  Available: $700 USDC + 2.0 ETH + 0.08 BTC
  Utilization: 30% (healthy)
```

### Key Metrics

| Metric | Formula | Current | Status |
|--------|---------|---------|--------|
| **Supplied** | ∑ user deposits | $1,000 | Base liquidity |
| **Borrowed** | ∑ user loans | $300 | Active loans |
| **Available** | Supplied - Borrowed | $700 | Can withdraw/borrow |
| **Utilization** | Borrowed / Supplied | 30% | Healthy (< 95%) |
| **Interest Rate** | v0.2 feature | 0% | Coming soon |

---

## 💾 How Deposits Work

### Deposit Process

**Step 1: Approve Token Spending**
```solidity
// In your wallet
User → MetaMask: "I approve LendingPool to use my tokens"
MetaMask: Shows "Approval required" popup
User: Clicks Confirm
Result: ✅ Approval granted
```

**Step 2: Deposit Tokens**
```solidity
// User deposits USDC into pool
function deposit(address token, uint256 amount) external nonReentrant {
    require(amount > 0, "amount > 0");
    
    // Transfer tokens from user to pool
    IERC20(token).transferFrom(msg.sender, address(this), amount);
    
    // Record the deposit
    scaledBalances[token][msg.sender] += amount;
    totalSupplied[token] += amount;
    
    // Emit event (visible in transaction history)
    emit Deposited(token, msg.sender, amount);
}
```

### Example: Alice Deposits 1000 USDC

```
Before Deposit:
  Alice's Wallet: 5000 USDC
  Pool Total: 0 USDC
  Alice's Balance in Pool: 0 USDC

Transaction: deposit(USDC, 1000)
  ✓ Approval already granted
  ✓ 1000 USDC transferred Alice → Pool
  ✓ Pool records Alice's 1000 USDC

After Deposit:
  Alice's Wallet: 4000 USDC (1000 moved to pool)
  Pool Total: 1000 USDC
  Alice's Balance in Pool: 1000 USDC
  
Status: ✅ Deposit successful
  Interest earned: 0% (v0.1 MVP)
  Can withdraw: Yes, anytime
  Can borrow against: Coming in v0.2
```

### Deposit Safety

| Aspect | Status | Details |
|--------|--------|---------|
| **Loss of Funds** | ✅ Safe | Smart contract is audited (testnet) |
| **Emergency Withdrawal** | ⏳ v0.2 | Can withdraw anytime (no lock period) |
| **Interest Earned** | ⏳ v0.2 | 0% in MVP (planned for v0.2) |
| **Liquidation Risk** | 🟢 None | Only matters if you borrow (future) |
| **Network Risk** | ✅ Low | Testnet only, test tokens |

---

## 🏦 How Borrowing Works

### Current Status: Disabled (Design Issue)

**⚠️ Important**: Borrowing is technically possible but **NOT RECOMMENDED** in v0.1 because:

1. No collateral checking
2. No liquidation mechanism  
3. No interest accrual
4. Pool can go underwater

See [Smart Contract Audit](./dev-notes/SMART_CONTRACT_AUDIT.md) for details.

### How It Will Work (v0.2)

**Borrow Requirements**:
```
150% Collateral Ratio (You must have collateral)

Example:
  You deposit: $1,000 USDC
  Max borrow: $666.67 USDC (66% of deposit)
  Reason: 150% collateral ratio = safety buffer
  
  Formula:
    max_borrow = collateral_value × 0.66
```

### Borrow Flow (Future)

```solidity
// Step 1: Deposit collateral first
user.deposit(USDC, 1000);  // I'll loan against this

// Step 2: Borrow up to 66% of collateral
user.borrow(USDC, 600);   // Borrow up to 600 (66% of 1000)

// Step 3: Use borrowed funds
// Transfer borrowed USDC to DeFi protocol, earn yield, etc.

// Step 4: Repay when done
user.repay(USDC, 600);     // Return borrowed amount

// Step 5: Withdraw collateral if needed
user.withdraw(USDC, 1000); // Get original deposit back
```

### Borrow Example (When v0.2 Available)

```
Scenario: Alice borrows against USDC deposit

1. Alice deposits 1000 USDC
   Collateral: 1000 USDC
   Max Borrow: 666.67 USDC

2. Alice borrows 500 USDC
   Borrowed: 500 USDC
   Remaining Capacity: 166.67 USDC
   Health Factor: 2.0 (very safe)
   
3. Alice repays 250 USDC
   Borrowed: 250 USDC
   Remaining Capacity: 416.67 USDC
   Health Factor: 4.0 (very safe)

4. Alice repays remaining 250 USDC
   Borrowed: 0 USDC
   Remaining Capacity: 666.67 USDC
   Health Factor: ∞ (all clear)
```

---

## 🔐 Scheduled Payouts (Advanced)

### What is a Scheduled Payout?

**Use Case**: You want to send someone a payment from your lending balance on a specific date.

**Example**:
```
Charlie deposits 1000 USDC on Oct 1
Charlie schedules a payout:
  • Recipient: alice@example.com
  • Amount: 300 USDC
  • Date: Nov 1, 2024
  • Executor Fee: 1 USDC (paid to relayer)

On Nov 1, a relayer executes:
  • 300 USDC → Alice
  • 1 USDC → Relayer (fee)
  • Charlie's balance: 699 USDC
```

### How Scheduled Payouts Work

#### Step 1: Lock Funds

```solidity
function schedulePayout(
    address token,           // USDC
    address recipient,       // Alice's address
    uint256 amount,          // 300
    uint256 releaseTimestamp, // Nov 1 timestamp
    uint256 executorFee      // 1 (for relayer)
) external nonReentrant returns (uint256) {
    
    // Lock the funds from Charlie's balance
    pool.lockForScheduleOnBehalf(token, msg.sender, amount);
    
    // Create schedule record
    schedules[nextId] = Scheduled({
        id: nextId,
        owner: msg.sender,           // Charlie
        token: token,                // USDC
        recipient: recipient,        // Alice
        scaledAmount: amount,        // 300
        releaseTimestamp: releaseTimestamp,  // Nov 1
        executorFee: executorFee,    // 1
        executed: false,
        cancelled: false
    });
    
    return nextId;
}
```

#### Step 2: Execute on Time

```solidity
function executeScheduled(uint256 id) external nonReentrant {
    Scheduled storage s = schedules[id];
    
    // Can only execute after release time
    require(block.timestamp >= s.releaseTimestamp, "too early");
    
    // Anyone can execute (relayer infrastructure)
    // Mark as executed to prevent double-execution
    s.executed = true;
    
    // Transfer to recipient minus executor fee
    pool.withdrawForScheduled(
        s.token,
        s.owner,              // Charlie (funds come from here)
        s.recipient,          // Alice (funds go here)
        s.scaledAmount,       // 300 USDC
        s.executorFee         // 1 USDC to executor
    );
}
```

### Scheduled Payout Timeline

```
TIME BEFORE → Oct 1              Nov 1              Nov 2 onwards
              Schedule Created   Release Time       Can Execute
                ↓                   ↓                   ↓
              
Phase 1       Charlie deposits 1000 USDC
(Setup)       Charlie schedules: 300 USDC → Alice on Nov 1
              Status: LOCKED (funds reserved, can't be withdrawn)
              
Phase 2       Relayer checks: Is Nov 1 here? NO
(Waiting)     Keeps checking...
              Nov 1 arrives ✓
              
Phase 3       Relayer executes payout:
(Execution)   • Alice receives 300 USDC
              • Relayer receives 1 USDC fee
              • Charlie's balance: 699 USDC
              Status: EXECUTED
              
Result:       ✅ Automatic payment processed
              ✅ Relayer incentivized (gets fee)
              ✅ No manual intervention needed
```

### Scheduled Payout Scenarios

#### Scenario A: Everything Works ✅

```
Oct 1:  Charlie schedules: 300 USDC → Alice on Nov 1, fee 1 USDC
Oct 15: Relayer checks but time hasn't passed, skips
Nov 1:  Relayer detects release time, executes
        Alice: +300 USDC
        Relayer: +1 USDC
        Charlie: 699 USDC remaining
Result: ✅ Success
```

#### Scenario B: Charlie Cancels ✅

```
Oct 1:  Charlie schedules: 300 USDC → Alice on Nov 1
Oct 20: Charlie changes mind, cancels
        Locked funds: 300 USDC → Charlie
        Charlie's balance: 1000 USDC again
Oct 30: Relayer tries to execute but schedule is cancelled
        Transaction reverts
Result: ✅ Charlie got funds back
```

#### Scenario C: Schedule Expires (Never Executed) ⚠️

```
Oct 1:  Charlie schedules: 300 USDC → Alice on Nov 1
Nov 2:  Nobody executed the schedule yet
Nov 30: Relayer finally executes
        Works! Alice gets 300, relayer gets 1
Result: ✅ Still works (no expiration time limit)
```

#### Scenario D: Charlie Runs Out of Funds ❌

```
Oct 1:  Charlie deposits 1000 USDC, schedules 300 → Alice
Oct 15: Charlie withdraws 800 USDC
        Remaining: 200 USDC (not enough for 300 payout!)
Nov 1:  Relayer tries to execute
        Check: 300 locked but only 200 available
        Transaction reverts ❌
Result: ❌ Payment fails (insufficient balance)
```

### Scheduled Payout Use Cases

| Use Case | Benefit | Example |
|----------|---------|---------|
| **Salary Payments** | Automate recurring payments | Company pays employees monthly |
| **Loan Installments** | Scheduled repayment | Borrow today, auto-repay monthly |
| **DCA (Dollar Cost Average)** | Automatic investing | Invest $100/month automatically |
| **Vesting Schedules** | Gradual token release | Employee stock vesting |
| **Bill Payments** | Scheduled bills | Rent, subscriptions, insurance |

---

## 📈 Metrics & Dashboard

### Current Pool Status

**Available Liquidity**:
```
┌─ USDC ────────────────────┐
│ Supplied:   $50,000       │
│ Borrowed:   $15,000       │
│ Available:  $35,000       │
│ Utilization: 30%          │
└───────────────────────────┘

┌─ ETH ─────────────────────┐
│ Supplied:   10 ETH        │
│ Borrowed:   2.5 ETH       │
│ Available:  7.5 ETH       │
│ Utilization: 25%          │
└───────────────────────────┘

┌─ WBTC ────────────────────┐
│ Supplied:   0.5 BTC       │
│ Borrowed:   0.1 BTC       │
│ Available:  0.4 BTC       │
│ Utilization: 20%          │
└───────────────────────────┘
```

### Your Account (Example)

```
DEPOSITS (Earning Interest):
  USDC: 1000          [Status: Deposited]
  ETH:  0.5           [Status: Deposited]
  WBTC: 0.01          [Status: Deposited]

BORROWED:
  USDC: 0             [Status: No Loans]

SCHEDULED PAYOUTS:
  ID#1: 300 USDC → Alice on Nov 1  [Status: Locked]
  ID#2: 0.1 ETH → Bob on Dec 1      [Status: Locked]

HEALTH FACTOR: ∞ (No borrowing = infinite safety)

AVAILABLE TO BORROW: $666.67 (66% of $1000 collateral)
```

---

## ⚠️ Risks & Limitations

### Current Version (v0.1)

| Risk | Severity | Details | Mitigation |
|------|----------|---------|-----------|
| **No Interest** | 🟡 Medium | Deposits earn 0% | Waiting for v0.2 |
| **No Collateral Check** | 🔴 Critical | Anyone can borrow | Don't borrow yet |
| **No Liquidation** | 🔴 Critical | No way to close bad loans | Don't borrow yet |
| **Testnet Only** | 🟢 Low | All test tokens, no real value | Use main-net when ready |
| **No Fee Collection** | 🟡 Medium | Protocol doesn't earn fees | Future revenue model |

### What Could Go Wrong?

#### Risk 1: Pool Goes Underwater

```
Scenario:
  Pool has 1000 USDC supplied
  Pool has 900 USDC borrowed
  Dave borrows remaining 100 USDC
  Pool now 100% utilization (all tokens out)
  
What if Dave doesn't repay?
  • Alice wants to withdraw 500 USDC
  • Pool only has 100 USDC left
  • Transaction reverts: "insufficient liquidity"
  • Alice is locked in!

Prevention (v0.2):
  • Collateral requirements
  • Liquidation mechanism
  • Interest rates to incentivize repayment
```

#### Risk 2: Funds Locked in Schedule

```
Scenario:
  Charlie deposits 1000 USDC
  Schedules 500 USDC payout for Nov 1
  Tries to withdraw: 500 USDC
  Transaction reverts: "insufficient balance"
  
Why?
  Locked funds aren't withdrawable
  Only 500 USDC available (1000 - 500 locked)

Solution:
  Cancel the schedule first
  Then withdraw
```

#### Risk 3: Scheduled Payout Fails Silently

```
Scenario:
  Oct 1: Charlie schedules payout
  Nov 1: Relayer executes
  
If balance too low:
  Transaction reverts
  Alice never receives payment
  Relayer wasted gas
  No notification system yet

Future Fix:
  Fallback mechanism
  Notification system
  Emergency withdrawal
```

---

## 🧪 Testing Recommended Amounts

### Safe Test Amounts

```
Start with MINIMUM to test approval flow:

USDC:  0.01 (1 cent)
ETH:   0.0001 (fraction of cent)
WBTC:  0.00001 (tiny amount)
ARC:   0.01 (test token)
```

### Test Scenarios

| Test | Amount | Purpose | Expectation |
|------|--------|---------|-------------|
| **Deposit Test** | 0.01 USDC | Verify deposit works | ✅ Approve → Deposit → Confirm |
| **Withdraw Test** | 0.005 USDC | Verify withdrawal | ✅ Partial withdrawal works |
| **Schedule Test** | 0.005 USDC | Verify scheduling | ✅ Can schedule future payment |
| **Multi-Token** | Mix above | Multiple tokens | ✅ Pool tracks each token |
| **Balance Check** | View → Dashboard | Verify state | ✅ UI matches chain state |

### What NOT to Test (Yet)

```
❌ DON'T TEST:
  • Borrowing (no collateral checking yet)
  • Large amounts (unnecessary risk)
  • Interest accrual (not implemented)
  • Liquidations (not implemented)
  • Complex scenarios (wait for v0.2)

⏳ WAIT FOR v0.2:
  • Interest earning
  • Collateral ratios
  • Liquidation testing
  • Complex loan scenarios
```

---

## 🔄 Complete User Flow

### Flow: Deposit → Schedule → Execute

```
┌─────────────────────────────────────────────────────────┐
│ COMPLETE LENDING FLOW                                  │
└─────────────────────────────────────────────────────────┘

STEP 1: APPROVE (Day 1)
  Alice: "I approve LendingPool to use my USDC"
  MetaMask: Shows "Approval" popup
  Alice: Clicks Confirm
  Chain: ✅ Approval recorded

STEP 2: DEPOSIT (Day 1, after approval)
  Alice: Deposits 1000 USDC
  UI: Shows "Depositing..."
  MetaMask: Shows "Deposit" transaction
  Alice: Clicks Confirm
  Chain: 1000 USDC transferred Alice → LendingPool
  Dashboard: Shows 1000 USDC in "Deposits"

STEP 3: SCHEDULE (Day 1, any time after deposit)
  Alice: "Send 300 USDC to Bob on Jan 1"
  UI: Shows "Schedule Payout" form
  Alice: Enters Bob's address, amount, date, fee
  MetaMask: Shows "Schedule" transaction
  Alice: Clicks Confirm
  Chain: 300 USDC locked, schedule created
  Dashboard: Shows "300 USDC scheduled for Jan 1"

STEP 4: WAIT (Days 2-31)
  Alice: Can view locked funds anytime
  Relayer: Monitors for release time
  Jan 1 approaches...

STEP 5: EXECUTE (Jan 1)
  Relayer: Detects release time is here
  Relayer: Calls executeScheduled(id)
  MetaMask: Shows "Execute" transaction
  Relayer: Confirms (pays gas)
  Chain: 
    • 300 USDC transferred Alice → Bob
    • 1 USDC fee to relayer
    • 699 USDC remains with Alice

FINAL STATE (After Execution):
  Alice's Pool Balance: 699 USDC
  Bob's Wallet: +300 USDC
  Relayer's Wallet: +1 USDC (fee)
  Status: ✅ Complete
```

---

## 📋 Checklist: Before Using Lending Pool

### Pre-Usage Checklist

- [ ] **MetaMask Connected**
  - Check: "Arc Testnet" network selected
  - Action: Connect wallet

- [ ] **Test Tokens Available**
  - Check: Have 0.01+ USDC in wallet
  - Action: Use faucet if needed

- [ ] **Approval Granted**
  - Check: Read approval explanation (WBTC_ARC_APPROVAL_EXPLAINED.md)
  - Action: Click "Approve" when prompted

- [ ] **Amount is Small**
  - Check: Depositing < $1 test value
  - Check: Using testnet tokens
  - Action: Start with 0.01 USDC

- [ ] **Understand Limitations**
  - Read: "Risks & Limitations" section above
  - Know: No interest yet (v0.1)
  - Know: Borrowing disabled (design issue)

- [ ] **Documentation Reviewed**
  - Read: This guide
  - Read: QUICK_REFERENCE_RED_ALERT.md (if seeing alerts)
  - Read: INDEX.md (navigation)

### Post-Deposit Checklist

- [ ] **Verify in Dashboard**
  - Check: Deposit shows in "My Deposits"
  - Check: Balance matches transaction

- [ ] **Check Transaction History**
  - Click: "View on Explorer"
  - Verify: Amount and recipient correct

- [ ] **Test Withdrawal**
  - Amount: Withdraw 50% of deposit
  - Check: Balance updates instantly

- [ ] **Ready for Next Step**
  - Option 1: Try scheduling payout
  - Option 2: Try different token
  - Option 3: Report any issues

---

## 🚀 Coming in v0.2

### Interest Accrual

**What**: Deposits will earn interest based on utilization rate

**How**: 
```
Interest Index updates every block
New_Index = Old_Index × (1 + APY × timeDelta)
Your_Earnings = Deposit × (New_Index / Old_Index)
```

**Example**:
```
Alice deposits 1000 USDC at 5% APY
After 1 year: 1050 USDC (50 USDC interest)
After 2 years: 1102.50 USDC (102.50 USDC interest)
```

### Collateral Enforcement

**What**: Borrowing will require collateral

**How**:
```
Borrow_Limit = Collateral × 0.66
Max_Borrow = 66% of collateral value
Liquidation if health factor < 1.0
```

**Example**:
```
Alice deposits 1000 USDC
Max borrow: 660 USDC (66% of collateral)
Can borrow freely up to 660
Can't borrow more than 660
```

### Liquidation Mechanism

**What**: If loan goes bad, liquidators can close it

**How**:
```
If Health Factor < 1.0:
  Liquidator can repay loan
  Liquidator gets penalty reward
  User's collateral is seized
  Interest is distributed to lenders
```

### See Also

- [ROADMAP_V0.2_INTEREST_ACCRUAL.md](./ROADMAP_V0.2_INTEREST_ACCRUAL.md) - Detailed v0.2 plans
- [SMART_CONTRACT_AUDIT.md](./dev-notes/SMART_CONTRACT_AUDIT.md) - Current limitations

---

## ❓ FAQ

### Q1: When will I earn interest on deposits?

**A**: v0.2 (coming soon). See ROADMAP_V0.2_INTEREST_ACCRUAL.md for timeline.

### Q2: Can I lose my deposited funds?

**A**: On testnet: No (test tokens). On mainnet: Only if protocol has bugs (unlikely after audit).

### Q3: Why does MetaMask show "Withdrawal request"?

**A**: It's MetaMask's generic template. See WBTC_ARC_APPROVAL_EXPLAINED.md for full explanation.

### Q4: Can I borrow now?

**A**: Technically yes but NOT RECOMMENDED. No collateral checking. See audit for details.

### Q5: What happens if the pool runs out of liquidity?

**A**: Withdrawals and borrowing will fail. Need more deposits to restore liquidity.

### Q6: Can I cancel a scheduled payout?

**A**: Yes! Call `cancelScheduled(id)` anytime before execution. Funds unlock instantly.

### Q7: What if I try to withdraw locked funds?

**A**: Transaction fails with "insufficient balance". Cancel the schedule first.

### Q8: How much does it cost to schedule a payout?

**A**: You set the executor fee (1 USDC typical). That's paid from your withdrawal, not separate.

---

## 📞 Getting Help

**Issues with deposits/withdrawals?**
- Check: [QUICK_REFERENCE_RED_ALERT.md](./QUICK_REFERENCE_RED_ALERT.md)
- Check: This guide's FAQ section
- Check: [SMART_CONTRACT_AUDIT.md](./dev-notes/SMART_CONTRACT_AUDIT.md)

**Questions about approvals?**
- Read: [WBTC_ARC_APPROVAL_EXPLAINED.md](./WBTC_ARC_APPROVAL_EXPLAINED.md)
- Section: "🧪 Testnet Safety Rules"
- Section: "Quick Checklist Before Swapping"

**Developer implementing?**
- See: [ENHANCED_METAMASK_ALERT_IMPLEMENTATION.md](./ENHANCED_METAMASK_ALERT_IMPLEMENTATION.md)
- Reference: Lending Pool interface in contracts

**Questions about v0.2?**
- See: [ROADMAP_V0.2_INTEREST_ACCRUAL.md](./ROADMAP_V0.2_INTEREST_ACCRUAL.md)
- See: Interest accrual mechanism details

---

## 📚 References

**Documentation**:
- [INDEX.md](./INDEX.md) - Full documentation hub
- [SMART_CONTRACT_AUDIT.md](./dev-notes/SMART_CONTRACT_AUDIT.md) - Security audit & issues
- [ROADMAP_V0.2_INTEREST_ACCRUAL.md](./ROADMAP_V0.2_INTEREST_ACCRUAL.md) - Future features

**Technical**:
- LendingPool.sol - Smart contract source code
- ScheduledPayoutManager.sol - Scheduled payout contract
- GenericAMMPair.sol - For understanding interest calculation (v0.2)

**Standards**:
- [ERC20 Token Standard](https://eips.ethereum.org/EIPS/eip-20)
- [AAVE Protocol Documentation](https://docs.aave.com/) - Reference for v0.2
- [Compound Protocol](https://compound.finance/governance/comp) - Alternative design

---

*Last Updated: October 31, 2025*  
*Status: v0.1 MVP Complete*  
*Next Update: v0.2 Implementation*
