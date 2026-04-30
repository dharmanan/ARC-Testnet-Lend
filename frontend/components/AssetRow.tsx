import React from 'react';
import { Asset, ModalType, UserBalance } from '../types';
import { AssetIcon } from './AssetIcon';
import { formatAssetAmount } from '../lib/formatters';

interface AssetRowProps {
    asset: Asset;
    balance: number;
    userSupplies?: UserBalance[];
    userBorrows?: UserBalance[];
    openModal: Function;
    isPosition: boolean;
    type: 'supply' | 'borrow';
    legacyMode?: boolean;
}

const AssetRow: React.FC<AssetRowProps> = ({ asset, balance, userSupplies, userBorrows, openModal, isPosition, type, legacyMode = false }) => {
    const formatNumber = (num: number) => {
        if (num > 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
        if (num > 1_000) return `${(num / 1_000).toFixed(2)}K`;
        return num.toFixed(2);
    };

    const formatCurrency = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Get user's supply/borrow amounts for this asset
    const userSupplyAmount = userSupplies?.find(s => s.assetId === asset.id)?.amount || 0;
    const userBorrowAmount = userBorrows?.find(b => b.assetId === asset.id)?.amount || 0;
    const availableToBorrow = Math.max(0, asset.totalSupplied - asset.totalBorrowed);

    // Calculate daily earnings/costs for this position
    const apy = type === 'supply' ? asset.supplyApy : asset.borrowApy;
    const dailyRate = (apy / 100) / 365;
    const dailyEarnings = balance * asset.priceUSD * dailyRate;
    const isPositive = type === 'supply';

    if (isPosition) {
        // This is for Dashboard view
        return (
            <tr className="hover:bg-arc-dark-700/50">
                <td className="p-4">
                    <div className="flex items-center space-x-4">
                        <AssetIcon iconId={asset.icon} className="w-8 h-8" />
                        <div>
                            <div className="font-bold">{asset.symbol}</div>
                            <div className="text-xs text-arc-text-secondary">{asset.name}</div>
                        </div>
                    </div>
                </td>
                <td className="p-4 text-right font-mono">
                    <div>{formatAssetAmount(balance, asset)}</div>
                    <div className="text-xs text-arc-text-secondary">{formatCurrency(balance * asset.priceUSD)}</div>
                </td>
                <td className="p-4 text-right font-mono">
                    <div className={`${isPositive ? 'text-green-400' : 'text-red-400'}`}>{isPositive ? '+' : '-'}{formatCurrency(Math.abs(dailyEarnings))}</div>
                    <div className="text-xs text-arc-text-secondary">daily</div>
                </td>
                <td className="p-4 text-right font-mono text-green-400">{type === 'supply' ? asset.supplyApy.toFixed(2) : asset.borrowApy.toFixed(2)}%</td>
                <td className="p-4 text-center">{type === 'supply' && (asset.isCollateral ? '✅' : '❌')}</td>
                <td className="p-4 text-right">
                    <div className="flex justify-end space-x-2">
                         <button onClick={() => openModal(type === 'supply' ? ModalType.WITHDRAW : ModalType.REPAY, asset)} className="bg-arc-dark-700 hover:bg-arc-dark-900 text-xs font-bold py-2 px-3 rounded-md transition-colors">{type === 'supply' ? 'Withdraw' : 'Repay'}</button>
                        {!legacyMode ? (
                            <button onClick={() => openModal(type === 'supply' ? ModalType.SUPPLY : ModalType.BORROW, asset)} className="bg-arc-accent-primary hover:bg-opacity-80 text-white text-xs font-bold py-2 px-3 rounded-md transition-colors">{type === 'supply' ? 'Supply' : 'Borrow'}</button>
                        ) : (
                            <span className="text-xs text-yellow-300 px-2 py-2">Disabled in legacy mode</span>
                        )}
                    </div>
                </td>
            </tr>
        );
    }
    
    // This is for Market view
    return (
        <tr className="hover:bg-arc-dark-700/50">
            <td className="p-4">
                <div className="flex items-center space-x-4">
                    <AssetIcon iconId={asset.icon} className="w-8 h-8" />
                    <div>
                        <div className="font-bold">{asset.symbol}</div>
                        <div className="text-xs text-arc-text-secondary">{asset.name}</div>
                    </div>
                </div>
            </td>
            <td className="p-4 text-right font-mono text-green-400">{type === 'supply' ? asset.supplyApy.toFixed(2) : asset.borrowApy.toFixed(2)}%</td>
            <td className="p-4 text-right font-mono">{formatCurrency(asset.totalSupplied * asset.priceUSD)}</td>
            <td className="p-4 text-right font-mono">{formatCurrency(asset.totalBorrowed * asset.priceUSD)}</td>
            <td className="p-4 text-right font-mono text-green-400">{formatCurrency(availableToBorrow * asset.priceUSD)}</td>
            <td className="p-4 text-right font-mono">
                <div>{formatAssetAmount(balance, asset)}</div>
                {userSupplyAmount > 0 && <div className="text-xs text-green-400">+{formatAssetAmount(userSupplyAmount, asset)} supplied</div>}
                {userBorrowAmount > 0 && <div className="text-xs text-red-400">-{formatAssetAmount(userBorrowAmount, asset)} borrowed</div>}
            </td>
            <td className="p-4 text-right">
                {legacyMode ? (
                    <span className="text-xs text-yellow-300">Disabled in legacy mode</span>
                ) : (
                    <button onClick={() => openModal(type === 'supply' ? ModalType.SUPPLY : ModalType.BORROW, asset)} className="bg-arc-accent-primary hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-md transition-colors">{type === 'supply' ? 'Supply' : 'Borrow'}</button>
                )}
            </td>
        </tr>
    );
};

export default AssetRow;