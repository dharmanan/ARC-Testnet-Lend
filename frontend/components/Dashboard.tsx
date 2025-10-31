
import React from 'react';
import { Asset, UserBalance } from '../types';
import AssetRow from './AssetRow';

interface DashboardProps {
    assets: Asset[];
    userSupplies: UserBalance[];
    userBorrows: UserBalance[];
    openModal: Function;
}

const Dashboard: React.FC<DashboardProps> = ({ assets, userSupplies, userBorrows, openModal }) => {
    // FIX: Explicitly type assetMap to ensure correct type inference.
    const assetMap: Map<string, Asset> = new Map(assets.map(a => [a.id, a]));

    const totalSuppliedUSD = userSupplies.reduce((acc, { assetId, amount }) => {
        const asset = assetMap.get(assetId);
        return acc + (asset ? asset.priceUSD * amount : 0);
    }, 0);

    const totalBorrowedUSD = userBorrows.reduce((acc, { assetId, amount }) => {
        const asset = assetMap.get(assetId);
        return acc + (asset ? asset.priceUSD * amount : 0);
    }, 0);
    
    const collateralValue = userSupplies.reduce((acc, {assetId, amount}) => {
        const asset = assetMap.get(assetId);
        if (asset && asset.isCollateral) {
            return acc + (asset.priceUSD * amount * asset.liquidationThreshold);
        }
        return acc;
    }, 0);

    const healthFactor = totalBorrowedUSD > 0 ? collateralValue / totalBorrowedUSD : Infinity;
    
    const netWorth = totalSuppliedUSD - totalBorrowedUSD;
    
    const suppliedAssets = userSupplies.map(s => assetMap.get(s.assetId)).filter(Boolean) as Asset[];
    const borrowedAssets = userBorrows.map(b => assetMap.get(b.assetId)).filter(Boolean) as Asset[];

    // Calculate Net APY: (supply earnings - borrow costs) / total position value
    const supplyEarnings = userSupplies.reduce((acc, { assetId, amount }) => {
        const asset = assetMap.get(assetId);
        return acc + (asset ? (asset.supplyApy / 100) * asset.priceUSD * amount : 0);
    }, 0);

    const borrowCosts = userBorrows.reduce((acc, { assetId, amount }) => {
        const asset = assetMap.get(assetId);
        return acc + (asset ? (asset.borrowApy / 100) * asset.priceUSD * amount : 0);
    }, 0);

    const netApy = totalSuppliedUSD > 0 ? ((supplyEarnings - borrowCosts) / totalSuppliedUSD) * 100 : 0;

    // Calculate daily earnings/costs
    const dailySupplyEarnings = supplyEarnings / 365;
    const dailyBorrowCosts = borrowCosts / 365;
    const netDailyEarnings = dailySupplyEarnings - dailyBorrowCosts;

    const formatCurrency = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const getHealthFactorColor = (hf: number) => {
        if (hf > 2) return 'text-green-400';
        if (hf > 1.2) return 'text-yellow-400';
        return 'text-red-500';
    };

    const getHealthBarColor = (hf: number) => {
        if (hf === Infinity || hf > 2) return 'bg-green-500';
        if (hf > 1.2) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getHealthBarWidth = (hf: number) => {
        if (hf === Infinity) return 100;
        // Scale so that HF of 2.5 is 100%. Cap at 100%.
        return Math.min((hf / 2.5) * 100, 100);
    };


    return (
        <div className="space-y-8">
            {/* Info Banner */}
            <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-600/50 p-4 rounded-lg">
                <p className="text-sm text-yellow-400">
                    <span className="font-bold">ℹ️ Note:</span> Daily Earnings shown are estimated based on current APY rates. 
                    Actual interest claim functionality is coming in the next contract upgrade.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                <div className="bg-arc-dark-800 p-6 rounded-lg border border-arc-dark-700">
                    <h3 className="text-arc-text-secondary text-sm">Net Worth</h3>
                    <p className="text-3xl font-bold">{formatCurrency(netWorth)}</p>
                </div>
                <div className="bg-arc-dark-800 p-6 rounded-lg border border-arc-dark-700">
                    <h3 className="text-arc-text-secondary text-sm">Daily Earnings</h3>
                    <p className={`text-3xl font-bold ${netDailyEarnings >= 0 ? 'text-green-400' : 'text-red-400'}`}>{netDailyEarnings >= 0 ? '+' : ''}{formatCurrency(netDailyEarnings)}</p>
                    <p className="text-xs text-yellow-400 mt-2">⚠️ Estimated - Claim feature coming soon</p>
                </div>
                <div className="bg-arc-dark-800 p-6 rounded-lg border border-arc-dark-700">
                    <h3 className="text-arc-text-secondary text-sm">Total Borrowed</h3>
                    <p className="text-3xl font-bold text-red-400">{formatCurrency(totalBorrowedUSD)}</p>
                </div>
                <div className="bg-arc-dark-800 p-6 rounded-lg border border-arc-dark-700">
                    <h3 className="text-arc-text-secondary text-sm">Available to Borrow</h3>
                    <p className="text-3xl font-bold text-green-400">{formatCurrency(Math.max(0, collateralValue - totalBorrowedUSD))}</p>
                </div>
                <div className="bg-arc-dark-800 p-6 rounded-lg border border-arc-dark-700">
                    <h3 className="text-arc-text-secondary text-sm">Health Factor</h3>
                    <p className={`text-3xl font-bold ${getHealthFactorColor(healthFactor)}`}>{healthFactor === Infinity ? '∞' : healthFactor.toFixed(2)}</p>
                     <div className="mt-2">
                        <div className="w-full bg-arc-dark-900 rounded-full h-2.5">
                            <div
                                className={`h-2.5 rounded-full ${getHealthBarColor(healthFactor)}`}
                                style={{ width: `${getHealthBarWidth(healthFactor)}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="h-4 mt-2 text-xs">
                        {healthFactor < 1 && healthFactor !== Infinity && (
                            <p className="text-red-500 font-bold animate-pulse">
                                CRITICAL: Liquidation risk imminent.
                            </p>
                        )}
                        {healthFactor >= 1 && healthFactor < 1.2 && (
                            <p className="text-yellow-500">
                                Liquidation risk is high.
                            </p>
                        )}
                    </div>
                </div>
                <div className="bg-arc-dark-800 p-6 rounded-lg border border-arc-dark-700">
                    <h3 className="text-arc-text-secondary text-sm">Net APY</h3>
                    <p className={`text-3xl font-bold ${netApy >= 0 ? 'text-green-400' : 'text-red-400'}`}>{netApy >= 0 ? '+' : ''}{netApy.toFixed(2)}%</p>
                </div>
            </div>
            
            <div className="space-y-6">
                <PositionTable title="Your Supplies" assets={suppliedAssets} positions={userSupplies} openModal={openModal} type="supply" />
                <PositionTable title="Your Borrows" assets={borrowedAssets} positions={userBorrows} openModal={openModal} type="borrow" />
            </div>
        </div>
    );
};

interface PositionTableProps {
    title: string;
    assets: Asset[];
    positions: UserBalance[];
    openModal: Function;
    type: 'supply' | 'borrow';
}

const PositionTable: React.FC<PositionTableProps> = ({ title, assets, positions, openModal, type }) => {
    if (assets.length === 0) return null;
    
    return (
        <div className="bg-arc-dark-800 rounded-lg border border-arc-dark-700 overflow-hidden">
            <h2 className="text-xl font-bold p-6">{title}</h2>
            <table className="w-full text-left">
                <thead className="bg-arc-dark-700 text-arc-text-secondary text-xs uppercase tracking-wider">
                    <tr>
                        <th className="p-4">Asset</th>
                        <th className="p-4 text-right">Balance</th>
                        <th className="p-4 text-right">Daily Earnings</th>
                        <th className="p-4 text-right">APY</th>
                        <th className="p-4 text-center">Collateral</th>
                        <th className="p-4"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-arc-dark-700">
                    {assets.map(asset => (
                        <AssetRow
                            key={asset.id}
                            asset={asset}
                            balance={positions.find(p => p.assetId === asset.id)?.amount || 0}
                            openModal={openModal}
                            isPosition={true}
                            type={type}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Dashboard;