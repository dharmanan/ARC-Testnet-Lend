# Unused Functions Explanation

## 1. `addLiquidity()` - Why is it not being used?

**What it does:**
- Adds liquidity to USDC and EURC swap pair
- Returns Liquidity token (LP token)

**Why it's not used:**
- No "Add Liquidity" feature in UI
- Users do not function as liquidity providers
- Liquidity was only added in **setup scripts** (AddLiquidity.s.sol)
- All swap pairs are pre-initialized with liquidity
- AMM protocol provides swap functionality, not LP UI

**Where it was used:**
- `/backend/script/AddLiquidity.s.sol` - Initial liquidity (50 ETH, 2.5 WBTC, 1500 ARC)

---

## 2. `removeLiquidity()` - Why is it not being used?

**What it does:**
- Burns LP tokens to withdraw liquidity
- Returns USDC/EURC

**Why it's not used:**
- No "Remove Liquidity" feature in UI
- Liquidity management is not currently supported
- Users are not liquidity providers (only borrowers/suppliers)
- Could be a future feature but not required now

**Potential Usage:**
- Admin emergency liquidity withdrawal
- Future version when LP UI is added

---

## 3. `getPoolReserves()` - Why is it not being used?

**What it does:**
- Returns USDC and EURC reserves (hard-coded for only these two tokens!)
- Does NOT get reserves for ETH, WBTC, ARC

**Why it's not used:**
1. **Hard-coded limits:** Only works for USDC/EURC
2. **Incomplete implementation:** No dynamic token support
3. **UI doesn't need it:** Reserves not displayed on dashboard
4. **Logic issue:** Uses `getSwapAmountOut()`, doesn't check reserves

**Better alternatives being used:**
- `getPoolTotalSupplied()` - Total supplied by pool
- `getPoolTotalBorrowed()` - Total borrowed by pool
- `getSwapAmountOut()` - Swap calculation (includes reserve info)

---

## 4. `getUserLiquidity()` - Why is it not being used?

**What it does:**
- Returns the number of LP tokens user has in a specific AMM pair
- Example: "User has 5 USDCEURC LP tokens"

**Why it's not used:**
1. **No LP UI** - No liquidity provider interface
2. **Default behavior** - Not used because `addLiquidity()` doesn't exist
3. **No tracking needed** - Currently tracking borrows/supplies
4. **Future feature** - Can be used once LP feature is added

**Logic Flow:**
```
addLiquidity() not used
    ↓
getUserLiquidity() can't be used either (LP token count would be zero)
    ↓
No LP UI = this data can't be displayed
```

---

## Summary Table

| Function | Why Missing | Potential | Recommendation |
|----------|-----------|-----------|-----------------|
| **addLiquidity** | No LP provider UI | Future v2 | Can stay in setup scripts |
| **removeLiquidity** | No LP management UI | Future v2 | Can stay in setup scripts |
| **getPoolReserves** | Hard-coded, incomplete | Future v2 | Can be removed (better alternative exists) |
| **getUserLiquidity** | No LP tracking UI | Future v2 | Can be removed |
| **schedulePayout** | No feature UI | Future v2 | ✅ REMOVED |

---

## Recommendations

### Immediate Action
- ✅ **schedulePayout removed** - Removed from imports

### Optional Code Cleanup
- Can be removed: `getPoolReserves()`, `getUserLiquidity()`
- Can be kept: `addLiquidity()`, `removeLiquidity()` (for future v2)

### Why are these 4 functions written without UI?

**Backend Preparation:** Functions are written and tested, waiting ready. In future version:
- When LP interface is added, these functions will be ready
- Will enable faster development
- Already used in setup scripts

---

## Detailed Explanation: Why were these 4 functions written?

```
DESIGN DECISION:
"As MVP (Minimal Viable Product) create Lending + Swap,
 add Liquidity provider UI in v2"

RESULT:
✅ Lending: Deposit, Borrow, Withdraw, Repay - WRITTEN & USED
✅ Swap: swapTokens, getSwapAmountOut - WRITTEN & USED
❌ LP: addLiquidity, removeLiquidity, getUserLiquidity - WRITTEN BUT NO UI
   • addLiquidity used during setup
   • Then waited for UI developer to write it
   • UI not written so not used
```

---

## Conclusion

**Why everything is in contractService.ts:**
1. Written by backend developer
2. Used in setup scripts (AddLiquidity.s.sol)
3. UI developer did not write UI
4. Code kept as backup instead of removed

**Best Practice:**
- Unused code is usually kept for future features
- or used in setup/admin scripts

