
import React, { useState } from 'react';
import { Asset, ModalType } from '../types';
import { formatAssetAmount, getAssetDisplayDecimals } from '../lib/formatters';

const getAssetDecimals = (asset: Asset) => {
    if (asset.symbol === 'WBTC') {
        return 8;
    }

    if (asset.symbol === 'USDC' || asset.symbol === 'EURC') {
        return 6;
    }

    return 18;
};

interface InteractionModalProps {
    isOpen: boolean;
    onClose: () => void;
    asset: Asset;
    modalType: ModalType;
    userWalletBalance: number;
    userSupplyBalance: number;
    userBorrowBalance: number;
    onSubmit: (asset: Asset, amount: number, type: ModalType) => Promise<void> | void;
    availableBorrowUSD: number;
    isLoading?: boolean;
}

const InteractionModal: React.FC<InteractionModalProps> = ({
    isOpen,
    onClose,
    asset,
    modalType,
    userWalletBalance,
    userSupplyBalance,
    userBorrowBalance,
    onSubmit,
    availableBorrowUSD,
    isLoading = false,
}) => {
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getInputPrecision = () => getAssetDisplayDecimals(asset);

    const clampAmount = (value: number) => {
        if (!Number.isFinite(value) || value <= 0) {
            return 0;
        }

        const factor = 10 ** getInputPrecision();
        return Math.floor(value * factor) / factor;
    };

    const formatAmount = (value: number) => {
        const clamped = clampAmount(value);
        const precision = getInputPrecision();

        if (clamped === 0) {
            return '0';
        }

        return clamped.toFixed(precision).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
    };

    if (!isOpen) return null;

    const getTitle = () => {
        switch (modalType) {
            case ModalType.SUPPLY: return `Supply ${asset.symbol}`;
            case ModalType.WITHDRAW: return `Withdraw ${asset.symbol}`;
            case ModalType.BORROW: return `Borrow ${asset.symbol}`;
            case ModalType.REPAY: return `Repay ${asset.symbol}`;
        }
    };

    const getMaxAmount = () => {
        let max = 0;
        switch (modalType) {
            case ModalType.SUPPLY:
                max = userWalletBalance;
                break;
            case ModalType.WITHDRAW:
                // Withdraw is limited by both user supply and current pool liquidity.
                max = Math.min(userSupplyBalance, Math.max(0, asset.totalSupplied - asset.totalBorrowed));
                break;
            case ModalType.BORROW:
                if (asset.priceUSD <= 0) return 0;

                // Available borrow in USD, convert to asset amount
                const availableBorrowInAsset = availableBorrowUSD / asset.priceUSD;

                // Pool liquidity limit: total supplied - total borrowed
                const poolLiquidityLimit = Math.max(0, asset.totalSupplied - asset.totalBorrowed);

                // Take the minimum of both limits
                max = clampAmount(Math.min(Math.max(0, availableBorrowInAsset), poolLiquidityLimit));
                break;
            case ModalType.REPAY:
                max = Math.min(userWalletBalance, userBorrowBalance);
                break;
        }
        return clampAmount(max);
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^\d*\.?\d*$/.test(value)) {
            setAmount(value);
        }
    };
    
    const handleSetMax = () => {
        if (isLoading || isSubmitting) {
            return;
        }

        setAmount(formatAmount(getMaxAmount()));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        try {
            await Promise.resolve(onSubmit(asset, parseFloat(amount), modalType));
        } finally {
            setIsSubmitting(false);
        }
    };

    const getButtonText = () => {
        switch (modalType) {
            case ModalType.SUPPLY: return 'Supply';
            case ModalType.WITHDRAW: return 'Withdraw';
            case ModalType.BORROW: return 'Borrow';
            case ModalType.REPAY: return 'Repay';
        }
    }
    
    const maxAmount = getMaxAmount();
    const maxAmountDisplay = formatAmount(maxAmount);
    const amountNum = parseFloat(amount);
    const isAmountInvalid = isNaN(amountNum) || amountNum <= 0 || amountNum > maxAmount;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity">
            <div className="bg-arc-dark-800 rounded-lg border border-arc-dark-700 w-full max-w-md m-4">
                <div className="flex justify-between items-center p-6 border-b border-arc-dark-700">
                    <div>
                        <h2 className="text-xl font-bold">{getTitle()}</h2>
                        {modalType === ModalType.WITHDRAW && (
                            <p className="mt-1 text-xs text-arc-text-secondary">
                                Pool Total: {formatAssetAmount(asset.totalSupplied, asset)} {asset.symbol}
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} disabled={isLoading || isSubmitting} className="text-arc-text-secondary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <div className="flex justify-between items-baseline">
                            <label className="text-sm text-arc-text-secondary">Amount</label>
                            <span className="text-xs text-arc-text-secondary">Available: {maxAmountDisplay} {asset.symbol}</span>
                        </div>
                        <div className="relative mt-1">
                            <input
                                type="text"
                                value={amount}
                                onChange={handleAmountChange}
                                readOnly={isLoading || isSubmitting}
                                placeholder="0.0"
                                className="w-full bg-arc-dark-900 border border-arc-dark-700 rounded-md p-3 focus:ring-2 focus:ring-arc-accent-primary focus:outline-none"
                            />
                            <button type="button" onClick={handleSetMax} disabled={isLoading || isSubmitting} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-arc-accent-primary/20 text-arc-accent-primary px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed">MAX</button>
                        </div>
                    </div>

                    <div className="text-sm space-y-2 text-arc-text-secondary">
                         <div className="flex justify-between"><span>Wallet Balance</span> <span>{formatAssetAmount(userWalletBalance, asset)} {asset.symbol}</span></div>
                         <div className="flex justify-between"><span>Supply Balance</span> <span>{formatAssetAmount(userSupplyBalance, asset)} {asset.symbol}</span></div>
                        {modalType === ModalType.WITHDRAW && (
                           <div className="flex justify-between"><span>Withdrawable Now</span> <span>{maxAmountDisplay} {asset.symbol}</span></div>
                        )}
                         <div className="flex justify-between"><span>Borrow Balance</span> <span>{formatAssetAmount(userBorrowBalance, asset)} {asset.symbol}</span></div>
                    </div>
                    
                    {/* Network Fee Alert Banner */}
                    <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
                        <div className="flex items-start space-x-2">
                            <span className="text-yellow-400 text-sm">⚠️</span>
                            <div className="text-xs text-yellow-200">
                                <span className="font-bold">Network Fee Alert:</span> MetaMask may show a red warning during transaction approval. This is normal - it means MetaMask is verifying the network fee. Wait 10-15 seconds and it will disappear automatically. Then click "Confirm" to complete your transaction.
                            </div>
                        </div>
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isAmountInvalid || isLoading || isSubmitting}
                        className="w-full bg-arc-accent-primary text-white font-bold py-3 rounded-lg disabled:bg-arc-dark-700 disabled:text-arc-text-secondary disabled:cursor-not-allowed hover:bg-opacity-80 transition-colors"
                    >
                        {isLoading || isSubmitting ? 'Processing...' : getButtonText()}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default InteractionModal;
