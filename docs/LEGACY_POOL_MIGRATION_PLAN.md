# Legacy Pool Migration Plan

## Objective

Migrate users safely from the current legacy lending pool to a new pool without losing access to funds currently stored in the old deployment.

## Current Situation

- Current pool address: `0x9dD7314B876fF9dFFB4F9aC4d4c8540156cf10b9`
- Legacy pool still contains active user funds.
- The legacy deployment is not fully compatible with the new interest/oracle model.
- Full owner-driven migration is not possible because user balances are owned by individual wallets, not by the contract owner.

## Migration Strategy

### Phase 1: Legacy Sunset Notice

Add a visible 15-day migration notice in the frontend.

User-facing message should communicate:
- the current pool is now considered a legacy pool,
- users should withdraw their funds within 15 days,
- a new pool will replace the legacy pool,
- legacy withdrawals will remain available after the sunset period through a dedicated legacy claims page or direct contract interaction.

### Phase 2: Legacy Pool Frontend Mode

Treat the current pool as a legacy pool in the frontend.

Behavior:
- disable new supply actions,
- disable new borrow actions,
- keep withdraw enabled,
- keep repay enabled,
- make it clear this pool is in wind-down mode.

This restriction is frontend-enforced because the deployed legacy contract does not provide a dedicated sunset mode.

### Phase 3: Legacy Claims Page

Add a dedicated legacy page/tab.

Purpose:
- let users connect their wallet,
- read their balances from the old pool,
- allow withdrawals from the legacy pool,
- allow repayments to the legacy pool,
- display the old pool contract address and explorer link,
- provide a direct-contract-interaction fallback.

Recommended naming:
- `Legacy Pool`
- `Legacy Withdrawals`
- `Legacy Claims`

## Contract Interaction Model

The old pool is not upgraded in place.

Instead:
- old pool remains accessible,
- new pool is deployed separately,
- users withdraw from the old pool and deposit into the new pool themselves.

This is a user-driven migration.

## Risks and Constraints

### Liquidity Constraint

Legacy withdrawals depend on liquidity remaining in the legacy pool.
If borrowers do not repay, some users may not be able to withdraw immediately.

Frontend should state clearly:
- withdraw availability depends on pool liquidity,
- repayments improve available liquidity.

### No Owner Sweep

The owner cannot move all user funds from the legacy pool to the new pool using admin power.
The contract does not expose a migration or sweep function for user deposits.

### Legacy APY Accuracy

Legacy APY may not fully reflect the intended new interest model.
The legacy interface should prioritize fund recovery and clarity over advanced yield presentation.

## Implementation Tasks

### UI / UX

- Add 15-day sunset banner with active countdown.
- Add legacy state messaging in dashboard and market.
- Hide or disable new supply/borrow actions for the legacy pool.
- Add a legacy tab/view in navigation.

### Legacy Claims View

- Read old pool balances per token.
- Show supplied and borrowed balances.
- Add withdraw and repay actions against the old pool.
- Show contract address and explorer link.

### New Pool Readiness

- Keep frontend architecture ready for a future new pool address.
- Separate legacy and active pool address handling.
- Allow switching the main app to the new pool later.

## Recommended Rollout

1. Publish legacy warning immediately.
2. Release frontend with legacy-only mode.
3. Keep old pool withdraw/repay accessible.
4. Prepare and validate new pool separately.
5. After the 15-day period, switch the main app to the new pool.
6. Keep legacy claims page available indefinitely or for a long grace period.

## Success Criteria

- Existing users can still access old pool funds.
- No forced migration is required.
- Frontend clearly distinguishes legacy pool and future active pool.
- Users have a simple path to withdraw from the old pool and later move to the new pool.
- The app avoids breaking access to already-deposited funds.

## Notes

This plan intentionally avoids any assumption that the owner can migrate user balances from the old pool automatically.
The migration path is based on preserving user control over their funds.
