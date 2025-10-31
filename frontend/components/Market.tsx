
import React from 'react';
import { Asset, UserBalance } from '../types';
import AssetRow from './AssetRow';

interface MarketProps {
    assets: Asset[];
    userBalances: UserBalance[];
    userSupplies: UserBalance[];
    userBorrows: UserBalance[];
    openModal: Function;
}

const Market: React.FC<MarketProps> = ({ assets, userBalances, userSupplies, userBorrows, openModal }) => {
    return (
        <div className="space-y-12">
            <MarketTable 
                title="Assets to Supply" 
                assets={assets}
                userBalances={userBalances}
                userSupplies={userSupplies}
                userBorrows={userBorrows}
                openModal={openModal}
                type="supply"
            />
            <MarketTable 
                title="Assets to Borrow" 
                assets={assets}
                userBalances={userBalances}
                userSupplies={userSupplies}
                userBorrows={userBorrows}
                openModal={openModal}
                type="borrow"
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
}

const MarketTable: React.FC<MarketTableProps> = ({ title, assets, userBalances, userSupplies, userBorrows, openModal, type }) => {
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
                        {assets.map(asset => (
                            <AssetRow
                                key={asset.id}
                                asset={asset}
                                balance={userBalances.find(b => b.assetId === asset.id)?.amount || 0}
                                userSupplies={userSupplies}
                                userBorrows={userBorrows}
                                openModal={openModal}
                                isPosition={false}
                                type={type}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Market;
