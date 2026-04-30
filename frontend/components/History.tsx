
import React from 'react';
import { Transaction, TransactionType } from '../types';
import { AssetIcon } from './AssetIcon';
import { formatAssetAmount } from '../lib/formatters';

interface HistoryProps {
    transactions: Transaction[];
}

function timeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 5) return "just now";
    
    let interval = seconds / 31536000;
    if (interval > 1) {
        const years = Math.floor(interval);
        return years + (years === 1 ? " year ago" : " years ago");
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        const months = Math.floor(interval);
        return months + (months === 1 ? " month ago" : " months ago");
    }
    interval = seconds / 86400;
    if (interval > 1) {
        const days = Math.floor(interval);
        return days + (days === 1 ? " day ago" : " days ago");
    }
    interval = seconds / 3600;
    if (interval > 1) {
        const hours = Math.floor(interval);
        return hours + (hours === 1 ? " hour ago" : " hours ago");
    }
    interval = seconds / 60;
    if (interval > 1) {
        const minutes = Math.floor(interval);
        return minutes + (minutes === 1 ? " minute ago" : " minutes ago");
    }
    return Math.floor(seconds) + " seconds ago";
}


const TransactionItem: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
    const { type, asset, amount, toAsset, toAmount, timestamp } = transaction;

    const renderTitle = () => {
        const formattedAmount = formatAssetAmount(amount, asset);
        switch (type) {
            case TransactionType.SUPPLY:
                return <p>Supplied {formattedAmount} <span className="font-bold">{asset.symbol}</span></p>;
            case TransactionType.WITHDRAW:
                return <p>Withdrew {formattedAmount} <span className="font-bold">{asset.symbol}</span></p>;
            case TransactionType.BORROW:
                return <p>Borrowed {formattedAmount} <span className="font-bold">{asset.symbol}</span></p>;
            case TransactionType.REPAY:
                return <p>Repaid {formattedAmount} <span className="font-bold">{asset.symbol}</span></p>;
            case TransactionType.SWAP:
                if (toAsset && typeof toAmount !== 'undefined') {
                    const formattedToAmount = formatAssetAmount(toAmount, toAsset);
                    return <p>Swapped {formattedAmount} <span className="font-bold">{asset.symbol}</span> for {formattedToAmount} <span className="font-bold">{toAsset.symbol}</span></p>;
                }
                return <p>Swap</p>;
            default:
                return null;
        }
    };

    return (
        <div className="bg-arc-dark-800 p-4 rounded-lg border border-arc-dark-700 flex items-center justify-between hover:bg-arc-dark-700/50 transition-colors">
            <div className="flex items-center space-x-4">
                <div className="relative flex items-center justify-center w-10 h-10">
                    <AssetIcon iconId={asset.icon} className="w-8 h-8 z-10" />
                    {toAsset && (
                        <AssetIcon iconId={toAsset.icon} className="w-8 h-8 absolute left-4 z-0" />
                    )}
                </div>
                <div>
                    <div className="font-semibold">{renderTitle()}</div>
                    <p className="text-sm text-arc-text-secondary">{timeAgo(timestamp)}</p>
                </div>
            </div>
             <div className="text-right">
                <p className="font-mono text-sm">{type === 'Swap' ? '-' : ''}{formatAssetAmount(amount, asset)} {asset.symbol}</p>
                 {toAsset && toAmount && <p className="font-mono text-sm text-green-400">+{formatAssetAmount(toAmount, toAsset)} {toAsset.symbol}</p>}
            </div>
        </div>
    );
};


const History: React.FC<HistoryProps> = ({ transactions }) => {
    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Transaction History</h1>
            {transactions.length === 0 ? (
                <div className="text-center py-16 bg-arc-dark-800 rounded-lg border border-arc-dark-700">
                    <p className="text-arc-text-secondary">You have no transaction history yet.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {transactions.map(tx => <TransactionItem key={tx.id} transaction={tx} />)}
                </div>
            )}
        </div>
    );
};

export default History;
