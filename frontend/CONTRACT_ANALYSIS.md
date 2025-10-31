# Contract & Function Usage Report

## 📊 Arc Testnet Contracts Status

### ✅ ACTIVE CONTRACTS (All deployed)

| Contract | Address | Status | Usage |
|----------|---------|--------|-------|
| USDC (native) | 0x3600000000000000000000000000000000000000 | ✅ Active | Token for lending |
| EURC | 0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a | ✅ Active | Token for lending |
| ETH (Mock) | 0x6dC1d97820974558e1bD555C04a5A19608F9512d | ✅ Active | Token for lending & swapping |
| WBTC (Mock) | 0x27488Db1F8F9529B5820De984262179Ad913798E | ✅ Active | Token for lending & swapping |
| ARC (Mock) | 0x56EFFB3b22DBBE576E4327D196aa5ed51476924e | ✅ Active | Token for lending & swapping |
| tUSD (Old) | 0x78b8d44732a7e3601328B016d0bc0D30471685B7 | ✅ Active | **UNUSED - Old token** |
| LendingPool | 0x9dD7314B876fF9dFFB4F9aC4d4c8540156cf10b9 | ✅ Active | Core - Deposit/Borrow/Withdraw/Repay |
| ScheduledPayoutManager | 0x2A094018d03E9F8f6321e55513aA0EaC89DFdEEf | ✅ Active | **UNUSED - Payout scheduling** |
| GenericAMMPair ETH/WBTC | 0xF4638B258905C6a2F7Aa71E05aAC887dB697c338 | ✅ Active | Swap pair (with liquidity) |
| GenericAMMPair ETH/ARC | 0x677df5298Fd0a80672b1E6B4a61BEB75534a83A1 | ✅ Active | Swap pair (with liquidity) |
| GenericAMMPair WBTC/ARC | 0x27e14cfEF1a029A32F574263dce67371bce32d24 | ✅ Active | Swap pair (with liquidity) |

**Summary:** 11/11 contracts deployed. All bytecode verified on-chain.

---

## 📝 ContractService Functions Status

### ✅ ACTIVELY USED (14 functions)

| Function | Type | Usage | Notes |
|----------|------|-------|-------|
| connectWallet | Auth | App.tsx | Wallet connection |
| disconnectWallet | Auth | App.tsx | Wallet disconnect + cleanup |
| getTokenBalance | Read | App.tsx | Get user token balance |
| depositToPool | Write | App.tsx via InteractionModal | Deposit tokens to lending pool |
| withdrawFromPool | Write | App.tsx via InteractionModal | Withdraw tokens from pool |
| borrowFromPool | Write | App.tsx via InteractionModal | Borrow tokens from pool |
| repayToPool | Write | App.tsx via InteractionModal | Repay borrowed tokens |
| getPoolBalance | Read | App.tsx | Get user's deposited amount |
| getBorrowBalance | Read | App.tsx | Get user's borrowed amount |
| getTotalSupply | Read | App.tsx | Get token's total supply |
| getTotalBorrowed | Read | App.tsx | Get total borrowed estimate |
| getPoolTotalSupplied | Read | App.tsx | Get pool's total supplied |
| getPoolTotalBorrowed | Read | App.tsx | Get pool's total borrowed |
| swapTokens | Write | App.tsx via Swap.tsx | Execute token swaps |
| getSwapAmountOut | Read | App.tsx + Swap.tsx | Get swap output amount |

### ⚠️ IMPORTED BUT NOT USED (1 function)

| Function | Type | Reason | Notes |
|----------|------|--------|-------|
| schedulePayout | Write | Not implemented in UI | ScheduledPayoutManager feature |

### ❌ NOT IMPORTED/UNUSED (4 functions)

| Function | Type | Reason | Notes |
|----------|------|--------|-------|
| addLiquidity | Write | Manual only | Only used in setup scripts |
| removeLiquidity | Write | Manual only | Liquidity management not in UI |
| getPoolReserves | Read | Unused | Reserve data not displayed |
| getUserLiquidity | Read | Unused | LP tokens not tracked in UI |

### 🔧 Internal Helpers (Not exported but used internally)

| Function | Purpose |
|----------|---------|
| getTokenContract | Get token contract instance |
| getContracts | Get lending pool & AMM pair instances |
| getPairAddressForTokens | Select correct AMM pair for swap |
| getTokenDecimals | Get decimal places for token |

---

## 🎯 Recommendation for README

### Active Features to Document

**Core Lending:**
- ✅ Deposit USDC, EURC, ETH, WBTC, ARC
- ✅ Borrow USDC, EURC, ETH, WBTC, ARC
- ✅ Withdraw from deposits
- ✅ Repay borrowed tokens

**DEX/Swapping:**
- ✅ Swap ETH ↔ WBTC
- ✅ Swap ETH ↔ ARC
- ✅ Swap WBTC ↔ ARC
- ✅ Real liquidity in pools (50 ETH, 2.5 WBTC, 1500 ARC)

**Supported Tokens:**
- ✅ USDC (Arc Native, 6 decimals)
- ✅ EURC (6 decimals)
- ✅ ETH Mock (18 decimals)
- ✅ WBTC Mock (8 decimals)
- ✅ ARC Mock (18 decimals)

### Features NOT Ready for Users

- ❌ tUSD - Legacy token, not used
- ❌ Scheduled Payouts - Not implemented in UI
- ❌ Liquidity Management - Only for setup/scripts
- ❌ LP Token Management - Not tracked in UI

---

## 🧪 Test Results

### Test Strategy
Small amounts tested:
- USDC: 0.01
- EURC: 0.01
- ETH: 0.0001
- WBTC: 0.00001
- ARC: 0.01

### Functions to Test
- [ ] 1. getTokenBalance - all tokens
- [ ] 2. getPoolTotalSupplied - all tokens
- [ ] 3. getPoolTotalBorrowed - all tokens
- [ ] 4. depositToPool - all tokens
- [ ] 5. borrowFromPool - all tokens
- [ ] 6. repayToPool - all tokens
- [ ] 7. withdrawFromPool - all tokens
- [ ] 8. swapTokens - all pairs
- [ ] 9. getSwapAmountOut - all pairs

### Current Blockers
- MetaMask popup not auto-closing (minor UX issue)
- Need live wallet for testing

---

## 📋 Action Items

1. **For README:**
   - Document only actively used contracts
   - List supported tokens and decimals
   - Explain lending vs swapping features
   - Show supported swap pairs

2. **Code Cleanup (optional):**
   - Remove unused functions: `addLiquidity`, `removeLiquidity`, `getPoolReserves`, `getUserLiquidity`
   - Remove tUSD from ASSETS if it's not needed
   - Keep `schedulePayout` for future implementation

3. **Testing:**
   - Test all operations with small amounts
   - Verify all token decimal handling
   - Test swap calculations
   - Test health factor calculations

