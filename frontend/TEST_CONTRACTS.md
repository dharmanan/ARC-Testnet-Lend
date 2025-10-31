# Contract Testing Report

## Kontrat Adresleri (constants.ts'den)

### ✅ FULLY ACTIVE & VERIFIED

| Adı | Adres | Status | Used In | Decimals |
|-----|-------|--------|---------|----------|
| USDC (Arc Native) | 0x3600000000000000000000000000000000000000 | ✅ | Lending | 6 |
| EURC | 0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a | ✅ | Lending | 6 |
| ETH (Mock) | 0x6dC1d97820974558e1bD555C04a5A19608F9512d | ✅ | Lending + Swap | 18 |
| WBTC (Mock) | 0x27488Db1F8F9529B5820De984262179Ad913798E | ✅ | Lending + Swap | 8 |
| ARC (Mock) | 0x56EFFB3b22DBBE576E4327D196aa5ed51476924e | ✅ | Lending + Swap | 18 |
| LendingPool | 0x9dD7314B876fF9dFFB4F9aC4d4c8540156cf10b9 | ✅ | Core | - |
| GenericAMMPair ETH/WBTC | 0xF4638B258905C6a2F7Aa71E05aAC887dB697c338 | ✅ | Swap | - |
| GenericAMMPair ETH/ARC | 0x677df5298Fd0a80672b1E6B4a61BEB75534a83A1 | ✅ | Swap | - |
| GenericAMMPair WBTC/ARC | 0x27e14cfEF1a029A32F574263dce67371bce32d24 | ✅ | Swap | - |

### ⚠️ ACTIVE BUT NOT ACTIVELY USED

| Adı | Adres | Status | Notes |
|-----|-------|--------|-------|
| tUSD (Legacy) | 0x78b8d44732a7e3601328B016d0bc0D30471685B7 | ⚠️ | Old token, not in active assets |
| ScheduledPayoutManager | 0x2A094018d03E9F8f6321e55513aA0EaC89DFdEEf | ⚠️ | Imported but not used in UI |

## Test Planı

### ✅ COMPLETED

**Phase 1: Contract Verification**
- ✅ All 11 contracts verified on-chain (bytecode present)
- ✅ All active contracts identified
- ✅ Function usage analyzed
- ✅ Swap pool liquidity confirmed (tested in previous sessions)

**Phase 2: Function Usage Analysis**
- ✅ 14 actively used functions identified
- ✅ 1 imported but unused function found (schedulePayout)
- ✅ 4 completely unused functions identified (addLiquidity, removeLiquidity, getPoolReserves, getUserLiquidity)
- ✅ 1 legacy token identified (tUSD - not in active assets)

### 🧪 TODO: Live Testing

Small amounts to test:
- USDC: 0.01 (6 decimals = 10000000 wei)
- EURC: 0.01 (6 decimals = 10000000 wei)
- ETH: 0.0001 (18 decimals = 100000000000000 wei)
- WBTC: 0.00001 (8 decimals = 1000 wei)
- ARC: 0.01 (18 decimals = 10000000000000000 wei)

### Test Operations

**Wallet & Connection**
- [ ] Connect wallet
- [ ] Check connected address
- [ ] Disconnect wallet
- [ ] Reconnect with new address (if available)

**Token Balances**
- [ ] Check USDC balance
- [ ] Check EURC balance
- [ ] Check ETH balance
- [ ] Check WBTC balance
- [ ] Check ARC balance

**Lending Pool - Deposits**
- [ ] Deposit 0.01 USDC
- [ ] Deposit 0.0001 ETH
- [ ] Deposit 0.00001 WBTC
- [ ] Deposit 0.01 ARC
- [ ] Check pool balances updated
- [ ] Check displayed supplied amounts

**Lending Pool - Borrows**
- [ ] Borrow 0.001 USDC (against ETH collateral)
- [ ] Borrow 0.00001 ETH (against USDC collateral)
- [ ] Check health factor updated
- [ ] Check borrow balance updated

**Lending Pool - Withdraw**
- [ ] Withdraw 0.005 USDC
- [ ] Withdraw 0.00005 ETH
- [ ] Check balance updates

**Lending Pool - Repay**
- [ ] Repay 0.001 USDC
- [ ] Repay 0.00001 ETH
- [ ] Check borrow balance decreases

**Swapping**
- [ ] Swap 0.0001 ETH → WBTC
- [ ] Swap 0.00001 WBTC → ETH
- [ ] Swap 0.0001 ETH → ARC
- [ ] Swap 0.01 ARC → ETH
- [ ] Swap 0.00001 WBTC → ARC
- [ ] Verify all amounts match blockchain

**Pool Queries**
- [ ] Get total supplied for USDC
- [ ] Get total borrowed for USDC
- [ ] Get available liquidity (totalSupplied - totalBorrowed)

## Test Results

(Test sonuçları buraya yazılacak)