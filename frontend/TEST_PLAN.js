/**
 * CONTRACT TESTING UTILITIES
 * 
 * Bu script console'dan çalıştırılacak. Tüm kontratları test eder.
 * 
 * Kullanım:
 * 1. Sayfayı yükle
 * 2. Wallet'i bağla
 * 3. console.log(testplan) de kopyala
 * 4. Browser console'da yapıştır ve çalıştır
 */

const testPlan = {
  contracts: {
    usdc: "0x3600000000000000000000000000000000000000",
    eurc: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
    eth: "0x6dC1d97820974558e1bD555C04a5A19608F9512d",
    wbtc: "0x27488Db1F8F9529B5820De984262179Ad913798E",
    arc: "0x56EFFB3b22DBBE576E4327D196aa5ed51476924e",
    tusd: "0x78b8d44732a7e3601328B016d0bc0D30471685B7",
    lendingPool: "0x9dD7314B876fF9dFFB4F9aC4d4c8540156cf10b9",
    scheduledPayoutManager: "0x2A094018d03E9F8f6321e55513aA0EaC89DFdEEf",
    ammPairETHWBTC: "0xF4638B258905C6a2F7Aa71E05aAC887dB697c338",
    ammPairETHARC: "0x677df5298Fd0a80672b1E6B4a61BEB75534a83A1",
    ammPairWBTCARC: "0x27e14cfEF1a029A32F574263dce67371bce32d24",
  },

  // Test amounts (VERY SMALL for safety)
  amounts: {
    usdc: "0.01",    // 6 decimals
    eurc: "0.01",    // 6 decimals  
    eth: "0.0001",   // 18 decimals (0.0001 ETH)
    wbtc: "0.00001", // 8 decimals (0.00001 WBTC)
    arc: "0.01",     // 18 decimals (0.01 ARC)
    tusd: "0.01",    // 18 decimals
  },

  tests: {
    "1_mint_usdc": "Test USDC mint (native)",
    "2_mint_eurc": "Test EURC mint",
    "3_mint_eth": "Test ETH mint",
    "4_mint_wbtc": "Test WBTC mint",
    "5_mint_arc": "Test ARC mint",
    "6_mint_tusd": "Test tUSD mint (eski token)",
    "7_deposit_usdc": "Test USDC deposit to lending pool",
    "8_deposit_eth": "Test ETH deposit to lending pool",
    "9_borrow_usdc": "Test USDC borrow from lending pool",
    "10_borrow_eth": "Test ETH borrow from lending pool",
    "11_swap_eth_wbtc": "Test ETH → WBTC swap",
    "12_swap_wbtc_eth": "Test WBTC → ETH swap",
    "13_swap_eth_arc": "Test ETH → ARC swap",
    "14_swap_arc_eth": "Test ARC → ETH swap",
    "15_swap_wbtc_arc": "Test WBTC → ARC swap",
    "16_swap_arc_wbtc": "Test ARC → WBTC swap",
    "17_repay_usdc": "Test USDC repay",
    "18_repay_eth": "Test ETH repay",
    "19_withdraw_usdc": "Test USDC withdraw",
    "20_withdraw_eth": "Test ETH withdraw",
    "21_schedule_payout": "Test ScheduledPayoutManager (schedule payout)",
    "22_check_balances": "Final balance check"
  }
};

console.log("Test Planı Hazır!");
console.log("Tüm testler:", testPlan.tests);
console.log("\nKontrat Adresleri:", testPlan.contracts);
console.log("\nTest Miktarları:", testPlan.amounts);
console.log("\nNOT: Gerçek testler için console'da ayrı ayrı her fonksiyonu çağırmalısın.");
