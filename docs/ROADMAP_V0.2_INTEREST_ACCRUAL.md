# 🗺️ Feature Roadmap & Implementation Plan

## Current Status: MVP v0.1

### ✅ What Works (v0.1 - Current)

**Lending Features:**
- ✅ Deposit tokens to pool
- ✅ Withdraw deposits
- ✅ Borrow against collateral
- ✅ Repay loans
- ✅ Health factor tracking
- ✅ Collateral management

**Swap Features:**
- ✅ Any token to any token swapping
- ✅ Real on-chain price calculation
- ✅ 3 swap pairs with liquidity (ETH/WBTC, ETH/ARC, WBTC/ARC)

**Dashboard:**
- ✅ Net worth calculation
- ✅ Health factor visualization
- ✅ Collateral tracking
- ✅ Available to borrow calculation
- ✅ Daily earnings estimation (projected, not real)

**Tokens Supported:**
- ✅ USDC (6 decimals)
- ✅ EURC (6 decimals)
- ✅ ETH (18 decimals)
- ✅ WBTC (8 decimals)
- ✅ ARC (18 decimals)

---

## ❌ What's Missing (Planned for v0.2)

### Interest Accrual System
```
PROBLEM: Daily earnings shown but not actually earned
SOLUTION: Implement on-chain interest accrual
TIMELINE: 2-3 weeks
EFFORT: High (contract upgrade + audit)
```

**Needs:**
1. Block timestamp tracking per user
2. APY configuration per token
3. Interest calculation: `interest = principal × APY × time / (365 * 100)`
4. Claim functionality
5. Update frontend to show real claimable amounts

### Claim Interest Feature
```
PROBLEM: Users can't claim their earned interest
SOLUTION: Add claimInterest() function to LendingPool
TIMELINE: 2-3 weeks
EFFORT: Medium
```

**Components:**
1. Smart Contract: `claimInterest(token)` function
2. Frontend: "Claim" button in dashboard
3. Transaction tracking: Show claim history
4. Real-time updates: Poll for claimable amounts

---

## 🔄 Detailed Implementation Plan (v0.2)

### Phase 1: Smart Contract (Week 1)

**1.1 Add Interest Tracking State**
```solidity
// Contract state additions
mapping(address => uint256) public tokenAPY;  // token => APY%
mapping(address => mapping(address => uint256)) public lastInterestTime;
mapping(address => mapping(address => uint256)) public accruedInterest;
```

**1.2 Implement Interest Accrual**
```solidity
function accrueInterest(address token, address user) internal {
    uint256 timePassed = block.timestamp - lastInterestTime[token][user];
    if (timePassed == 0) return;
    
    uint256 principal = scaledBalances[token][user];
    uint256 apy = tokenAPY[token];
    
    // Simple interest: P * r * t
    // For compound: need more complex math
    uint256 interest = (principal * apy * timePassed) / (365 days * 100);
    
    accruedInterest[token][user] += interest;
    lastInterestTime[token][user] = block.timestamp;
}
```

**1.3 Add Claim Function**
```solidity
function claimInterest(address token) external nonReentrant {
    accrueInterest(token, msg.sender);
    
    uint256 interest = accruedInterest[token][msg.sender];
    require(interest > 0, "No interest to claim");
    
    accruedInterest[token][msg.sender] = 0;
    IERC20(token).transfer(msg.sender, interest);
    
    emit InterestClaimed(token, msg.sender, interest);
}
```

**1.4 Update Deposit/Withdraw**
```solidity
// All functions should call accrueInterest before modifying balance
function deposit(address token, uint256 amount) external {
    accrueInterest(token, msg.sender);  // NEW
    // ... rest of function
}

function withdraw(address token, uint256 amount) external {
    accrueInterest(token, msg.sender);  // NEW
    // ... rest of function
}
```

**1.5 Testing**
- Unit tests for interest calculation
- Integration tests: deposit → wait → claim
- Edge cases: zero time, high APY, precision

---

### Phase 2: Backend Scripts (Week 1.5)

**2.1 Deployment Script**
```bash
# UpdateLendingPool.s.sol
- Deploy new LendingPool with interest support
- Set APY for each token (3%, 4%, 3.5%, 2%, 2.5%)
- Verify on ArcScan
```

**2.2 Migration Script**
```bash
# If upgrading existing pool:
- Snapshot all current deposits
- Deploy new pool
- Restore all deposits (preserve scaledBalances)
- Redirect contract address
```

---

### Phase 3: Frontend (Week 2)

**3.1 Add New Service Functions**
```typescript
// contractService.ts
export const claimInterest = async (tokenAddress: string): Promise<any> => {
  const { lendingPool } = getContracts();
  const tx = await lendingPool.claimInterest(tokenAddress);
  await tx.wait();
  return tx;
};

export const getClaimableInterest = async (tokenAddress: string, userAddress: string): Promise<string> => {
  const { lendingPool } = getContracts();
  const interest = await lendingPool.accruedInterest(tokenAddress, userAddress);
  const decimals = getTokenDecimals(tokenAddress);
  return ethers.formatUnits(interest, decimals);
};
```

**3.2 Update Dashboard Component**
```typescript
// Show real claimable amounts instead of projections
const claimableByToken = await Promise.all(
  userSupplies.map(s => getClaimableInterest(s.assetId, address))
);

const totalClaimable = claimableByToken.reduce((sum, amt) => sum + parseFloat(amt), 0);

// Add "Total Claimable" card to dashboard
// Add "Claim All" button
```

**3.3 New Components**
```typescript
// components/ClaimModal.tsx - Modal to claim interest
// components/ClaimHistory.tsx - Show claim history in Transactions

// Update History.tsx to show:
// - Interest claimed
// - Amount received
// - Timestamp
```

**3.4 Update InteractionModal.tsx**
```typescript
// Add new action: "Claim Interest"
// Show breakdown by token:
// - ETH: $X.XX claimable
// - USDC: $X.XX claimable
// - Total: $X.XX
```

---

## 🎯 Future Features (v0.3+)

### Compound Interest
```
TIMELINE: Week 3
IMPLEMENTATION:
- Automatically compound at fixed intervals
- Or manual compound option
- Formula: A = P(1 + r/n)^(nt)
```

### Reward Tokens
```
TIMELINE: Month 2
- Bonus tokens for early lenders
- Incentive program
- Governance token distribution
```

### Liquidation System
```
TIMELINE: Month 2
- Monitor health factor < 1.2
- Liquidator can trigger liquidation
- Collateral auctioned at discount
```

### Flash Loans
```
TIMELINE: Month 3
- Borrow without collateral
- Must repay in same transaction
- Fee: 0.03%
```

### Margin Trading
```
TIMELINE: Month 3+
- Leverage positions
- Advanced risk management
```

---

## 📊 Implementation Timeline

```
WEEK 1:    Smart Contract (Interest Accrual + Claim)
           └─ Testing & Audit
           
WEEK 2:    Frontend Implementation
           └─ Dashboard updates
           └─ Claim Modal
           └─ History tracking
           
WEEK 3:    Testing & QA
           └─ Integration testing
           └─ Testnet deployment
           └─ User testing
           
WEEK 4:    Launch v0.2 with Interest
           └─ Mainnet deployment (if needed)
           └─ Documentation
           └─ User guides
```

---

## 📋 Current Workaround

**Until v0.2 is ready (now - Week 2):**

✅ Dashboard shows disclaimer: "Daily earnings are estimated projections"
✅ No Claim button (prevents confusion)
✅ Users aware feature is coming
✅ No misleading information

---

## 🎓 Why This Matters

### User Expectations
- "I earn $10/day" → Users expect to withdraw $70/week
- Without claim: Users withdraw exact deposit (frustration)
- With claim: Users withdraw deposit + interest (satisfaction)

### Risk
- If not implemented soon: DeFi lending pool loses credibility
- Users think they're being scammed
- But actually: MVP just incomplete

### Solution
- Clear communication: "Coming soon"
- Regular updates on progress
- Early tester program for v0.2

---

## ✅ Checklist for v0.2

**Smart Contract**
- [ ] Interest state variables added
- [ ] accrueInterest() function implemented
- [ ] claimInterest() function implemented
- [ ] Deposit/withdraw updated with accrual
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Audit completed

**Frontend**
- [ ] getClaimableInterest() function
- [ ] claimInterest() function
- [ ] Dashboard: show real claimable amounts
- [ ] Dashboard: add "Total Claimable" card
- [ ] ClaimModal component
- [ ] Claim button implementation
- [ ] Transaction history tracking
- [ ] Error handling & edge cases
- [ ] Testing complete

**Testing**
- [ ] Testnet deployment
- [ ] User testing (10+ users)
- [ ] Performance testing
- [ ] Security review

**Documentation**
- [ ] Updated README
- [ ] Claim feature documentation
- [ ] User guide for claiming
- [ ] Video tutorial

---

## 🚀 How to Start

1. **Create new branch:**
   ```bash
   git checkout -b feature/interest-accrual
   ```

2. **Start with smart contract:**
   - Update LendingPool.sol
   - Add interest tracking
   - Add claim functionality

3. **Test thoroughly:**
   - Deploy to testnet
   - Run through scenarios

4. **Then frontend:**
   - Implement service functions
   - Update components
   - Test end-to-end

5. **Launch v0.2:**
   - Merge to main
   - Update production
   - Announce to users

---

*Last Updated: Oct 31, 2025*
*Status: v0.1 in production, v0.2 in planning*

