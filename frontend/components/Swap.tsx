
import React, { useState, useEffect, useRef } from 'react';
import { Asset, UserBalance } from '../types';
import { getSwapAmountOut } from '../services/contractService';
import { ethers } from 'ethers';

import { formatAssetAmount } from '../lib/formatters';

interface SwapProps {
    assets: Asset[];
    userBalances: UserBalance[];
    onSwap: (fromAsset: Asset, toAsset: Asset, fromAmount: number) => void;
    isLoading?: boolean;
}

const getAssetDecimals = (asset?: Asset) => {
    if (!asset?.contractAddress) {
        return 18;
    }

    if (asset.contractAddress === '0x27488Db1F8F9529B5820De984262179Ad913798E') {
        return 8;
    }

    if (asset.contractAddress === '0x3600000000000000000000000000000000000000' || asset.contractAddress === '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a') {
        return 6;
    }

    return 18;
};

const Swap: React.FC<SwapProps> = ({ assets, userBalances, onSwap, isLoading = false }) => {
    const swappableAssets = assets.filter(asset => asset.id === 'usdc' || asset.id === 'eurc');
    const quoteRequestIdRef = useRef(0);
    
    const [fromAssetId, setFromAssetId] = useState<string>('usdc');
    const [toAssetId, setToAssetId] = useState<string>('eurc');
    const [fromAmount, setFromAmount] = useState<string>('');
    const [toAmount, setToAmount] = useState<string>('');
    
    const fromAsset = assets.find(a => a.id === fromAssetId);
    const toAsset = assets.find(a => a.id === toAssetId);
    const fromBalance = userBalances.find(b => b.assetId === fromAssetId)?.amount || 0;
    const toBalance = userBalances.find(b => b.assetId === toAssetId)?.amount || 0;

    useEffect(() => {
        const requestId = ++quoteRequestIdRef.current;

        if (!fromAsset || !toAsset || !fromAmount) {
            setToAmount('');
            return;
        }

        const amount = parseFloat(fromAmount);
        if (isNaN(amount) || amount <= 0) {
            setToAmount('');
            return;
        }

        getSwapAmountOut(fromAsset.contractAddress!, toAsset.contractAddress!, fromAmount)
            .then(amountOutWei => {
                if (quoteRequestIdRef.current !== requestId) {
                    return;
                }

                const outDecimals = getAssetDecimals(toAsset);
                const formatted = parseFloat(ethers.formatUnits(amountOutWei, outDecimals));
                setToAmount(formatAssetAmount(formatted, toAsset));
            })
            .catch(error => {
                if (quoteRequestIdRef.current !== requestId) {
                    return;
                }

                console.error('Error calculating swap amount:', error);
                setToAmount('');
            });
    }, [fromAmount, fromAsset, toAsset]);
    
    const handleSwapAssets = () => {
        setFromAmount('');
        setToAmount('');
        setFromAssetId(toAssetId);
        setToAssetId(fromAssetId);
    };
    
    const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^\d*\.?\d*$/.test(value)) {
            setFromAmount(value);
        }
    }
    
    const handleMax = () => {
        setFromAmount(formatAssetAmount(fromBalance, fromAsset));
    }
    
    const handleSubmit = () => {
        if(fromAsset && toAsset && fromAmount) {
            onSwap(fromAsset, toAsset, parseFloat(fromAmount));
        }
    }

    return (
        <div className="max-w-md mx-auto bg-arc-dark-800 p-6 rounded-xl border border-arc-dark-700 space-y-4">
            <h2 className="text-xl font-bold text-center">Swap</h2>

            <SwapInput
                label="From"
                assetId={fromAssetId}
                setAssetId={setFromAssetId}
                amount={fromAmount}
                setAmount={handleFromAmountChange}
                assets={swappableAssets}
                balance={fromBalance}
                onMax={handleMax}
            />

            <div className="flex justify-center">
                <button onClick={handleSwapAssets} className="p-2 bg-arc-dark-700 rounded-full hover:bg-arc-dark-900 transition-transform transform hover:rotate-180">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            <SwapInput
                label="To"
                assetId={toAssetId}
                setAssetId={setToAssetId}
                amount={toAmount}
                assets={swappableAssets}
                balance={toBalance}
                isReadOnly={true}
            />
            
            {fromAsset && toAsset && toAmount && <p className="text-sm text-center text-arc-text-secondary">1 {fromAsset.symbol} ≈ {formatAssetAmount(parseFloat(toAmount) / parseFloat(fromAmount || '1'), toAsset)} {toAsset.symbol}</p>}

            <button
                onClick={handleSubmit}
                disabled={!fromAmount || !fromAsset || !toAsset || parseFloat(fromAmount) <= 0 || parseFloat(fromAmount) > fromBalance || isLoading}
                className="w-full bg-arc-accent-primary text-white font-bold py-3 rounded-lg disabled:bg-arc-dark-700 disabled:text-arc-text-secondary disabled:cursor-not-allowed hover:bg-opacity-80 transition-colors"
            >
                {isLoading ? 'Swapping...' : 'Swap'}
            </button>
        </div>
    );
};


interface SwapInputProps {
    label: string;
    assetId: string;
    setAssetId?: (id: string) => void;
    amount: string;
    setAmount?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    assets: Asset[];
    balance?: number;
    onMax?: () => void;
    isReadOnly?: boolean;
}

const SwapInput: React.FC<SwapInputProps> = ({ label, assetId, setAssetId, amount, setAmount, assets, balance, onMax, isReadOnly = false}) => {
    const selectedAsset = assets.find(a => a.id === assetId);

    return (
        <div className="bg-arc-dark-900 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-arc-text-secondary">{label}</span>
                {balance !== undefined && <span className="text-xs text-arc-text-secondary">Balance: {formatAssetAmount(balance, selectedAsset)}</span>}
            </div>
            <div className="flex justify-between items-center">
                <input 
                    type="text" 
                    value={amount}
                    onChange={setAmount}
                    readOnly={isReadOnly}
                    placeholder="0.0"
                    className="bg-transparent text-2xl w-full focus:outline-none"
                />
                <div className="flex items-center space-x-2">
                    {onMax && <button onClick={onMax} className="text-xs bg-arc-accent-primary/20 text-arc-accent-primary px-2 py-1 rounded">MAX</button>}
                    {setAssetId ? (
                        <select 
                            value={assetId}
                            onChange={(e) => setAssetId(e.target.value)}
                            className="bg-arc-dark-700 p-2 rounded-md px-3 text-sm font-semibold focus:outline-none"
                        >
                            {assets.map(asset => (
                                <option key={asset.id} value={asset.id}>{asset.symbol}</option>
                            ))}
                        </select>
                    ) : (
                        <div className="bg-arc-dark-700 p-2 rounded-md px-3 text-sm font-semibold">
                            {selectedAsset?.symbol || 'N/A'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


export default Swap;
