import React from 'react';
import { Asset, UserBalance } from '../types';
import AssetRow from './AssetRow';

interface MarketProps {
    assets: Asset[];
    userBalances: UserBalance[];
    userSupplies: UserBalance[];
    userBorrows: UserBalance[];
    openModal: Function;
    legacyMode?: boolean;
}

const Market: React.FC<MarketProps> = ({ assets, userBalances, userSupplies, userBorrows, openModal, legacyMode = false }) => {
    return (
        <div className="space-y-12">
            {legacyMode && (
                <div className="bg-yellow-900/20 border border-yellow-600/40 rounded-xl p-5">
                    <p className="text-sm text-yellow-100">
                        Legacy sunset mode is active. New supply and borrow actions are disabled here. Use this period to withdraw supplied funds and repay open borrows before migration.
                    </p>
                </div>
            )}
            <MarketTable 
                title="Assets to Supply" 
                assets={assets}
                userBalances={userBalances}
                userSupplies={userSupplies}
                userBorrows={userBorrows}
                openModal={openModal}
                type="supply"
                legacyMode={legacyMode}
            />
            <MarketTable 
                title="Assets to Borrow" 
                assets={assets}
                userBalances={userBalances}
                userSupplies={userSupplies}
                userBorrows={userBorrows}
                openModal={openModal}
                type="borrow"
                legacyMode={legacyMode}
            />
        </div>
    );
};

interface MarketTableProps {
    title: string;
    assets: Asset[];
    userBalances: UserBalance[];
    userSupplies: UserBalance[];
    userBorrows: UserBalance[];
    openModal: Function;
    type: 'supply' | 'borrow';
    legacyMode?: boolean;
}

const MarketTable: React.FC<MarketTableProps> = ({ title, assets, userBalances, userSupplies, userBorrows, openModal, type, legacyMode = false }) => {
    // Filter assets based on type and enabled flags
    const filteredAssets = assets.filter(asset => {
        if (type === 'supply') return asset.lendingEnabled;
        if (type === 'borrow') return asset.borrowEnabled;
        return true;
    });

    return (
        <div className="bg-arc-dark-800 rounded-lg border border-arc-dark-700 overflow-hidden">
            <h2 className="text-xl font-bold p-6">{title}</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-arc-dark-700 text-arc-text-secondary text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4">Asset</th>
                            <th className="p-4 text-right">{type === 'supply' ? 'Supply APY' : 'Borrow APY'}</th>
                            <th className="p-4 text-right">Total Supplied</th>
                            <th className="p-4 text-right">Total Borrowed</th>
                            <th className="p-4 text-right">Available to Borrow</th>
                            <th className="p-4 text-right">Wallet Balance</th>
                            <th className="p-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-arc-dark-700">
                        {filteredAssets.map(asset => (
                            <AssetRow
                                key={asset.id}
                                asset={asset}
                                balance={userBalances.find(b => b.assetId === asset.id)?.amount || 0}
                                userSupplies={userSupplies}
                                userBorrows={userBorrows}
                                openModal={openModal}
                                isPosition={false}
                                type={type}
                                legacyMode={legacyMode}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Market;
