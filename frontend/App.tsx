
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { useAccount, useWalletClient } from 'wagmi';

import { Asset, UserBalance, ModalType, Transaction, TransactionType } from './types';
import { ASSETS } from './constants';
import { getTokenBalance, getPoolBalance, depositToPool, withdrawFromPool, borrowFromPool, repayToPool, getBorrowBalance, getPoolTotalSupplied, getPoolTotalBorrowed, getSupplyAPY, getBorrowAPR, getAccountLiquidity, getMaxBorrowable, swapTokens, getSwapAmountOut, syncWalletClient } from './services/contractService';
import { CONTRACT_ADDRESSES } from './constants';
import { formatAssetAmount } from './lib/formatters';
import { arcTestnet } from './lib/chains';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Market from './components/Market';
import Swap from './components/Swap';
import InteractionModal from './components/InteractionModal';
import History from './components/History';
import LegacyClaims from './components/LegacyClaims';

const LEGACY_SUNSET_END = new Date('2026-05-15T23:59:59Z').getTime();

const formatCountdown = (msRemaining: number) => {
    if (msRemaining <= 0) {
        return 'Legacy sunset window has ended';
    }

    const totalSeconds = Math.floor(msRemaining / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

type ActiveView = 'dashboard' | 'market' | 'swap' | 'history' | 'legacy';

const EMPTY_BALANCES: UserBalance[] = [
    { assetId: 'eth', amount: 0 },
    { assetId: 'usdc', amount: 0 },
    { assetId: 'wbtc', amount: 0 },
    { assetId: 'eurc', amount: 0 },
    { assetId: 'arc', amount: 0 },
];

const getContractDecimals = (contractAddress?: string) => {
    if (contractAddress === CONTRACT_ADDRESSES.wbtc) {
        return 8;
    }

    if (contractAddress === CONTRACT_ADDRESSES.usdc || contractAddress === CONTRACT_ADDRESSES.eurc) {
        return 6;
    }

    return 18;
};

const App: React.FC = () => {
    const [activeView, setActiveView] = useState<ActiveView>('market');
    const { address, chainId } = useAccount();
    const { data: walletClient } = useWalletClient();

    const walletAddress = chainId === arcTestnet.id ? address ?? null : null;
    const hasConnectedWallet = Boolean(address);
    const isSupportedChain = chainId === undefined || chainId === arcTestnet.id;
    const previousAddressRef = useRef<string | null>(null);
    const transactionInFlightRef = useRef(false);

    const [assets, setAssets] = useState<Asset[]>(ASSETS);
    const [userBalances, setUserBalances] = useState<UserBalance[]>(EMPTY_BALANCES);
    const [userSupplies, setUserSupplies] = useState<UserBalance[]>([]);
    const [userBorrows, setUserBorrows] = useState<UserBalance[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        type: ModalType | null;
        asset: Asset | null;
    }>({ isOpen: false, type: null, asset: null });

    const [successModal, setSuccessModal] = useState<{
        isOpen: boolean;
        message: string;
    }>({ isOpen: false, message: '' });

    const [isTransactionLoading, setIsTransactionLoading] = useState(false);
    const [accountLiquidity, setAccountLiquidity] = useState<{ collateralValue: number; borrowValue: number }>({ collateralValue: 0, borrowValue: 0 });
    const [maxBorrowableUSD, setMaxBorrowableUSD] = useState(0);
    const [legacyCountdown, setLegacyCountdown] = useState(() => formatCountdown(LEGACY_SUNSET_END - Date.now()));
    const isLegacyMode = true;

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setLegacyCountdown(formatCountdown(LEGACY_SUNSET_END - Date.now()));
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, []);

    const resetPortfolioState = () => {
        setUserBalances(EMPTY_BALANCES);
        setUserSupplies([]);
        setUserBorrows([]);
        setTransactions([]);
        setModalState({ isOpen: false, type: null, asset: null });
        setSuccessModal({ isOpen: false, message: '' });
        setIsTransactionLoading(false);
        transactionInFlightRef.current = false;
        setAccountLiquidity({ collateralValue: 0, borrowValue: 0 });
        setMaxBorrowableUSD(0);
    };

    const loadTotalSupplies = async () => {
        try {
            const [
                usdcPoolTotalSupplied,
                eurcPoolTotalSupplied,
                ethPoolTotalSupplied,
                wbtcPoolTotalSupplied,
                arcPoolTotalSupplied,
                usdcPoolTotalBorrowed,
                eurcPoolTotalBorrowed,
                ethPoolTotalBorrowed,
                wbtcPoolTotalBorrowed,
                arcPoolTotalBorrowed,
                usdcSupplyApy,
                eurcSupplyApy,
                ethSupplyApy,
                wbtcSupplyApy,
                arcSupplyApy,
                usdcBorrowApy,
                eurcBorrowApy,
                ethBorrowApy,
                wbtcBorrowApy,
                arcBorrowApy,
            ] = await Promise.all([
                getPoolTotalSupplied(CONTRACT_ADDRESSES.usdc),
                getPoolTotalSupplied(CONTRACT_ADDRESSES.eurc),
                getPoolTotalSupplied(CONTRACT_ADDRESSES.eth),
                getPoolTotalSupplied(CONTRACT_ADDRESSES.wbtc),
                getPoolTotalSupplied(CONTRACT_ADDRESSES.arc),
                getPoolTotalBorrowed(CONTRACT_ADDRESSES.usdc),
                getPoolTotalBorrowed(CONTRACT_ADDRESSES.eurc),
                getPoolTotalBorrowed(CONTRACT_ADDRESSES.eth),
                getPoolTotalBorrowed(CONTRACT_ADDRESSES.wbtc),
                getPoolTotalBorrowed(CONTRACT_ADDRESSES.arc),
                getSupplyAPY(CONTRACT_ADDRESSES.usdc),
                getSupplyAPY(CONTRACT_ADDRESSES.eurc),
                getSupplyAPY(CONTRACT_ADDRESSES.eth),
                getSupplyAPY(CONTRACT_ADDRESSES.wbtc),
                getSupplyAPY(CONTRACT_ADDRESSES.arc),
                getBorrowAPR(CONTRACT_ADDRESSES.usdc),
                getBorrowAPR(CONTRACT_ADDRESSES.eurc),
                getBorrowAPR(CONTRACT_ADDRESSES.eth),
                getBorrowAPR(CONTRACT_ADDRESSES.wbtc),
                getBorrowAPR(CONTRACT_ADDRESSES.arc),
            ]);

            setAssets(prevAssets => prevAssets.map(asset => {
                if (asset.id === 'usdc') {
                    return { ...asset, totalSupplied: parseFloat(usdcPoolTotalSupplied) || 0, totalBorrowed: parseFloat(usdcPoolTotalBorrowed) || 0, supplyApy: usdcSupplyApy, borrowApy: usdcBorrowApy };
                } else if (asset.id === 'eurc') {
                    return { ...asset, totalSupplied: parseFloat(eurcPoolTotalSupplied) || 0, totalBorrowed: parseFloat(eurcPoolTotalBorrowed) || 0, supplyApy: eurcSupplyApy, borrowApy: eurcBorrowApy };
                } else if (asset.id === 'eth') {
                    return { ...asset, totalSupplied: parseFloat(ethPoolTotalSupplied) || 0, totalBorrowed: parseFloat(ethPoolTotalBorrowed) || 0, supplyApy: ethSupplyApy, borrowApy: ethBorrowApy };
                } else if (asset.id === 'wbtc') {
                    return { ...asset, totalSupplied: parseFloat(wbtcPoolTotalSupplied) || 0, totalBorrowed: parseFloat(wbtcPoolTotalBorrowed) || 0, supplyApy: wbtcSupplyApy, borrowApy: wbtcBorrowApy };
                } else if (asset.id === 'arc') {
                    return { ...asset, totalSupplied: parseFloat(arcPoolTotalSupplied) || 0, totalBorrowed: parseFloat(arcPoolTotalBorrowed) || 0, supplyApy: arcSupplyApy, borrowApy: arcBorrowApy };
                }
                return asset;
            }));
        } catch (error) {
            console.error('Error loading total supplies:', error);
        }
    };

    const assetsWithDynamicApys = useMemo(() => assets, [assets]);

    useEffect(() => {
        void loadTotalSupplies();
    }, []);

    const loadWalletData = async (nextWalletAddress: string) => {
        try {
            const [usdcBal, eurcBal, ethBal, wbtcBal, arcBal, usdcPoolBal, eurcPoolBal, ethPoolBal, wbtcPoolBal, arcPoolBal, usdcBorrowBal, eurcBorrowBal, ethBorrowBal, wbtcBorrowBal, arcBorrowBal] = await Promise.all([
                getTokenBalance(CONTRACT_ADDRESSES.usdc, nextWalletAddress).catch(() => '0'),
                getTokenBalance(CONTRACT_ADDRESSES.eurc, nextWalletAddress).catch(() => '0'),
                getTokenBalance(CONTRACT_ADDRESSES.eth, nextWalletAddress).catch(() => '0'),
                getTokenBalance(CONTRACT_ADDRESSES.wbtc, nextWalletAddress).catch(() => '0'),
                getTokenBalance(CONTRACT_ADDRESSES.arc, nextWalletAddress).catch(() => '0'),
                getPoolBalance(CONTRACT_ADDRESSES.usdc, nextWalletAddress).catch(() => '0'),
                getPoolBalance(CONTRACT_ADDRESSES.eurc, nextWalletAddress).catch(() => '0'),
                getPoolBalance(CONTRACT_ADDRESSES.eth, nextWalletAddress).catch(() => '0'),
                getPoolBalance(CONTRACT_ADDRESSES.wbtc, nextWalletAddress).catch(() => '0'),
                getPoolBalance(CONTRACT_ADDRESSES.arc, nextWalletAddress).catch(() => '0'),
                getBorrowBalance(CONTRACT_ADDRESSES.usdc, nextWalletAddress).catch(() => '0'),
                getBorrowBalance(CONTRACT_ADDRESSES.eurc, nextWalletAddress).catch(() => '0'),
                getBorrowBalance(CONTRACT_ADDRESSES.eth, nextWalletAddress).catch(() => '0'),
                getBorrowBalance(CONTRACT_ADDRESSES.wbtc, nextWalletAddress).catch(() => '0'),
                getBorrowBalance(CONTRACT_ADDRESSES.arc, nextWalletAddress).catch(() => '0'),
            ]);

            if (previousAddressRef.current !== nextWalletAddress) {
                return;
            }

            const walletBalancesByAssetId: Record<string, number> = {
                eth: parseFloat(ethBal),
                usdc: parseFloat(usdcBal),
                wbtc: parseFloat(wbtcBal),
                eurc: parseFloat(eurcBal),
                arc: parseFloat(arcBal),
            };

            setUserBalances(EMPTY_BALANCES.map((balance) => ({
                ...balance,
                amount: walletBalancesByAssetId[balance.assetId] ?? 0,
            })));
            setUserSupplies([
                { assetId: 'usdc', amount: parseFloat(usdcPoolBal) },
                { assetId: 'eurc', amount: parseFloat(eurcPoolBal) },
                { assetId: 'eth', amount: parseFloat(ethPoolBal) },
                { assetId: 'wbtc', amount: parseFloat(wbtcPoolBal) },
                { assetId: 'arc', amount: parseFloat(arcPoolBal) }
            ]);
            setUserBorrows([
                { assetId: 'usdc', amount: parseFloat(usdcBorrowBal) },
                { assetId: 'eurc', amount: parseFloat(eurcBorrowBal) },
                { assetId: 'eth', amount: parseFloat(ethBorrowBal) },
                { assetId: 'wbtc', amount: parseFloat(wbtcBorrowBal) },
                { assetId: 'arc', amount: parseFloat(arcBorrowBal) }
            ]);

            const [liquidity, maxBorrowable] = await Promise.all([
                getAccountLiquidity(nextWalletAddress).catch(() => ({ collateralValue: 0, borrowValue: 0 })),
                getMaxBorrowable(nextWalletAddress).catch(() => 0),
            ]);

            if (previousAddressRef.current !== nextWalletAddress) {
                return;
            }

            setAccountLiquidity(liquidity);
            setMaxBorrowableUSD(maxBorrowable);

            await loadTotalSupplies();
        } catch (error) {
            console.error('Error loading wallet data:', error);
        }
    };

    useEffect(() => {
        let cancelled = false;

        const syncAndLoad = async () => {
            await syncWalletClient(walletClient ?? null);

            if (cancelled) {
                return;
            }

            if (!walletAddress || !walletClient) {
                previousAddressRef.current = null;
                resetPortfolioState();
                return;
            }

            if (previousAddressRef.current && previousAddressRef.current !== walletAddress) {
                resetPortfolioState();
            }

            previousAddressRef.current = walletAddress;

            await loadWalletData(walletAddress);
        };

        void syncAndLoad();

        return () => {
            cancelled = true;
        };
    }, [walletAddress, walletClient]);

    useEffect(() => {
        if (walletAddress) {
            localStorage.setItem('walletAddress', walletAddress);
            return;
        }

        localStorage.removeItem('walletAddress');
    }, [walletAddress]);

    const openModal = (type: ModalType, asset: Asset) => {
        if (isTransactionLoading || transactionInFlightRef.current) {
            return;
        }

        if (isLegacyMode && (type === ModalType.SUPPLY || type === ModalType.BORROW)) {
            alert('Legacy mode active: New supply/borrow actions are disabled. Please use Withdraw/Repay actions from Dashboard or the Legacy tab.');
            return;
        }

        if (!walletAddress) {
            alert('Connect your wallet to continue. Market data is available without a wallet, but transactions require a connected account on Arc Testnet.');
            return;
        }

        setModalState({ isOpen: true, type, asset });
    };
    
    const closeModal = () => {
        setModalState({ isOpen: false, type: null, asset: null });
    };

    const findBalance = (balances: UserBalance[], assetId: string) => balances.find(b => b.assetId === assetId)?.amount || 0;

    const handleTransaction = async (asset: Asset, amount: number, type: ModalType) => {
        if (isTransactionLoading || transactionInFlightRef.current) return; // Prevent multiple clicks
        
        const amountNum = Number(amount);
        if (isNaN(amountNum) || amountNum <= 0) return;

        transactionInFlightRef.current = true;
        setIsTransactionLoading(true);
        try {
            switch(type) {
            case ModalType.SUPPLY:
                if (amountNum > findBalance(userBalances, asset.id)) { alert("Insufficient balance"); return; }
                await depositToPool(asset.contractAddress!, amountNum.toString());
                // Update UI
                setUserBalances(prev => prev.map(b => 
                    b.assetId === asset.id ? { ...b, amount: b.amount - amountNum } : b
                ));
                setUserSupplies(prev => {
                    const existing = prev.find(s => s.assetId === asset.id);
                    if (existing) {
                        return prev.map(s => s.assetId === asset.id ? { ...s, amount: s.amount + amountNum } : s);
                    }
                    return [...prev, { assetId: asset.id, amount: amountNum }];
                });
                break;
            case ModalType.WITHDRAW:
                if (amountNum > findBalance(userSupplies, asset.id)) { alert("Insufficient supplied amount"); return; }
                await withdrawFromPool(asset.contractAddress!, amountNum.toString());
                // Update UI
                setUserBalances(prev => prev.map(b => 
                    b.assetId === asset.id ? { ...b, amount: b.amount + amountNum } : b
                ));
                setUserSupplies(prev => prev.map(s => 
                    s.assetId === asset.id ? { ...s, amount: Math.max(0, s.amount - amountNum) } : s
                ).filter(s => s.amount > 0.00001));
                break;
            case ModalType.BORROW:
                await borrowFromPool(asset.contractAddress!, amountNum.toString());
                // Update UI
                setUserBalances(prev => prev.map(b => 
                    b.assetId === asset.id ? { ...b, amount: b.amount + amountNum } : b
                ));
                setUserBorrows(prev => {
                    const existing = prev.find(b => b.assetId === asset.id);
                    if (existing) {
                        return prev.map(b => 
                            b.assetId === asset.id ? { ...b, amount: b.amount + amountNum } : b
                        );
                    } else {
                        return [...prev, { assetId: asset.id, amount: amountNum }];
                    }
                });
                break;
            case ModalType.REPAY:
                await repayToPool(asset.contractAddress!, amountNum.toString());
                // Update UI
                setUserBalances(prev => prev.map(b => 
                    b.assetId === asset.id ? { ...b, amount: Math.max(0, b.amount - amountNum) } : b
                ));
                setUserBorrows(prev => prev.map(b => 
                    b.assetId === asset.id ? { ...b, amount: Math.max(0, b.amount - amountNum) } : b
                ).filter(b => b.amount > 0.00001));
                break;
            default:
                alert("Feature not implemented yet");
                return;
        }

        const transactionTypeMap: { [key in ModalType]: TransactionType } = {
            [ModalType.SUPPLY]: TransactionType.SUPPLY,
            [ModalType.WITHDRAW]: TransactionType.WITHDRAW,
            [ModalType.BORROW]: TransactionType.BORROW,
            [ModalType.REPAY]: TransactionType.REPAY,
        };
        
        const newTransaction: Transaction = {
            id: `${Date.now()}-${Math.random()}`,
            type: transactionTypeMap[type],
            asset: asset,
            amount: amountNum,
            timestamp: new Date(),
        };
        setTransactions(prev => [newTransaction, ...prev]);

        // Reload total supplies after transaction
        await loadTotalSupplies();

            closeModal();
        } catch (error) {
            console.error('Transaction failed:', error);
            const message = (error as Error).message || '';
            const friendlyMessage = message.includes('estimateGas')
                ? 'Transaction simulation failed. Likely causes: insufficient token balance, allowance issue, or this action is disabled for the selected asset in the current pool.'
                : message;
            alert('Transaction failed: ' + friendlyMessage);
        } finally {
            transactionInFlightRef.current = false;
            setIsTransactionLoading(false);
        }
    };
    
    const handleSwap = async (fromAsset: Asset, toAsset: Asset, fromAmount: number) => {
        if (isTransactionLoading || transactionInFlightRef.current) return; // Prevent multiple clicks
        const activeWalletAddress = previousAddressRef.current;

        if (!activeWalletAddress) {
            alert('Wallet not connected');
            return;
        }

        transactionInFlightRef.current = true;
        
        setIsTransactionLoading(true);
        try {
            const outDecimals = getContractDecimals(toAsset.contractAddress);
            
            // Calculate expected output using AMM contract
            const expectedOutWei = await getSwapAmountOut(fromAsset.contractAddress!, toAsset.contractAddress!, fromAmount.toString());
            const expectedOut = parseFloat(ethers.formatUnits(expectedOutWei, outDecimals));
            
            // Calculate minimum amount out with 1% slippage protection
            const minAmountOutWei = expectedOutWei * BigInt(99) / BigInt(100);
            const minAmountOutFormatted = ethers.formatUnits(minAmountOutWei, outDecimals);
            
            // Execute swap - now with both tokenIn and tokenOut parameters
            await swapTokens(fromAsset.contractAddress!, toAsset.contractAddress!, fromAmount.toString(), minAmountOutFormatted);

            if (previousAddressRef.current !== activeWalletAddress) {
                return;
            }
            
            // Update balances
            const [newFromBalance, newToBalance] = await Promise.all([
                getTokenBalance(fromAsset.contractAddress!, activeWalletAddress),
                getTokenBalance(toAsset.contractAddress!, activeWalletAddress),
            ]);

            if (previousAddressRef.current !== activeWalletAddress) {
                return;
            }
            
            setUserBalances(prev => prev.map(b => 
                b.assetId === fromAsset.id ? { ...b, amount: parseFloat(newFromBalance) } : 
                b.assetId === toAsset.id ? { ...b, amount: parseFloat(newToBalance) } : b
            ));

            // Add transaction to history
            const newTransaction: Transaction = {
                id: `${Date.now()}-${Math.random()}`,
                type: TransactionType.SWAP,
                asset: fromAsset,
                amount: fromAmount,
                toAsset: toAsset,
                toAmount: expectedOut,
                timestamp: new Date(),
            };
            setTransactions(prev => [newTransaction, ...prev]);

            setSuccessModal({
                isOpen: true,
                message: `Successfully swapped ${formatAssetAmount(fromAmount, fromAsset)} ${fromAsset.symbol} for ${formatAssetAmount(expectedOut, toAsset)} ${toAsset.symbol}`
            });

            await loadTotalSupplies();
        } catch (error) {
            console.error('Swap failed:', error);
            const message = (error as Error).message || '';
            const friendlyMessage = message.includes('estimateGas')
                ? 'Swap simulation failed. Check token balance, allowance, selected pair liquidity, and network configuration.'
                : message;
            alert('Swap failed: ' + friendlyMessage);
        } finally {
            transactionInFlightRef.current = false;
            setIsTransactionLoading(false);
        }
    };
        
    const fallbackCollateralValue = useMemo(() => {
        return userSupplies.reduce((acc, { assetId, amount }) => {
            const asset = assetsWithDynamicApys.find(a => a.id === assetId);
            if (!asset || !asset.isCollateral) return acc;
            return acc + (asset.priceUSD * amount * asset.liquidationThreshold);
        }, 0);
    }, [userSupplies, assetsWithDynamicApys]);

    const fallbackBorrowValue = useMemo(() => {
        return userBorrows.reduce((acc, { assetId, amount }) => {
            const asset = assetsWithDynamicApys.find(a => a.id === assetId);
            return acc + (asset ? asset.priceUSD * amount : 0);
        }, 0);
    }, [userBorrows, assetsWithDynamicApys]);

    const collateralValue = accountLiquidity.collateralValue > 0 ? accountLiquidity.collateralValue : fallbackCollateralValue;
    const totalBorrowedUSD = accountLiquidity.borrowValue > 0 ? accountLiquidity.borrowValue : fallbackBorrowValue;
    const availableBorrowUSD = maxBorrowableUSD > 0 ? maxBorrowableUSD : Math.max(0, collateralValue - totalBorrowedUSD);


    const content = useMemo(() => {
        const props = { assets: assetsWithDynamicApys, userBalances, userSupplies, userBorrows, openModal };
        switch(activeView) {
            case 'dashboard': return <Dashboard {...props} legacyMode={isLegacyMode} />;
            case 'market': return <Market {...props} legacyMode={isLegacyMode} />;
            case 'swap': return <Swap assets={assetsWithDynamicApys} userBalances={userBalances} onSwap={handleSwap} isLoading={isTransactionLoading} />;
            case 'history': return <History transactions={transactions} />;
            case 'legacy': return <LegacyClaims {...props} />;
            default: return <Market {...props} />;
        }
    }, [activeView, assetsWithDynamicApys, userBalances, userSupplies, userBorrows, transactions]);

    const shouldShowConnectedContent = Boolean(walletAddress) || (!hasConnectedWallet && activeView === 'market');

    return (
        <div className="min-h-screen bg-arc-dark-900 text-arc-text-primary">
            <Header
                activeView={activeView}
                setActiveView={setActiveView}
            />
            <main className="container mx-auto px-4 py-8">
                <div className="mb-6 bg-yellow-900/20 border border-yellow-600/40 rounded-xl p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <p className="text-sm text-yellow-100">
                            Legacy pool sunset is active. Withdraw supplied funds and repay borrows before the countdown ends. A dedicated legacy withdrawal page will remain available after the sunset period.
                        </p>
                        <div className="text-sm font-mono text-yellow-300 bg-black/20 px-3 py-2 rounded-lg border border-yellow-600/20">
                            {legacyCountdown}
                        </div>
                    </div>
                </div>
                {hasConnectedWallet && !isSupportedChain ? (
                    <div className="text-center py-20">
                        <h2 className="text-3xl font-bold mb-4">Wrong network</h2>
                        <p className="text-arc-text-secondary mb-8">Switch your wallet to Arc Testnet from the header to continue.</p>
                    </div>
                ) : shouldShowConnectedContent ? (
                    content
                ) : (
                    <div className="text-center py-20">
                        <h2 className="text-3xl font-bold mb-4">Welcome to ARC Protocol</h2>
                        <p className="text-arc-text-secondary mb-8">
                            Use the Market tab for public pool data, or connect your wallet from the header to start lending, borrowing, and swapping.
                        </p>
                    </div>
                )}
            </main>
            
            {/* Footer */}
            <footer className="border-t border-arc-dark-700 mt-16">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center text-arc-text-secondary text-sm">
                        <p className="mb-2">
                            <strong>MVP Testnet Application</strong> - Educational v2 for <a href="https://docs.arc.network/arc/concepts/welcome-to-arc" target="_blank" rel="noopener noreferrer" className="text-arc-accent-primary hover:text-arc-accent-secondary underline">ARC Protocol</a>
                        </p>
                        <p className="text-xs opacity-75">
                            This is a testnet demo application for learning and testing ARC Protocol features. 
                            Not for production use. All transactions use test tokens with no real value.
                        </p>
                    </div>
                </div>
            </footer>
            
            {modalState.isOpen && modalState.asset && modalState.type !== null && (
                <InteractionModal 
                    isOpen={modalState.isOpen}
                    onClose={closeModal}
                    asset={modalState.asset}
                    modalType={modalState.type}
                    userWalletBalance={findBalance(userBalances, modalState.asset.id)}
                    userSupplyBalance={findBalance(userSupplies, modalState.asset.id)}
                    userBorrowBalance={findBalance(userBorrows, modalState.asset.id)}
                    onSubmit={handleTransaction}
                    availableBorrowUSD={availableBorrowUSD}
                    isLoading={isTransactionLoading}
                />
            )}
            {successModal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-arc-dark-800 p-6 rounded-xl border border-arc-dark-700 max-w-md w-full mx-4">
                        <div className="text-center">
                            <div className="text-green-400 text-4xl mb-4">✓</div>
                            <h3 className="text-xl font-bold mb-2">Swap Successful</h3>
                            <p className="text-arc-text-secondary mb-4">{successModal.message}</p>
                            <button
                                onClick={() => setSuccessModal({ isOpen: false, message: '' })}
                                className="bg-arc-accent-primary hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;