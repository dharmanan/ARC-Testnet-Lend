# ARC Testnet Lending Protocol — Roadmap

## Phase 1: Core Protocol ✅ (Complete)

- [x] LendingPool contract (deposit, borrow, repay, withdraw)
- [x] Three AMM pairs (ETH/WBTC, ETH/ARC, WBTC/ARC) with 0.3% fees
- [x] Scheduled payout manager (time-locked releases)
- [x] Full test coverage (20/20 tests passing)
- [x] Contract verification on Arc Testnet
- [x] React frontend demo UI

## Phase 2: Enhanced Features 🚧 (In Progress)

- [ ] Flash loan support in LendingPool
- [ ] Multi-sig governance for protocol parameters
- [x] Advanced slippage protection in AMM swaps (1 % frontend slippage guard; on-chain guard pending)
- [x] Frontend: wallet connection improvements (wagmi + viem + RainbowKit)
- [x] Frontend: transaction history & analytics (History tab, success notifications)
- [ ] Gas optimization passes

## Phase 3: Production Hardening 📋 (Planned)

- [ ] Formal verification of core contracts
- [ ] External security audit
- [ ] Rate limit protections
- [ ] Enhanced monitoring & alerting
- [ ] Mainnet deployment readiness
- [ ] SDK/library for developers

## Phase 4: Ecosystem Integration 🔮 (Future)

- [ ] Price feed integration (oracle support)
- [ ] Cross-chain bridge support
- [ ] Additional AMM pair types (stable pairs, weighted pools)
- [ ] Governance token & DAO
- [ ] Mobile app for protocol
- [ ] Liquidity mining program

## Known Limitations

- Testnet only — use test funds only
- No formal verification yet
- Slippage protection minimal — users must be careful
- Price feeds not integrated — static prices used
- No flash loan protection (future phase)

## Contributing

See [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) for development setup.

Open issues for feature requests or bugs. PRs welcome with test coverage.

## Questions?

Open an issue on GitHub or contact the maintainer.
