import { Asset } from '../types';

const DISPLAY_DECIMALS_BY_SYMBOL: Record<string, number> = {
  USDC: 6,
  EURC: 6,
  WBTC: 8,
  ETH: 6,
  MCN: 6,
};

const trimTrailingZeros = (value: string) => {
  return value.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
};

export const getAssetDisplayDecimals = (assetOrSymbol?: Asset | string) => {
  const symbol = typeof assetOrSymbol === 'string' ? assetOrSymbol : assetOrSymbol?.symbol;
  return DISPLAY_DECIMALS_BY_SYMBOL[symbol ?? ''] ?? 6;
};

export const formatAssetAmount = (value: number, assetOrSymbol?: Asset | string) => {
  if (!Number.isFinite(value)) {
    return '0';
  }

  const decimals = getAssetDisplayDecimals(assetOrSymbol);
  return trimTrailingZeros(value.toFixed(decimals));
};

export const formatAssetAmountFixed = (value: number, assetOrSymbol?: Asset | string) => {
  if (!Number.isFinite(value)) {
    return '0';
  }

  return value.toFixed(getAssetDisplayDecimals(assetOrSymbol));
};