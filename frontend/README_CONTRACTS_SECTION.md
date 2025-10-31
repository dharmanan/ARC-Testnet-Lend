# README Template - Contracts Section

## 📋 Smart Contracts & Deployment

### Arc Testnet Deployment

All contracts are deployed and verified on Arc Testnet (Chain ID: 5042002).

#### Core Contracts

**Lending Pool**
- Address: `0x9dD7314B876fF9dFFB4F9aC4d4c8540156cf10b9`
- Functions: Deposit, Withdraw, Borrow, Repay
- Supported Assets: USDC, EURC, ETH, WBTC, ARC

**GenericAMMPair (Swap Contracts)**
- ETH/WBTC: `0xF4638B258905C6a2F7Aa71E05aAC887dB697c338`
  - Liquidity: 50 ETH + 2.5 WBTC
- ETH/ARC: `0x677df5298Fd0a80672b1E6B4a61BEB75534a83A1`
  - Liquidity: 50 ETH + 1500 ARC
- WBTC/ARC: `0x27e14cfEF1a029A32F574263dce67371bce32d24`
  - Liquidity: 2.5 WBTC + 1500 ARC

#### Token Contracts

| Token | Address | Decimals | Type | Usage |
|-------|---------|----------|------|-------|
| USDC | `0x3600000000000000000000000000000000000000` | 6 | Arc Native | Lending |
| EURC | `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a` | 6 | Mock | Lending |
| ETH | `0x6dC1d97820974558e1bD555C04a5A19608F9512d` | 18 | Mock | Lending + Swap |
| WBTC | `0x27488Db1F8F9529B5820De984262179Ad913798E` | 8 | Mock | Lending + Swap |
| ARC | `0x56EFFB3b22DBBE576E4327D196aa5ed51476924e` | 18 | Mock | Lending + Swap + Collateral |

### Features Implemented

✅ **Lending Protocol**
- Deposit any supported token
- Borrow against collateral
- Withdraw deposits
- Repay loans
- Real-time health factor calculation

✅ **DEX (Swap)**
- Swap between any pair: ETH ↔ WBTC, ETH ↔ ARC, WBTC ↔ ARC
- Constant product AMM formula
- Real liquidity in pools

✅ **UI Features**
- Dashboard with net worth, health factor, APY
- Market view with available liquidity per token
- Swap interface with real on-chain calculations
- Transaction history
- Wallet connection/disconnection

### Network Configuration

**RPC Endpoints** (with failover):
1. Primary: `https://rpc.blockdaemon.testnet.arc.network`
2. Fallback: `https://rpc.testnet.arc.network`

**MetaMask Network Settings**:
- Chain ID: `0x4cf1a2` (5042002)
- RPC URL: Use above endpoints
- Native Currency: USDC (6 decimals)
- Block Explorer: `https://testnet.arcscan.app`

### Not Implemented

- ❌ Liquidity provisioning UI (only via scripts)
- ❌ Scheduled payouts
- ❌ Additional token pairs
- ❌ Governance

### For Developers

**Contract Interaction Functions** (in `contractService.ts`):
```
Wallet:     connectWallet, disconnectWallet
Balance:    getTokenBalance, getPoolBalance, getBorrowBalance
Lending:    depositToPool, withdrawFromPool, borrowFromPool, repayToPool
Pool Data:  getPoolTotalSupplied, getPoolTotalBorrowed, getTotalSupply, getTotalBorrowed
Swapping:   swapTokens, getSwapAmountOut
```

All functions include proper error handling and decimal conversion for each token type.

---

## Deployment Instructions

To redeploy or verify:

```bash
cd backend
forge script script/Deploy.s.sol --rpc-url <ARC_RPC> --private-key <KEY> --broadcast
```

To add liquidity:

```bash
forge script script/AddLiquidity.s.sol --rpc-url <ARC_RPC> --private-key <KEY> --broadcast
```

