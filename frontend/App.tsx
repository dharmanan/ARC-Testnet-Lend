
import React, { useState, useMemo, useEffect } from 'react';
import { ethers } from 'ethers';
import { Asset, UserBalance, ModalType, Transaction, TransactionType } from './types';
import { ASSETS } from './constants';
import { connectWallet as connectWalletService, disconnectWallet as disconnectWalletService, getTokenBalance, getPoolBalance, depositToPool, withdrawFromPool, borrowFromPool, repayToPool, getBorrowBalance, getTotalSupply, getTotalBorrowed, getPoolTotalSupplied, getPoolTotalBorrowed, swapTokens, getSwapAmountOut } from './services/contractService';
import { CONTRACT_ADDRESSES } from './constants';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Market from './components/Market';
import Swap from './components/Swap';
import InteractionModal from './components/InteractionModal';
import History from './components/History';

type ActiveView = 'dashboard' | 'market' | 'swap' | 'history';

const App: React.FC = () => {
    const [activeView, setActiveView] = useState<ActiveView>('market');
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    const [assets, setAssets] = useState<Asset[]>(ASSETS);
    const [userBalances, setUserBalances] = useState<UserBalance[]>([
        { assetId: 'eth', amount: 0 },
        { assetId: 'usdc', amount: 0 },
        { assetId: 'wbtc', amount: 0 },
        { assetId: 'eurc', amount: 0 },
        { assetId: 'arc', amount: 0 },
    ]);
    const [userSupplies, setUserSupplies] = useState<UserBalance[]>([
        { assetId: 'usdc', amount: 0.2 },
        { assetId: 'eurc', amount: 0.5 }
    ]);
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

    const loadTotalSupplies = async () => {
        if (!window.ethereum) return; // Wait for wallet connection
        
        try {
            console.log('Loading total supplies...');
            const usdcPoolTotalSupplied = await getPoolTotalSupplied(CONTRACT_ADDRESSES.usdc);
            const eurcPoolTotalSupplied = await getPoolTotalSupplied(CONTRACT_ADDRESSES.eurc);
            const ethPoolTotalSupplied = await getPoolTotalSupplied(CONTRACT_ADDRESSES.eth);
            const wbtcPoolTotalSupplied = await getPoolTotalSupplied(CONTRACT_ADDRESSES.wbtc);
            const arcPoolTotalSupplied = await getPoolTotalSupplied(CONTRACT_ADDRESSES.arc);
            const usdcPoolTotalBorrowed = await getPoolTotalBorrowed(CONTRACT_ADDRESSES.usdc);
            const eurcPoolTotalBorrowed = await getPoolTotalBorrowed(CONTRACT_ADDRESSES.eurc);
            const ethPoolTotalBorrowed = await getPoolTotalBorrowed(CONTRACT_ADDRESSES.eth);
            const wbtcPoolTotalBorrowed = await getPoolTotalBorrowed(CONTRACT_ADDRESSES.wbtc);
            const arcPoolTotalBorrowed = await getPoolTotalBorrowed(CONTRACT_ADDRESSES.arc);

            console.log('Total supplies loaded:', {
                usdcPoolTotalSupplied,
                eurcPoolTotalSupplied,
                ethPoolTotalSupplied,
                wbtcPoolTotalSupplied,
                arcPoolTotalSupplied,
                usdcPoolTotalBorrowed,
                eurcPoolTotalBorrowed,
                ethPoolTotalBorrowed,
                wbtcPoolTotalBorrowed,
                arcPoolTotalBorrowed
            });

            setAssets(prevAssets => prevAssets.map(asset => {
                if (asset.id === 'usdc') {
                    return { ...asset, totalSupplied: parseFloat(usdcPoolTotalSupplied) || 0, totalBorrowed: parseFloat(usdcPoolTotalBorrowed) || 0 };
                } else if (asset.id === 'eurc') {
                    return { ...asset, totalSupplied: parseFloat(eurcPoolTotalSupplied) || 0, totalBorrowed: parseFloat(eurcPoolTotalBorrowed) || 0 };
                } else if (asset.id === 'eth') {
                    return { ...asset, totalSupplied: parseFloat(ethPoolTotalSupplied) || 0, totalBorrowed: parseFloat(ethPoolTotalBorrowed) || 0 };
                } else if (asset.id === 'wbtc') {
                    return { ...asset, totalSupplied: parseFloat(wbtcPoolTotalSupplied) || 0, totalBorrowed: parseFloat(wbtcPoolTotalBorrowed) || 0 };
                } else if (asset.id === 'arc') {
                    return { ...asset, totalSupplied: parseFloat(arcPoolTotalSupplied) || 0, totalBorrowed: parseFloat(arcPoolTotalBorrowed) || 0 };
                }
                return asset;
            }));
        } catch (error) {
            console.error('Error loading total supplies:', error);
        }
    };

    const assetsWithDynamicApys = useMemo(() => {
        return assets.map(asset => {
            if (asset.totalSupplied <= 0) {
                return { ...asset, supplyApy: 0, borrowApy: asset.baseRate };
            }
            const utilization = asset.totalBorrowed / asset.totalSupplied;
            const borrowApy = asset.baseRate + (utilization * asset.multiplier);
            const supplyApy = borrowApy * utilization * (1 - asset.reserveFactor);
            return { ...asset, supplyApy: Math.max(0, supplyApy), borrowApy: Math.max(0, borrowApy) };
        });
    }, [assets]);

    useEffect(() => {
        // Load real total supply data from contracts (no auto-connect)
        loadTotalSupplies();
        // Don't auto-connect wallet - let user click Connect button
    }, []);

    const connectWallet = async () => {
        if (isConnecting) return;
        setIsConnecting(true);
        try {
            const address = await connectWalletService();
            setWalletAddress(address);
            localStorage.setItem('walletAddress', address);
            // Load balances with error handling
            try {
                const usdcBal = await getTokenBalance(CONTRACT_ADDRESSES.usdc, address).catch(() => '0');
                const eurcBal = await getTokenBalance(CONTRACT_ADDRESSES.eurc, address).catch(() => '0');
                const ethBal = await getTokenBalance(CONTRACT_ADDRESSES.eth, address).catch(() => '0');
                const wbtcBal = await getTokenBalance(CONTRACT_ADDRESSES.wbtc, address).catch(() => '0');
                const arcBal = await getTokenBalance(CONTRACT_ADDRESSES.arc, address).catch(() => '0');
                const usdcPoolBal = await getPoolBalance(CONTRACT_ADDRESSES.usdc, address).catch(() => '0');
                const eurcPoolBal = await getPoolBalance(CONTRACT_ADDRESSES.eurc, address).catch(() => '0');
                const ethPoolBal = await getPoolBalance(CONTRACT_ADDRESSES.eth, address).catch(() => '0');
                const wbtcPoolBal = await getPoolBalance(CONTRACT_ADDRESSES.wbtc, address).catch(() => '0');
                const arcPoolBal = await getPoolBalance(CONTRACT_ADDRESSES.arc, address).catch(() => '0');
                const usdcBorrowBal = await getBorrowBalance(CONTRACT_ADDRESSES.usdc, address).catch(() => '0');
                const eurcBorrowBal = await getBorrowBalance(CONTRACT_ADDRESSES.eurc, address).catch(() => '0');
                const ethBorrowBal = await getBorrowBalance(CONTRACT_ADDRESSES.eth, address).catch(() => '0');
                const wbtcBorrowBal = await getBorrowBalance(CONTRACT_ADDRESSES.wbtc, address).catch(() => '0');
                const arcBorrowBal = await getBorrowBalance(CONTRACT_ADDRESSES.arc, address).catch(() => '0');
                setUserBalances(prev => prev.map(b => 
                    b.assetId === 'usdc' ? { ...b, amount: parseFloat(usdcBal) } : 
                    b.assetId === 'eurc' ? { ...b, amount: parseFloat(eurcBal) } :
                    b.assetId === 'eth' ? { ...b, amount: parseFloat(ethBal) } :
                    b.assetId === 'wbtc' ? { ...b, amount: parseFloat(wbtcBal) } :
                    b.assetId === 'arc' ? { ...b, amount: parseFloat(arcBal) } : b
                ));
                console.log('✅ User balances updated:', { usdc: usdcBal, eurc: eurcBal, eth: ethBal, wbtc: wbtcBal, arc: arcBal });
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
            } catch (err) {
                console.error('Error loading balances:', err);
            }
            // Load total supplies after wallet connection
            await loadTotalSupplies();
            
            // Try to focus window to help MetaMask popup close
            try {
                window.focus();
                // Small delay to ensure popup processes and closes
                await new Promise(resolve => setTimeout(resolve, 300));
            } catch (e) {
                // Ignore focus errors
            }
        } catch (error) {
            console.error('Wallet connection failed:', error);
            const errorMessage = (error as Error).message;
            if (errorMessage === 'WRONG_NETWORK') {
                alert('⚠️ Wrong Network Detected!\n\nThis app only works on Arc Testnet.\n\nPlease switch to Arc Testnet in MetaMask and try again.\n\nArc Testnet Chain ID: 5042002');
            } else {
                alert('Wallet connection failed: ' + errorMessage);
            }
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnectWallet = async () => {
        await disconnectWalletService();
        setWalletAddress(null);
        localStorage.removeItem('walletAddress');
        setUserBalances([
            { assetId: 'eth', amount: 10 },
            { assetId: 'usdc', amount: 5000 },
            { assetId: 'wbtc', amount: 0.5 },
            { assetId: 'eurc', amount: 2000 },
            { assetId: 'arc', amount: 1000 },
        ]);
        setUserSupplies([]);
        setUserBorrows([]);
        // Clear wallet data from sessionStorage/localStorage
        sessionStorage.clear();
    };

    const openModal = (type: ModalType, asset: Asset) => {
        setModalState({ isOpen: true, type, asset });
    };
    
    const closeModal = () => {
        setModalState({ isOpen: false, type: null, asset: null });
    };

    const findBalance = (balances: UserBalance[], assetId: string) => balances.find(b => b.assetId === assetId)?.amount || 0;

    const handleTransaction = async (asset: Asset, amount: number, type: ModalType) => {
        if (isTransactionLoading) return; // Prevent multiple clicks
        
        const amountNum = Number(amount);
        if (isNaN(amountNum) || amountNum <= 0) return;

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
            alert('Transaction failed: ' + (error as Error).message);
        } finally {
            setIsTransactionLoading(false);
        }
    };
    
    const handleSwap = async (fromAsset: Asset, toAsset: Asset, fromAmount: number) => {
        if (isTransactionLoading) return; // Prevent multiple clicks
        
        setIsTransactionLoading(true);
        try {
            // Get decimals for input token
            const inDecimals = fromAsset.contractAddress === CONTRACT_ADDRESSES.wbtc ? 8 : 
                              (fromAsset.contractAddress === CONTRACT_ADDRESSES.usdc || fromAsset.contractAddress === CONTRACT_ADDRESSES.eurc) ? 6 : 18;
            const outDecimals = toAsset.contractAddress === CONTRACT_ADDRESSES.wbtc ? 8 : 
                               (toAsset.contractAddress === CONTRACT_ADDRESSES.usdc || toAsset.contractAddress === CONTRACT_ADDRESSES.eurc) ? 6 : 18;
            
            // Calculate expected output using AMM contract
            const expectedOutWei = await getSwapAmountOut(fromAsset.contractAddress!, toAsset.contractAddress!, fromAmount.toString());
            const expectedOut = parseFloat(ethers.formatUnits(expectedOutWei, outDecimals));
            
            // Calculate minimum amount out with 1% slippage protection
            const minAmountOutWei = expectedOutWei * BigInt(99) / BigInt(100);
            const minAmountOutFormatted = ethers.formatUnits(minAmountOutWei, outDecimals);
            
            // Execute swap - now with both tokenIn and tokenOut parameters
            await swapTokens(fromAsset.contractAddress!, toAsset.contractAddress!, fromAmount.toString(), minAmountOutFormatted);
            
            // Update balances
            const newFromBalance = await getTokenBalance(fromAsset.contractAddress!, walletAddress!);
            const newToBalance = await getTokenBalance(toAsset.contractAddress!, walletAddress!);
            
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
                message: `Successfully swapped ${fromAmount} ${fromAsset.symbol} for ${expectedOut.toFixed(6)} ${toAsset.symbol}`
            });
        } catch (error) {
            console.error('Swap failed:', error);
            alert('Swap failed: ' + (error as Error).message);
        } finally {
            setIsTransactionLoading(false);
        }
    };
        
    const assetMap = useMemo(() => new Map(assetsWithDynamicApys.map(a => [a.id, a])), [assetsWithDynamicApys]);

    const collateralValue = useMemo(() => {
        const value = userSupplies.reduce((acc, {assetId, amount}) => {
            const asset = assetMap.get(assetId);
            if (asset && asset.isCollateral) {
                const contribution = asset.priceUSD * amount * asset.liquidationThreshold;
                console.log('Collateral contribution:', { assetId, amount, priceUSD: asset.priceUSD, liquidationThreshold: asset.liquidationThreshold, contribution });
                return acc + contribution;
            }
            return acc;
        }, 0);
        console.log('Total collateralValue:', value);
        return value;
    }, [userSupplies, assetMap]);

    const totalBorrowedUSD = useMemo(() => {
        const value = userBorrows.reduce((acc, { assetId, amount }) => {
            const asset = assetMap.get(assetId);
            return acc + (asset ? asset.priceUSD * amount : 0);
        }, 0);
        console.log('Debug totalBorrowedUSD:', { userBorrows, value });
        return value;
    }, [userBorrows, assetMap]);
    
    const availableBorrowUSD = useMemo(() => {
        const value = collateralValue - totalBorrowedUSD;
        console.log('Debug availableBorrowUSD:', { collateralValue, totalBorrowedUSD, value });
        return value > 0 ? value : 0;
    }, [collateralValue, totalBorrowedUSD]);


    const content = useMemo(() => {
        const props = { assets: assetsWithDynamicApys, userBalances, userSupplies, userBorrows, openModal };
        switch(activeView) {
            case 'dashboard': return <Dashboard {...props} />;
            case 'market': return <Market {...props} />;
            case 'swap': return <Swap assets={assetsWithDynamicApys} userBalances={userBalances} onSwap={handleSwap} isLoading={isTransactionLoading} />;
            case 'history': return <History transactions={transactions} />;
            default: return <Market {...props} />;
        }
    }, [activeView, assetsWithDynamicApys, userBalances, userSupplies, userBorrows, transactions]);

    return (
        <div className="min-h-screen bg-arc-dark-900 text-arc-text-primary">
            <Header
                walletAddress={walletAddress}
                onConnectWallet={connectWallet}
                onDisconnectWallet={disconnectWallet}
                activeView={activeView}
                setActiveView={setActiveView}
                isConnecting={isConnecting}
            />
            <main className="container mx-auto px-4 py-8">
                {walletAddress ? content : (
                    <div className="text-center py-20">
                        <h2 className="text-3xl font-bold mb-4">Welcome to ARC Protocol</h2>
                        <p className="text-arc-text-secondary mb-8">Connect your wallet to start lending, borrowing, and swapping.</p>
                        <button
                            onClick={connectWallet}
                            className="bg-arc-accent-primary hover:bg-opacity-80 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                        >
                            Connect Wallet
                        </button>
                    </div>
                )}
            </main>
            
            {/* Footer */}
            <footer className="border-t border-arc-dark-700 mt-16">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center text-arc-text-secondary text-sm">
                        <p className="mb-2">
                            <strong>MVP Testnet Application</strong> - Educational v1 for <a href="https://docs.arc.network/arc/concepts/welcome-to-arc" target="_blank" rel="noopener noreferrer" className="text-arc-accent-primary hover:text-arc-accent-secondary underline">ARC Protocol</a>
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

// Add global test functions for console debugging
declare global {
    interface Window {
        testContracts?: any;
    }
}

if (typeof window !== 'undefined') {
    window.testContracts = {
        contracts: {
            usdc: CONTRACT_ADDRESSES.usdc,
            eurc: CONTRACT_ADDRESSES.eurc,
            eth: CONTRACT_ADDRESSES.eth,
            wbtc: CONTRACT_ADDRESSES.wbtc,
            arc: CONTRACT_ADDRESSES.arc,
            lendingPool: CONTRACT_ADDRESSES.lendingPool,
            scheduledPayoutManager: CONTRACT_ADDRESSES.scheduledPayoutManager,
            ammPairETHWBTC: CONTRACT_ADDRESSES.ammPairETHWBTC,
            ammPairETHARC: CONTRACT_ADDRESSES.ammPairETHARC,
            ammPairWBTCARC: CONTRACT_ADDRESSES.ammPairWBTCARC,
        },
        functions: {
            // Helper to check if wallet is connected
            isWalletConnected: () => {
                if (!window.ethereum || !window.ethereum.selectedAddress) {
                    console.error('❌ Wallet not connected! Please connect MetaMask first.');
                    return false;
                }
                console.log('✅ Wallet connected:', window.ethereum.selectedAddress);
                return true;
            },
            
            // Test token balances
            testBalances: async () => {
                if (!window.testContracts.functions.isWalletConnected()) return;
                const addr = window.ethereum.selectedAddress;
                console.log('\n📊 Testing Token Balances...\n');
                
                const tests = [
                    { name: 'USDC', addr: CONTRACT_ADDRESSES.usdc },
                    { name: 'EURC', addr: CONTRACT_ADDRESSES.eurc },
                    { name: 'ETH', addr: CONTRACT_ADDRESSES.eth },
                    { name: 'WBTC', addr: CONTRACT_ADDRESSES.wbtc },
                    { name: 'ARC', addr: CONTRACT_ADDRESSES.arc },
                ];
                
                for (const test of tests) {
                    try {
                        const balance = await getTokenBalance(test.addr, addr);
                        console.log(`✅ ${test.name}: ${balance}`);
                    } catch (e) {
                        console.error(`❌ ${test.name}: ${e}`);
                    }
                }
            },
            
            // Test lending pool operations
            testLendingPool: async () => {
                if (!window.testContracts.functions.isWalletConnected()) return;
                console.log('\n🏦 Testing Lending Pool...\n');
                
                const tests = [
                    { name: 'USDC totalSupplied', addr: CONTRACT_ADDRESSES.usdc },
                    { name: 'EURC totalSupplied', addr: CONTRACT_ADDRESSES.eurc },
                    { name: 'ETH totalSupplied', addr: CONTRACT_ADDRESSES.eth },
                    { name: 'WBTC totalSupplied', addr: CONTRACT_ADDRESSES.wbtc },
                    { name: 'ARC totalSupplied', addr: CONTRACT_ADDRESSES.arc },
                ];
                
                for (const test of tests) {
                    try {
                        const total = await getPoolTotalSupplied(test.addr);
                        console.log(`✅ ${test.name}: ${total}`);
                    } catch (e) {
                        console.error(`❌ ${test.name}: ${e}`);
                    }
                }
            },
        },
    };
    console.log('🧪 Test utilities ready! Type: testContracts.functions.testBalances() or testContracts.functions.testLendingPool()');
}

export default App;