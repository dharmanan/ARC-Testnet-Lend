export interface Asset {
  id: string;
  name: string;
  symbol: string;
  icon: string; // Changed from JSX.Element to string
  priceUSD: number;
  supplyApy: number;
  borrowApy: number;
  totalSupplied: number;
  totalBorrowed: number;
  liquidationThreshold: number;
  isCollateral: boolean;
  lendingEnabled: boolean; // Can users supply/lend this token?
  borrowEnabled: boolean;  // Can users borrow this token?
  baseRate: number;
  multiplier: number;
  reserveFactor: number;
  contractAddress?: string; // Optional for mock assets
}

export type UserBalance = {
  assetId: string;
  amount: number;
};

export enum ModalType {
    SUPPLY,
    WITHDRAW,
    BORROW,
    REPAY
}

export enum TransactionType {
    SUPPLY = 'Supply',
    WITHDRAW = 'Withdraw',
    BORROW = 'Borrow',
    REPAY = 'Repay',
    SWAP = 'Swap'
}

export interface Transaction {
    id: string;
    type: TransactionType;
    asset: Asset;
    amount: number;
    timestamp: Date;
    // For swaps
    toAsset?: Asset;
    toAmount?: number;
}