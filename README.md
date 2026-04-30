# ARC Testnet Lending Protocol v2.3

Arc Testnet Lending Protocol v2.3 is a testnet-only DeFi playground that combines collateralized lending, AMM swaps, and a scheduled payout manager on Arc Testnet. The current repo state includes dependency automation, a wagmi + viem wallet stack with RainbowKit popup flow, wallet-independent read paths, stricter app state handling, and a legacy-pool migration UI that prepares users for a replacement lending pool.

[![Tests](https://img.shields.io/badge/tests-20%2F20-green)](#validation-status) [![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## Testnet Notice

This repository is for Arc Testnet only.

- Use test wallets and test funds only.
- Do not connect a mainnet wallet with real assets.
- The protocol is an MVP and is not ready for production use.

## Live App

- Frontend: [https://arclending.vercel.app/](https://arclending.vercel.app/)
- Bridge reference app: [https://arcbridge.vercel.app/](https://arcbridge.vercel.app/)

## What's Included in v2.3

- Dependency automation: `.github/dependabot.yml` covers the root package, `frontend`, and GitHub Actions; `.github/workflows/dependency-review.yml` reviews dependency changes on pull requests.
- Wallet and Web3 migration: the frontend now uses `wagmi` + `viem` with RainbowKit's wallet popup for injected, Coinbase, and optional WalletConnect flows.
- Contract service split: write actions use a signer, while read-only queries use a deterministic read provider and no longer require an attached wallet.
- App state hardening: wallet changes reset stale balances, borrows, supplies, history, and modal state before reloading fresh account data.
- Functional fixes: swap quote race conditions, borrow max precision issues, and negative available-liquidity displays were cleaned up.
- Shared formatting layer: asset display precision is centralized at USDC/EURC = 6, WBTC = 8, ETH/ARC = 6.
- Legacy migration flow: the frontend now includes a migration countdown, legacy-only pool mode, and a dedicated legacy withdrawals/claims page for the old lending pool.
- Active vs legacy pool preparation: the frontend address config now separates `legacy` and future `active` pool addresses so the replacement pool can be introduced without losing legacy access.
- Tooling cleanup: Tailwind 4, Vite config updates, `dotenv` refresh, and Foundry library updates are in place.
- Final cleanup status: the repository root `npm audit` is clean, the frontend `npm audit` is clean, and the frontend build still emits a Vite chunk-size warning for the wallet bundle.
- Security headers: `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` added to Vercel deployment config.
- UX improvements: withdraw and repay show success notifications with amount and asset; legacy pool screen shows per-asset pool remaining liquidity; withdraw prechecks catch insufficient pool liquidity before sending the transaction.

## Validation Status

Latest local validation for this repository:

- `forge test --match-path test/Contracts.t.sol`: 20/20 passing
- `npm --prefix frontend run build`: passing with a Vite chunk-size warning for the RainbowKit wallet bundle
- `npm audit` in the repository root: 0 findings
- `npm audit` in `frontend`: 0 findings

Current pinned library versions:

- `forge-std`: `v1.16.0`
- `openzeppelin-contracts`: `v5.6.1`
- Root `dotenv`: `^17.4.2`
- `@rainbow-me/rainbowkit`: `^2.2.10`
- `wagmi`: `^2.19.5`

## Network Details

| Setting | Value |
|---|---|
| Chain Name | Arc Testnet |
| Chain ID | `5042002` (`0x4cf1a2`) |
| Gas Token | USDC |
| Explorer | `https://testnet.arcscan.app` |
| Primary RPC | `https://rpc.testnet.arc.network` |
| Fallback RPC 1 | `https://rpc.drpc.testnet.arc.network` |
| Fallback RPC 2 | `https://rpc.quicknode.testnet.arc.network` |
| Fallback RPC 3 | `https://rpc.blockdaemon.testnet.arc.network` |

Arc Testnet add/switch helpers are wired into the header, and the frontend can fall back to bundled RPC endpoints when a custom frontend RPC is not supplied.

## Contract Addresses

### Core Contracts

| Contract | Address | Notes |
|---|---|---|
| LendingPool | `0x9dD7314B876fF9dFFB4F9aC4d4c8540156cf10b9` | Current legacy pool used during v2.2 migration window |
| ScheduledPayoutManager | `0x2A094018d03E9F8f6321e55513aA0EaC89DFdEEf` | Deployed, not yet surfaced in the frontend |
| AMM ETH/WBTC | `0xF4638B258905C6a2F7Aa71E05aAC887dB697c338` | Swap pair |
| AMM ETH/ARC | `0x677df5298Fd0a80672b1E6B4a61BEB75534a83A1` | Swap pair |
| AMM WBTC/ARC | `0x27e14cfEF1a029A32F574263dce67371bce32d24` | Swap pair |

### Token Contracts

| Token | Address | Decimals | Usage |
|---|---|---:|---|
| USDC | `0x3600000000000000000000000000000000000000` | 6 | Native Arc testnet stable asset |
| EURC | `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a` | 6 | Lending and collateral |
| ETH | `0x6dC1d97820974558e1bD555C04a5A19608F9512d` | 18 | Project-deployed mock testnet ERC20 used for lending, collateral, and swaps |
| WBTC | `0x27488Db1F8F9529B5820De984262179Ad913798E` | 8 | Project-deployed mock testnet ERC20 used for lending, collateral, and swaps |
| ARC | `0x56EFFB3b22DBBE576E4327D196aa5ed51476924e` | 18 | Project-deployed mock testnet ERC20 used for lending, collateral, and swaps |
| tUSD (legacy) | `0x78b8d44732a7e3601328B016d0bc0D30471685B7` | 18 | Legacy deployment, not part of the main frontend flow |

### Token Reality Check

- `src/MockETH.sol`, `src/MockWBTC.sol`, and `src/MockARC.sol` are mock ERC20 contracts included in this repository.
- The configured frontend addresses for ETH, WBTC, and ARC point to deployed testnet mock tokens for this app, not canonical mainnet-style assets.
- USDC is configured as Arc's native testnet stable asset, and EURC is configured as an Arc-side testnet token address for this deployment.

## Quick Start

Requirements:

- Node.js 18 or newer
- npm
- Git
- Foundry

```bash
git clone https://github.com/dharmanan/ARC-Testnet-Lend.git
cd ARC-Testnet-Lend

# Install root dependencies
npm install

# Install frontend dependencies
npm --prefix frontend install

# Create local environment file
cp .env.example .env

# Run the repository test slice
forge test --match-path test/Contracts.t.sol

# Start the frontend
npm --prefix frontend run dev
```

Open `http://localhost:3000` and connect a test wallet on Arc Testnet.

## Environment Variables

Root `.env`:

- `ARC_TESTNET_RPC_URL`: RPC endpoint for Foundry scripts and tests
- `PRIVATE_KEY`: deployer or relayer key for testnet use only
- `SCHEDULER_ADDRESS`: scheduled payout manager address when needed by scripts

Frontend `.env.local` or `.env`:

- `VITE_ARC_RPC_URL`: optional frontend read RPC override
- `VITE_WALLETCONNECT_PROJECT_ID`: optional WalletConnect project id

If `VITE_ARC_RPC_URL` is not set, the frontend falls back to the bundled Arc Testnet RPC list.

Never commit `.env` files or private keys.

## Architecture Notes

- `frontend/lib/chains.ts` centralizes Arc Testnet chain metadata and wallet add/switch helpers.
- `frontend/lib/wagmi.config.ts` configures injected, Coinbase, and optional WalletConnect connectors.
- `frontend/lib/web3.tsx` provides the shared `WagmiProvider`, `QueryClientProvider`, and `RainbowKitProvider` tree.
- `frontend/components/Header.tsx` renders RainbowKit's real `ConnectButton`, so wallet selection uses the original popup flow instead of an in-app dropdown.
- `frontend/services/contractService.ts` keeps read paths and write paths separate, with `syncWalletClient(walletClient)` bridging wagmi into the `ethers` service layer.
- `frontend/App.tsx` resets portfolio state on disconnect and account changes before loading fresh wallet-specific data.
- `frontend/lib/formatters.ts` is the shared asset formatter used by swap, modal, history, and market rendering.
- `frontend/components/LegacyClaims.tsx` provides the legacy migration surface for old-pool withdrawals and repayments.
- `frontend/constants.ts` now separates `POOL_ADDRESSES.legacy` and `POOL_ADDRESSES.active` to support the v2.2 migration UI.

## Legacy Pool Migration in v2.2

The current lending pool remains accessible as a legacy pool while the app prepares for a replacement deployment.

- A live countdown banner is shown in the app.
- The sunset window is currently set to **15 days**.
- The main market operates in a legacy wind-down mode.
- New supply and new borrow actions are disabled in the legacy pool UI.
- Withdraw and repay remain available.
- A dedicated `Legacy` tab provides direct access to legacy balances and actions.

Important migration notes:

- Legacy balances remain user-controlled and are not swept by the owner.
- The old deployed pool does not fully match the newer interest/oracle model.
- Because of that deployment mismatch, legacy APY is intentionally limited or hidden where needed instead of showing possibly incorrect values.
- When the replacement pool is deployed, the user interface will change again to separate the new active pool from the legacy withdrawal flow.


## Project Layout

```text
ARC-Testnet-Lend/
├── src/                    Solidity contracts
├── test/                   Foundry test suite
├── script/                 Deployment and liquidity scripts
├── frontend/               React, Vite, wagmi + RainbowKit frontend
├── relayer/                Scheduled payout relayer
├── docs/                   Kept reference docs and screenshots
├── foundry.lock            Pinned Foundry library versions
├── package.json            Root relayer package
├── ROADMAP.md              Public roadmap
└── README.md               Canonical repository README
```

## Supporting Docs

- [ROADMAP.md](ROADMAP.md)
- [docs/LENDING_POOL_GUIDE.md](docs/LENDING_POOL_GUIDE.md)
- [docs/METAMASK_RED_ALERT_RPC_DELAY.md](docs/METAMASK_RED_ALERT_RPC_DELAY.md)
- [docs/WBTC_ARC_APPROVAL_EXPLAINED.md](docs/WBTC_ARC_APPROVAL_EXPLAINED.md)

## Contributing

Before opening a pull request for contract or frontend changes, run:

```bash
forge test --match-path test/Contracts.t.sol
npm --prefix frontend run build
```

## License

MIT - [LICENSE](LICENSE)
