import React from 'react';
import { Asset, UserBalance } from '../types';
import { ModalType } from '../types';
import { formatAssetAmount } from '../lib/formatters';
import { CONTRACT_ADDRESSES, POOL_ADDRESSES } from '../constants';

interface LegacyClaimsProps {
  assets: Asset[];
  userBalances: UserBalance[];
  userSupplies: UserBalance[];
  userBorrows: UserBalance[];
  openModal: (type: ModalType, asset: Asset) => void;
}

const LegacyClaims: React.FC<LegacyClaimsProps> = ({ assets, userBalances, userSupplies, userBorrows, openModal }) => {
  const getLegacyNote = (asset: Asset, supplied: number, borrowed: number) => {
    if (borrowed > 0) {
      return 'Repay this legacy borrow before migrating to the replacement pool.';
    }

    if (supplied > 0) {
      return 'Withdraw this legacy supplied balance during the sunset window or later from this legacy page.';
    }

    return 'No active legacy balance for this asset.';
  };

  const legacyAssets = assets.filter(asset => {
    const supplied = userSupplies.find(s => s.assetId === asset.id)?.amount || 0;
    const borrowed = userBorrows.find(b => b.assetId === asset.id)?.amount || 0;
    return supplied > 0 || borrowed > 0;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-yellow-900/20 border border-yellow-600/40 rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-3">Legacy Pool Withdrawals</h1>
        <p className="text-yellow-100 text-sm leading-6">
          This legacy pool is in migration mode. Withdraw and repay remain available here during the sunset period. New supply and new borrow should move to the replacement pool after migration.
        </p>
        <p className="mt-3 text-sm text-arc-text-secondary leading-6">
          Yield visibility on the legacy deployment is limited because the old on-chain pool does not fully match the newer interest-rate model. Funds remain accessible, but the legacy page should be treated as a recovery and migration surface rather than a full active-yield interface.
        </p>
        <div className="mt-4 bg-red-900/20 border border-red-600/40 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-red-300 font-bold">APY</span>
            <div>
              <p className="text-sm font-semibold text-red-200">Legacy APY unavailable</p>
              <p className="text-sm text-red-100/90 leading-6 mt-1">
                The old deployed pool does not fully support the newer interest model and rate reads. Because of that mismatch, APY is intentionally hidden on this page instead of showing a potentially incorrect yield number.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 text-sm text-arc-text-secondary space-y-1">
          <p><span className="font-semibold text-white">Legacy pool address:</span> {POOL_ADDRESSES.legacy}</p>
          <p><span className="font-semibold text-white">Replacement pool:</span> {POOL_ADDRESSES.active || 'Not deployed yet'}</p>
          <p>
            <a
              href={`https://testnet.arcscan.app/address/${POOL_ADDRESSES.legacy}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-arc-accent-primary hover:underline"
            >
              View legacy contract on explorer
            </a>
          </p>
        </div>
      </div>

      {legacyAssets.length === 0 ? (
        <div className="bg-arc-dark-800 border border-arc-dark-700 rounded-xl p-8 text-center text-arc-text-secondary">
          No legacy positions found for this wallet.
        </div>
      ) : (
        <div className="bg-arc-dark-800 border border-arc-dark-700 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-arc-dark-700">
            <h2 className="text-xl font-bold">Legacy Positions</h2>
          </div>
          <div className="divide-y divide-arc-dark-700">
            {legacyAssets.map(asset => {
              const walletBalance = userBalances.find(b => b.assetId === asset.id)?.amount || 0;
              const supplied = userSupplies.find(s => s.assetId === asset.id)?.amount || 0;
              const borrowed = userBorrows.find(b => b.assetId === asset.id)?.amount || 0;
              const note = getLegacyNote(asset, supplied, borrowed);

              return (
                <div key={asset.id} className="p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-6">
                  <div>
                    <h3 className="font-bold text-lg">{asset.symbol}</h3>
                    <p className="text-sm text-arc-text-secondary">{asset.name}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-8 text-right flex-1">
                    <div>
                      <p className="text-xs text-arc-text-secondary uppercase">Wallet</p>
                      <p className="font-mono">{formatAssetAmount(walletBalance, asset)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-arc-text-secondary uppercase">Legacy Supply</p>
                      <p className="font-mono text-green-400">{formatAssetAmount(supplied, asset)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-arc-text-secondary uppercase">Legacy Borrow</p>
                      <p className="font-mono text-red-400">{formatAssetAmount(borrowed, asset)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openModal(ModalType.WITHDRAW, asset)}
                      disabled={supplied <= 0}
                      className="bg-arc-accent-primary hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-arc-dark-700 disabled:text-arc-text-secondary disabled:cursor-not-allowed"
                    >
                      Withdraw
                    </button>
                    <button
                      onClick={() => openModal(ModalType.REPAY, asset)}
                      disabled={borrowed <= 0}
                      className="bg-arc-dark-700 hover:bg-arc-dark-900 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Repay
                    </button>
                  </div>
                </div>
                <div className="text-sm text-yellow-200 bg-yellow-900/10 border border-yellow-600/20 rounded-lg px-4 py-3">
                  {note}
                </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LegacyClaims;
