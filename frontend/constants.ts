import { Asset } from './types';

export { ARC_RPC_URLS as RPC_URLS, ARC_TESTNET_CHAIN } from './lib/chains';

export const CONTRACT_ADDRESSES: Record<string, string> = {
  stableToken: '0x78b8d44732a7e3601328B016d0bc0D30471685B7', // Our deployed tUSD
  usdc: '0x3600000000000000000000000000000000000000', // Arc native USDC
  eurc: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a', // Arc EURC
  eth: '0x6dC1d97820974558e1bD555C04a5A19608F9512d', // Mock ETH
  wbtc: '0x27488Db1F8F9529B5820De984262179Ad913798E', // Mock WBTC
  arc: '0x56EFFB3b22DBBE576E4327D196aa5ed51476924e', // Mock ARC
  lendingPool: '0x9dD7314B876fF9dFFB4F9aC4d4c8540156cf10b9', // LendingPool
  scheduledPayoutManager: '0x2A094018d03E9F8f6321e55513aA0EaC89DFdEEf', // ScheduledPayoutManager
  ammPairUSDCEURC: '0x0000000000000000000000000000000000000000', // TODO: replace with deployed USDCEURCPair
  // GenericAMMPairs (MockTokens - no transfer limits)
  ammPairETHWBTC: '0xF4638B258905C6a2F7Aa71E05aAC887dB697c338', // ETH/WBTC
  ammPairETHARC: '0x677df5298Fd0a80672b1E6B4a61BEB75534a83A1', // ETH/ARC
  ammPairWBTCARC: '0x27e14cfEF1a029A32F574263dce67371bce32d24', // WBTC/ARC
};

export const POOL_ADDRESSES = {
  legacy: CONTRACT_ADDRESSES.lendingPool,
  active: '', // Set when the replacement pool is deployed.
} as const;

export const ASSETS: Asset[] = [
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    icon: 'eth',
    priceUSD: 3500.00,
    supplyApy: 0, // Collateral-only, no lending APY
    borrowApy: 0, // Cannot be borrowed
    totalSupplied: 0,
    totalBorrowed: 0,
    liquidationThreshold: 0.85,
    isCollateral: true,
    lendingEnabled: false, // Collateral-only
    borrowEnabled: false,  // Cannot be borrowed
    baseRate: 0,
    multiplier: 0,
    reserveFactor: 0,
    contractAddress: CONTRACT_ADDRESSES.eth,
  },
  {
    id: 'wbtc',
    name: 'Wrapped BTC',
    symbol: 'WBTC',
    icon: 'wbtc',
    priceUSD: 65000.00,
    supplyApy: 0, // Collateral-only, no lending APY
    borrowApy: 0, // Cannot be borrowed
    totalSupplied: 0,
    totalBorrowed: 0,
    liquidationThreshold: 0.80,
    isCollateral: true,
    lendingEnabled: false, // Collateral-only
    borrowEnabled: false,  // Cannot be borrowed
    baseRate: 0,
    multiplier: 0,
    reserveFactor: 0,
    contractAddress: CONTRACT_ADDRESSES.wbtc,
  },
  {
    id: 'usdc',
    name: 'USD Coin',
    symbol: 'USDC',
    icon: 'usdc',
    priceUSD: 1.00,
    supplyApy: 5.50, // Real lending APY
    borrowApy: 7.20, // Real borrow APY
    totalSupplied: 50000000,
    totalBorrowed: 35000000,
    liquidationThreshold: 0.90,
    isCollateral: true,
    lendingEnabled: true, // Primary lending token
    borrowEnabled: true,  // Can be borrowed
    baseRate: 3,
    multiplier: 10,
    reserveFactor: 0.10,
    contractAddress: CONTRACT_ADDRESSES.usdc,
  },
  {
    id: 'eurc',
    name: 'Euro Coin',
    symbol: 'EURC',
    icon: 'eurc',
    priceUSD: 1.08,
    supplyApy: 5.20, // Real lending APY
    borrowApy: 7.00, // Real borrow APY
    totalSupplied: 30000000,
    totalBorrowed: 21000000,
    liquidationThreshold: 0.88,
    isCollateral: true,
    lendingEnabled: true, // Primary lending token
    borrowEnabled: true,  // Can be borrowed
    baseRate: 2.8,
    multiplier: 10,
    reserveFactor: 0.10,
    contractAddress: CONTRACT_ADDRESSES.eurc,
  },
  {
    id: 'arc',
    name: 'Arc Token',
    symbol: 'ARC',
    icon: 'arc',
    priceUSD: 2.50,
    supplyApy: 0, // Collateral-only, no lending APY
    borrowApy: 0, // Cannot be borrowed
    totalSupplied: 0,
    totalBorrowed: 0,
    liquidationThreshold: 0.60,
    isCollateral: true,
    lendingEnabled: false, // Collateral-only
    borrowEnabled: false,  // Cannot be borrowed
    baseRate: 0,
    multiplier: 0,
    reserveFactor: 0,
    contractAddress: CONTRACT_ADDRESSES.arc,
  },
];