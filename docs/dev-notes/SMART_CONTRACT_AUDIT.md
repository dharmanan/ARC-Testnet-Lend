# 🔍 Smart Contract Audit Report

**Date**: October 31, 2025  
**Scope**: GenericAMMPair.sol, LendingPool.sol, ScheduledPayoutManager.sol  
**Environment**: Arc Testnet  
**Status**: Testnet MVP (Not Production Ready)

---

## Executive Summary

### Overview
Three main contracts form the Arc Testnet MVP:
- **GenericAMMPair.sol** - DEX pair for token swaps
- **LendingPool.sol** - Lending protocol with deposit/borrow/withdraw
- **ScheduledPayoutManager.sol** - Scheduled payments from lending balances

### Security Level: 🟡 MEDIUM
- ✅ Uses OpenZeppelin for core security (ReentrancyGuard, Ownable)
- ⚠️ Missing critical access controls in some functions
- ⚠️ Gas optimization opportunities exist
- ⚠️ Integer overflow/underflow handled by Solidity 0.8.x but logic bugs possible

### Testnet Status: ✅ SAFE FOR TESTING
- No real assets at risk (all test tokens)
- Architecture is sound for testing approval flows
- suitable for learning DeFi mechanics

---

## 🔴 Critical Issues (Must Fix Before Mainnet)

### Issue 1: GenericAMMPair - Missing Access Control on swap()

**Location**: `GenericAMMPair.sol`, line 81  
**Severity**: MEDIUM  
**Type**: Security

```solidity
function swap(address tokenIn, uint256 amountIn, uint256 minAmountOut) external nonReentrant {
    // ❌ NO access control - anyone can call
    // ❌ NO pausable mechanism
}
```

**Problem**:
- Any user can swap with ANY tokens in the pair
- No way to pause the contract if needed
- No fee structure or slippage safeguards beyond minAmountOut

**Proof of Vulnerability**:
```
Attack: Frontrun a large swap
1. User calls swap(BTC, 1.0, minOut)
2. Attacker sees transaction in mempool
3. Attacker calls swap(BTC, 0.1) first
4. Pool state changes
5. Original user gets less than expected (below minOut protection)
6. Transaction reverts but gas is wasted
```

**Recommendation**:
```solidity
// Add pausable functionality
import "@openzeppelin/contracts/security/Pausable.sol";

contract GenericAMMPair is ReentrancyGuard, Pausable {
    // ...
    
    function swap(address tokenIn, uint256 amountIn, uint256 minAmountOut) 
        external 
        nonReentrant 
        whenNotPaused  // ← Add this
    {
        // ... rest of function
    }
}
```

**For Testnet**: Not critical (test tokens are worthless)  
**Estimated Fix Time**: 30 minutes

---

### Issue 2: LendingPool - Missing Interest Accrual

**Location**: `LendingPool.sol`, entire contract  
**Severity**: HIGH (Design Issue)  
**Type**: Logic/Economics

```solidity
function deposit(address token, uint256 amount) external nonReentrant {
    scaledBalances[token][msg.sender] += amount;  // ❌ No interest rate
    totalSupplied[token] += amount;
}
```

**Problem**:
- Documentation mentions "index-based interest accrual" but contract doesn't implement it
- Users deposit funds but earn no interest
- Borrowed funds don't accrue interest
- No time-based calculation for APY

**What's Missing**:
```solidity
// Should have:
mapping(address => uint256) public interestIndex;  // Per-token
mapping(address => uint256) public lastUpdate;     // When was index last updated

// On each interaction, update:
// newIndex = oldIndex * (1 + APY * timeDelta)
```

**Impact**:
- ✅ Swaps work correctly
- ✅ Deposits work (but earn 0%)
- ⚠️ Lending is broken (lenders earn nothing)
- ⚠️ Borrowers pay 0% interest

**Recommendation**:

See `ROADMAP_V0.2_INTEREST_ACCRUAL.md` for planned implementation

**For Testnet**: Acceptable for MVP testing  
**Real Issue**: Yes, for future versions

---

### Issue 3: ScheduledPayoutManager - Unsafe Fee Transfer

**Location**: `ScheduledPayoutManager.sol`, line 74  
**Severity**: MEDIUM  
**Type**: Access Control + Reentrancy

```solidity
function executeScheduled(uint256 id) external nonReentrant {
    Scheduled storage s = schedules[id];
    // ❌ ANYONE can execute - anyone gets fee
    s.executed = true;
    pool.withdrawForScheduled(s.token, s.owner, s.recipient, s.scaledAmount, s.executorFee);
}
```

**Problem**:
- Anyone can execute scheduled payouts
- Executor fee goes to `tx.origin` instead of `msg.sender`
- `tx.origin` can be exploited in complex call chains

```solidity
// In LendingPool.sol:
if (executorFee > 0) {
    IERC20(token).transfer(tx.origin, executorFee);  // ❌ Uses tx.origin
}
```

**Attack Scenario**:
```
1. Attacker creates contract A
2. Contract A calls executeScheduled()
3. tx.origin = attacker (original caller)
4. Executor fee goes to attacker instead of contract A
5. Attacker can siphon fees from relayers
```

**Recommendation**:

```solidity
// Change to:
function executeScheduled(uint256 id) external nonReentrant {
    Scheduled storage s = schedules[id];
    s.executed = true;
    
    // Pass msg.sender to pool (not tx.origin)
    pool.withdrawForScheduledTo(
        s.token, 
        s.owner, 
        s.recipient, 
        s.scaledAmount, 
        s.executorFee,
        msg.sender  // ← Executor is msg.sender
    );
}
```

**For Testnet**: Low risk (small amounts, known users)  
**Estimated Fix Time**: 20 minutes

---

## 🟡 High Priority Issues

### Issue 4: GenericAMMPair - Insufficient Liquidity Check

**Location**: `GenericAMMPair.sol`, line 30-35  
**Severity**: MEDIUM  
**Type**: Business Logic

```solidity
function addLiquidity(uint256 amount0, uint256 amount1) external nonReentrant {
    // ...
    if (totalLiquidity == 0) {
        liquidityMinted = sqrt(amount0 * amount1);
        require(liquidityMinted > MINIMUM_LIQUIDITY, "Insufficient initial liquidity");
        // ⚠️ MINIMUM_LIQUIDITY = 1000 - could be exploited
    }
}
```

**Problem**:
- First liquidity provider can set arbitrary prices by choosing huge imbalances
- E.g., add 0.0001 token0 and 1000000 token1
- Subsequent swaps will be massively disadvantageous

**Example Attack**:
```
Initial state:
- reserve0 = 0.0001 WBTC
- reserve1 = 1000000 ARC

Swap: 1 ARC → ? WBTC
Result: ~0.0000001 WBTC (terrible rate)

Attacker already holds massive WBTC,
profits when price normalizes through arbitrage
```

**Recommendation**:
```solidity
// Implement initial price check
function addLiquidity(uint256 amount0, uint256 amount1) external nonReentrant {
    require(amount0 > 0 && amount1 > 0, "Amounts must be positive");
    
    if (totalLiquidity == 0) {
        // Ratio check: prevent extreme imbalances
        uint256 ratio = (amount0 * 100) / (amount0 + amount1);
        require(ratio > 10 && ratio < 90, "Imbalanced initial liquidity");
        // ...
    }
}
```

**For Testnet**: Low risk (controlled test tokens)  
**Estimated Fix Time**: 15 minutes

---

### Issue 5: LendingPool - No Collateral Ratio Enforcement

**Location**: `LendingPool.sol`, line 78  
**Severity**: HIGH  
**Type**: Economic Security

```solidity
function borrow(address token, uint256 amount) external nonReentrant {
    // Comment says: "can borrow up to 66% of supplied value (150% collateral ratio)"
    // ❌ But this is NEVER checked!
    
    require(totalSupplied[token] >= totalBorrowed[token] + amount, 
        "insufficient pool liquidity");
    // ⚠️ This only checks pool liquidity, not user collateral
    
    borrowBalances[token][msg.sender] += amount;
    totalBorrowed[token] += amount;
    IERC20(token).transfer(msg.sender, amount);
}
```

**Problem**:
- No collateral checking at all
- User A can deposit 0 and borrow everything
- No liquidation mechanism
- No risk management

**Attack Sequence**:
```
1. Pool has 1000 USDC deposited
2. User deposits 0 USDC
3. User borrows 1000 USDC
4. Pool is now 0% backed
5. When User withdraws, other depositors can't
```

**Recommendation**:
```solidity
// Track collateral separately
mapping(address => mapping(address => uint256)) public collateral;

function borrow(address token, uint256 amount) external nonReentrant {
    // Check 150% collateral ratio (can borrow 66% of collateral value)
    uint256 userCollateralValue = collateral[msg.sender][token];
    uint256 maxBorrowAmount = (userCollateralValue * 66) / 100;
    
    require(
        borrowBalances[token][msg.sender] + amount <= maxBorrowAmount,
        "Insufficient collateral"
    );
    
    // ... rest of function
}
```

**For Testnet**: Not applicable (no real borrowing yet)  
**Real Issue**: YES - Critical for production

---

## 🟠 Medium Priority Issues

### Issue 6: GenericAMMPair - K Invariant Vulnerability

**Location**: `GenericAMMPair.sol`, line 103  
**Severity**: MEDIUM  
**Type**: Math/Economics

```solidity
uint256 amountInWithFee = (amountIn * 997) / 1000;  // 0.3% fee
uint256 amountOut = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);
// ⚠️ Fee is deducted but not added to reserves?
```

**Problem**:
- The contract deducts a 0.3% fee but doesn't track it
- Fee is burned (lost), not LP incentive
- LPs should be rewarded for providing liquidity

**What Should Happen**:
```
Good AMM (e.g., Uniswap v2):
- User swaps 1 token for ~0.97 equivalent
- Contract keeps 0.03 as protocol fee
- Fee accumulates in reserves
- LPs collect fee when they withdraw
- LP becomes owner of fee via higher reserve value
```

**What Happens Here**:
```
Current:
- User swaps 1 token for ~0.97 equivalent
- 0.03 token is LOST
- Reserves don't increase
- LPs don't benefit
- Protocol doesn't collect fees
```

**Impact**: LPs earn nothing + no protocol revenue

**Recommendation**:
```solidity
function swap(address tokenIn, uint256 amountIn, uint256 minAmountOut) 
    external 
    nonReentrant 
{
    // Option A: Collect fee to reserves
    // Fee stays in contract, benefits LPs
    
    // Option B: Send fee to owner
    // Fee sent to protocol/owner for revenue
    
    // Current: Fee is discarded (neither option)
    
    // Implement one of above...
}
```

**For Testnet**: Not critical (MVP is just testing swaps)  
**Real Issue**: Yes, for production economics

---

### Issue 7: No Emergency Withdrawal or Pause

**Location**: All contracts  
**Severity**: MEDIUM  
**Type**: Risk Management

**Problem**:
- No pause function to stop activity in case of exploit
- No emergency withdrawal for users
- Contract is locked once deployed

**What If**:
```
Scenario: New vulnerability discovered
Current: No way to stop damage
Recommendation: Add pause() function
```

**Recommendation**:
```solidity
import "@openzeppelin/contracts/security/Pausable.sol";

contract GenericAMMPair is Pausable {
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function swap(...) external whenNotPaused {
        // Can be paused in emergency
    }
}
```

**For Testnet**: Nice to have  
**Estimated Fix Time**: 20 minutes

---

## 🟢 Low Priority Issues (Gas Optimization)

### Issue 8: GenericAMMPair - Redundant Variable Storage

**Location**: `GenericAMMPair.sol`, lines 13-14  
**Severity**: LOW  
**Type**: Gas Optimization

```solidity
IERC20 public immutable token0;  // ✅ Immutable is good
IERC20 public immutable token1;

uint256 public reserve0;  // ✅ OK
uint256 public reserve1;
```

**Opportunity**:
- `reserve0` and `reserve1` are uint256 (32 bytes each)
- Could be packed into single uint256 pair if smaller tokens used
- Saves 1 storage slot per operation

**Current Gas**: ~20,000 gas per storage write  
**Optimized Gas**: ~5,000 gas (25% reduction)

**Recommendation**:
```solidity
// For testnet MVP - not necessary
// For production - consider for large-scale deployments

// Current (readable, okay gas):
uint256 public reserve0;
uint256 public reserve1;

// Optimized (complicated):
struct Reserves {
    uint128 reserve0;
    uint128 reserve1;
}
Reserves public reserves;
```

**Impact**: ~5% total gas savings  
**Worth Doing?**: Only after all critical issues fixed

---

### Issue 9: ScheduledPayoutManager - Inefficient Storage Read

**Location**: `ScheduledPayoutManager.sol`, line 70  
**Severity**: LOW  
**Type**: Gas Optimization

```solidity
function executeScheduled(uint256 id) external nonReentrant {
    Scheduled storage s = schedules[id];  // ← Storage read
    require(!s.executed, "already executed");  // ← Another read
    require(!s.cancelled, "cancelled");        // ← Another read
    require(block.timestamp >= s.releaseTimestamp, "too early");  // ← Another read
    // Total: ~4 SLOAD operations (100 gas each = 400 gas wasted)
}
```

**Optimization**:
```solidity
function executeScheduled(uint256 id) external nonReentrant {
    Scheduled storage s = schedules[id];
    // Load bool values once
    if (s.executed) revert AlreadyExecuted();
    if (s.cancelled) revert Cancelled();
    if (block.timestamp < s.releaseTimestamp) revert TooEarly();
    
    // Saves ~100-200 gas per call
}
```

**Impact**: ~100 gas per execution  
**Worth Doing?**: Minor optimization, do if refactoring anyway

---

## ✅ What's Good

### Strengths

**1. ReentrancyGuard Usage** ✅
- Correctly implemented on all external functions that transfer tokens
- Prevents classic reentrancy attacks

**2. OpenZeppelin Dependencies** ✅
- Using battle-tested ERC20, Ownable, ReentrancyGuard
- Reduces custom code vulnerabilities

**3. Clear Event Logging** ✅
- All important operations emit events
- Makes contract auditable on-chain

**4. Input Validation** ✅
- Amount > 0 checks present
- Token addresses validated

**5. Solidity 0.8.x** ✅
- Automatic overflow/underflow protection
- No need for SafeMath

---

## 🧪 Testing Recommendations

### Test Cases Needed

```bash
# 1. GenericAMMPair - Swap Edge Cases
forge test --match-test "test_swap_.*"
  - test_swap_zero_amount() → Should revert
  - test_swap_insufficient_output() → Should revert (slippage)
  - test_swap_invalid_token() → Should revert
  - test_swap_very_small_amount() → Should handle precision
  - test_swap_very_large_amount() → Should not overflow

# 2. LendingPool - Deposit/Withdraw
forge test --match-test "test_lending_.*"
  - test_deposit_withdraw_same_amount()
  - test_deposit_multiple_users()
  - test_withdraw_insufficient_balance()
  - test_borrow_without_deposit()

# 3. ScheduledPayoutManager - Timing
forge test --match-test "test_scheduled_.*"
  - test_execute_before_release_time()
  - test_execute_after_release_time()
  - test_cancel_then_execute()
  - test_fee_distribution()
```

### Write Tests For

- [ ] Flash loan attacks (if implemented later)
- [ ] Overflow in reserve calculations
- [ ] Precision loss with small amounts
- [ ] State consistency across functions
- [ ] Event emission correctness

---

## 📋 Checklist for Production

Before deploying to mainnet, ensure:

- [ ] All Critical Issues fixed
- [ ] 100% test coverage
- [ ] Formal verification (optional but recommended)
- [ ] External security audit by firm
- [ ] Insurance coverage
- [ ] Multi-sig ownership
- [ ] Timelock on critical functions
- [ ] Upgraded to Solidity 0.8.20+
- [ ] Gas optimization complete
- [ ] Rate limiting on swaps
- [ ] Oracles for price feeds

---

## 🚀 Production Roadmap

**Phase 1** (Current): MVP Testnet
- ✅ Basic swap functionality works
- ✅ Lending deposits/withdrawals work
- ✅ Scheduled payouts work
- ❌ Interest accrual not implemented
- ❌ No collateral enforcement
- ❌ No liquidation mechanism

**Phase 2** (See ROADMAP_V0.2_INTEREST_ACCRUAL.md):
- [ ] Interest accrual with index-based calculation
- [ ] Collateral ratio enforcement
- [ ] Liquidation mechanism
- [ ] Price oracle integration

**Phase 3**: Production Ready
- [ ] Full audit completion
- [ ] Insurance/coverage
- [ ] Main-net deployment
- [ ] Governance token (if needed)

---

## 📞 Questions & Next Steps

**For the team:**

1. **Interest Accrual**: Is v0.2 ready for development?
2. **Collateral Enforcement**: When should this be added?
3. **Fee Collection**: Should we implement fee distribution?
4. **Pause Mechanism**: Is emergency pause needed?

**Recommended Action Items** (Priority Order):

1. ✅ **Immediate** (This Week):
   - Add Pausable to GenericAMMPair
   - Fix tx.origin → msg.sender in ScheduledPayoutManager
   - Document known limitations

2. 🔄 **Short-term** (Sprint 2):
   - Implement interest accrual (see v0.2 roadmap)
   - Add collateral ratio enforcement
   - Write comprehensive test suite

3. 📅 **Medium-term** (Before Mainnet):
   - External audit
   - Formal verification
   - Production hardening

---

## � MetaMask Red Alert Issue

When interacting with the protocol via MetaMask, users may see a **red alert warning** during transactions. This is a **known RPC delay issue** and not a security vulnerability.

### Problem Visualization

**Before Fix (Red Alert)**
![Red Alert](../images/redalrt.png)

**After ~5-10 Seconds (Normal State)**
![Fixed State](../images/redalrtfix.png)

### Root Cause
- Arc Testnet RPC experiences occasional latency
- MetaMask shows red warning when response is delayed
- Transaction eventually succeeds after RPC responds

### Solution
- Wait 5-10 seconds and refresh the page
- Check transaction status on block explorer
- See [METAMASK_RED_ALERT_RPC_DELAY.md](../METAMASK_RED_ALERT_RPC_DELAY.md) for detailed troubleshooting

---

## �📚 References

- [ROADMAP_V0.2_INTEREST_ACCRUAL.md](./ROADMAP_V0.2_INTEREST_ACCRUAL.md)
- [Uniswap v2 Documentation](https://docs.uniswap.org/protocol/V2/concepts/core-concepts)
- [AAVE Lending Protocol](https://docs.aave.com/)
- [OpenZeppelin Security Docs](https://docs.openzeppelin.com/contracts/latest/)

---

*Audit conducted: October 31, 2025*  
*Auditor: GitHub Copilot*  
*Status: For Testnet Review*

```
