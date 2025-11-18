# Changelog

All notable changes to the ARC Testnet Lending Protocol are documented here.

## [Unreleased]

### Fixed
- **RPC Provider Caching Issue** - Fixed wallet balance display showing stale data (109 USDC instead of 99 USDC)
  - Changed RPC provider priority in `constants.ts`: Arc official RPC (`https://rpc.testnet.arc.network`) is now primary
  - Blockdaemon RPC moved to fallback position due to node sync lag
  - Issue: Blockdaemon's RPC node was returning cached/stale blockchain state while official Arc node had current state
  - Fix ensures accurate real-time balance updates from the most current blockchain state

- **Mock Data Masking** - Reset initial `userBalances` state from mock values to empty arrays
  - Previous: Initial state had mock values (5000 USDC, 10 ETH, etc.) that masked real blockchain data
  - Current: Initial state starts at 0 for all assets, allowing real blockchain values to display correctly
  - File: `frontend/App.tsx`

- **Balance Load Logging** - Added debug logging to track balance updates
  - Added console.log in `connectWallet()` function to log actual values fetched from blockchain
  - Helps developers debug balance loading issues and verify RPC responses
  - Log format: `✅ User balances updated: { usdc: X, eurc: Y, eth: Z, wbtc: W, arc: A }`

### Changed
- **RPC URLs Ordering** in `frontend/constants.ts`:
  ```typescript
  // Before:
  'https://rpc.blockdaemon.testnet.arc.network',   // Primary
  'https://rpc.testnet.arc.network',               // Fallback
  
  // After:
  'https://rpc.testnet.arc.network',               // Primary - official Arc
  'https://rpc.blockdaemon.testnet.arc.network',   // Fallback 4 (last)
  ```

### Technical Details
- **Root Cause**: RPC provider selection directly impacts blockchain state freshness
  - Official Arc RPC node has up-to-date state
  - Blockdaemon aggregator service may have delayed state (network/node sync lag)
  - When multiple RPC providers are available, system should try most reliable first
  
- **Impact**: 
  - Wallet balances now reflect actual on-chain state
  - Real-time accuracy improves with official RPC as primary
  - Explorer (arcscan.app) and frontend now show consistent values
  
- **Testing**:
  - Verified wallet address: `0x6aa9a8c4b8774c9c38e79e228f4e2d9efb1e02a2`
  - Actual balance confirmed on explorer: 99 USDC
  - Previous bug displayed: 109.215498 USDC (from stale Blockdaemon data)
  - Fix ensures frontend displays: 99 USDC (from Arc official RPC)

### Files Modified
- `frontend/constants.ts` - RPC provider ordering
- `frontend/App.tsx` - Initial state reset + debug logging

---

## Version Notes

For each release, document:
- **Fixed**: Bug fixes and corrections
- **Added**: New features or functionality  
- **Changed**: Changes to existing features
- **Removed**: Deleted features or functionality
- **Security**: Security-related changes
- **Deprecated**: Features marked for future removal

---

For questions or issues, see [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) or the [troubleshooting guide](docs/METAMASK_RED_ALERT_RPC_DELAY.md).
