import { Asset } from './types';

export const CONTRACT_ADDRESSES: Record<string, string> = {
  stableToken: '0x78b8d44732a7e3601328B016d0bc0D30471685B7', // Our deployed tUSD
  usdc: '0x3600000000000000000000000000000000000000', // Arc native USDC
  eurc: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a', // Arc EURC
  eth: '0x6dC1d97820974558e1bD555C04a5A19608F9512d', // Mock ETH
  wbtc: '0x27488Db1F8F9529B5820De984262179Ad913798E', // Mock WBTC
  arc: '0x56EFFB3b22DBBE576E4327D196aa5ed51476924e', // Mock ARC
  lendingPool: '0x9dD7314B876fF9dFFB4F9aC4d4c8540156cf10b9', // LendingPool
  scheduledPayoutManager: '0x2A094018d03E9F8f6321e55513aA0EaC89DFdEEf', // ScheduledPayoutManager
  // GenericAMMPairs (MockTokens - no transfer limits)
  ammPairETHWBTC: '0xF4638B258905C6a2F7Aa71E05aAC887dB697c338', // ETH/WBTC
  ammPairETHARC: '0x677df5298Fd0a80672b1E6B4a61BEB75534a83A1', // ETH/ARC
  ammPairWBTCARC: '0x27e14cfEF1a029A32F574263dce67371bce32d24', // WBTC/ARC
};

// RPC URLs in priority order - system will try each one if previous fails
export const RPC_URLS = [
  'https://rpc.blockdaemon.testnet.arc.network',   // Primary - try blockdaemon first
  'https://rpc.testnet.arc.network',               // Fallback - official Arc
  'https://rpc.drpc.testnet.arc.network',          // Fallback 2
  'https://rpc.quicknode.testnet.arc.network',     // Fallback 3
];

export const ARC_TESTNET_CHAIN = {
  chainId: '0x4cf1a2',
  chainName: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18, // MetaMask requires 18, decimals handled in code
  },
  rpcUrls: RPC_URLS,
  blockExplorerUrls: ['https://testnet.arcscan.app'],
};

export const ASSETS: Asset[] = [
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    icon: 'eth',
    priceUSD: 3500.00,
    supplyApy: 3.25, // Will be dynamically calculated
    borrowApy: 4.50, // Will be dynamically calculated
    totalSupplied: 120000,
    totalBorrowed: 80000,
    liquidationThreshold: 0.85,
    isCollateral: true,
    baseRate: 2,
    multiplier: 5,
    reserveFactor: 0.15,
    contractAddress: CONTRACT_ADDRESSES.eth,
  },
  {
    id: 'wbtc',
    name: 'Wrapped BTC',
    symbol: 'WBTC',
    icon: 'wbtc',
    priceUSD: 65000.00,
    supplyApy: 0.50, // Will be dynamically calculated
    borrowApy: 1.25, // Will be dynamically calculated
    totalSupplied: 5000,
    totalBorrowed: 2000,
    liquidationThreshold: 0.80,
    isCollateral: true,
    baseRate: 0.25,
    multiplier: 2,
    reserveFactor: 0.20,
    contractAddress: CONTRACT_ADDRESSES.wbtc,
  },
  {
    id: 'usdc',
    name: 'USD Coin',
    symbol: 'USDC',
    icon: 'usdc',
    priceUSD: 1.00,
    supplyApy: 5.50, // Will be dynamically calculated
    borrowApy: 7.20, // Will be dynamically calculated
    totalSupplied: 50000000,
    totalBorrowed: 35000000,
    liquidationThreshold: 0.90,
    isCollateral: true,
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
    supplyApy: 5.20, // Will be dynamically calculated
    borrowApy: 7.00, // Will be dynamically calculated
    totalSupplied: 30000000,
    totalBorrowed: 21000000,
    liquidationThreshold: 0.88,
    isCollateral: true,
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
    supplyApy: 2.10, // Will be dynamically calculated
    borrowApy: 3.50, // Will be dynamically calculated
    totalSupplied: 1000000,
    totalBorrowed: 400000,
    liquidationThreshold: 0.60,
    isCollateral: true,
    baseRate: 1.5,
    multiplier: 4,
    reserveFactor: 0.25,
    contractAddress: CONTRACT_ADDRESSES.arc,
  },
];