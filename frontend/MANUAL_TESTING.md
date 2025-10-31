# Manual Contract Testing Guide

## Step-by-Step Testing

### Prerequisites
1. MetaMask bağlı olmalı (Arc Testnet'e)
2. Browser console açık (F12)
3. Sayfada importlar kullanılabilir

### Phase 1: Mint Operations (Token Acquisition)

Her token için küçük miktar mint etmek:

```bash
# Browser console'da çalıştır (ethers ve app fonksiyonları erişebilir)

// 1. USDC Mint Test
const usdcMint = async () => {
  const usdcAddr = "0x3600000000000000000000000000000000000000";
  const amount = "0.01"; // 0.01 USDC (6 decimals)
  
  try {
    // App'deki mintToPool fonksiyonunu çağır (varsa)
    // veya doğrudan kontrat çağrısı yap
    console.log("USDC mint attempt...");
    // Sonuç log'lanacak
  } catch(e) {
    console.error("USDC mint failed:", e);
  }
};

// 2. EURC Mint Test
// 3. ETH Mint Test
// ... vs vs
```

### Phase 2: Lending Pool Operations

```bash
# Deposit, Borrow, Withdraw, Repay test et
```

### Phase 3: Swap Operations

```bash
# Her swap combination'ı test et
```

### Phase 4: ScheduledPayoutManager

```bash
# Payout schedule ve execute test et
```

## Expected Results

Başarılı olan kontratlar: ✅
- USDC (native)
- ETH (mock)
- WBTC (mock)
- ARC (mock)
- LendingPool
- GenericAMMPairs (3 adet)

Sorunlu/eski kontratlar: ❌
- EURC (eğer hata verirse)
- tUSD (eski token)
- ScheduledPayoutManager (eğer unused)

## Test Output Format

Her test için not et:
- Kontrat Adı
- Test Edildi: Y/N
- Sonuç: ✅/❌
- Hata (varsa)
- Notlar

