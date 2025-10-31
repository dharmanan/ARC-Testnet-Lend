# ⚡ QUICK REFERENCE: MetaMask Network Fee Alert

## One-Liner
**Red alert during swap = MetaMask verifying network fee. Wait 5-10 seconds, it disappears. Then click Sign. Completely normal.**

---

## What You See

```
MetaMask Signature Request:
┌──────────────────────────┐
│ 🔴 Network fee alert     │
│    or red warning        │
│                          │
│ From: 0xABC...          │
│ To: Pair Contract       │
│ Method: approve()       │
│                          │
│ [Reject] [Wait...]      │
└──────────────────────────┘
```

---

## What To Do

| Action | Details |
|--------|---------|
| **DON'T PANIC** | This is normal! MetaMask is checking network fee. |
| **WAIT 5-10s** | Alert is temporary during fee verification. |
| **ALERT DISAPPEARS** | After fee check completes. |
| **CLICK SIGN** | Data will show correctly. |
| **CONFIRM** | Approve completes. |

---

## Why It Happens

```
Timeline:
0-1s  → MetaMask receives TX
1-2s  → Checks network fee calculation
2-5s  → Red alert appears (verification in progress)
5-10s → Fee verification completes
10s+  → Alert clears automatically
```

**Cause**: MetaMask verifying network fee (takes 5-10s on testnet)
**Frequency**: Normal on testnet, rare on mainnet
**Risk Level**: 🟢 LOW - Just a delay

---

## Safety Check

Before signing, verify:
- ✅ Method: `approve()`
- ✅ Spender: `0x27e14...` (our pair)
- ✅ Token: `0x27488...` (WBTC)
- ✅ Network: Arc Testnet

All match? → Safe to sign ✓

---

## Quick FAQ

**Q: Red alert = Fee problem?**
A: No. MetaMask just checking. Fee is calculated correctly.

**Q: Should I close and retry?**
A: No. Just wait. Alert clears in 5-10s.

**Q: Can I click Sign while red?**
A: Yes, but wait for clarity. Same result either way.

**Q: Been waiting 15+ min?**
A: Refresh page. Try again. Network might be down.

---

## Next Steps

- ⏳ Wait 5-10 seconds
- ✓ Alert disappears
- 🖱️ Click Sign
- ✅ Swap completes

---

**For more details**: See `METAMASK_RED_ALERT_RPC_DELAY.md`

