
import React from 'react';
import { ArcIcon } from './icons';

interface HeaderProps {
    walletAddress: string | null;
    onConnectWallet: () => void;
    onDisconnectWallet?: () => void;
    activeView: string;
    setActiveView: (view: 'dashboard' | 'market' | 'swap' | 'history') => void;
    isConnecting: boolean;
}

const Header: React.FC<HeaderProps> = ({ walletAddress, onConnectWallet, onDisconnectWallet, activeView, setActiveView, isConnecting }) => {
    
    const shortenAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };
    
    const addArcTestnet = async () => {
        if (!window.ethereum) {
            alert('MetaMask not installed!');
            return;
        }

        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: '0x4cf1a2',
                    chainName: 'Arc Testnet',
                    nativeCurrency: {
                        name: 'USDC',
                        symbol: 'USDC',
                        decimals: 6
                    },
                    rpcUrls: ['https://rpc.testnet.arc.network'],
                    blockExplorerUrls: ['https://testnet.arcscan.app']
                }]
            });

            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x4cf1a2' }]
            });

            alert('Arc Testnet added successfully!');
        } catch (error: any) {
            console.error('Failed to add Arc Testnet:', error);
            if (error.code === 4902) {
                alert('Arc Testnet could not be added.');
            } else {
                alert('Please add Arc Testnet manually in MetaMask settings.');
            }
        }
    };
    
    const NavLink: React.FC<{ view: 'dashboard' | 'market' | 'swap' | 'history', children: React.ReactNode }> = ({ view, children }) => (
        <button
            onClick={() => setActiveView(view)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === view
                    ? 'bg-arc-dark-700 text-white'
                    : 'text-arc-text-secondary hover:bg-arc-dark-800 hover:text-white'
            }`}
        >
            {children}
        </button>
    );

    return (
        <header className="bg-arc-dark-800 border-b border-arc-dark-700">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-8">
                        <div className="flex items-center bg-arc-dark-700 px-3 py-2 rounded-lg">
                           <img 
                               src="/arc.png" 
                               alt="ARC" 
                               className="h-8 w-auto"
                               style={{ objectFit: 'contain' }}
                           />
                        </div>
                        <nav className="hidden md:flex items-center space-x-4">
                           <NavLink view="dashboard">Dashboard</NavLink>
                           <NavLink view="market">Market</NavLink>
                           <NavLink view="swap">Swap</NavLink>
                           <NavLink view="history">History</NavLink>
                           <a
                               href="https://arcbridge.vercel.app/"
                               target="_blank"
                               rel="noopener noreferrer"
                               className="px-4 py-2 rounded-md text-sm font-medium text-arc-text-secondary hover:bg-arc-dark-800 hover:text-white transition-colors"
                           >
                               Bridge
                           </a>
                        </nav>
                    </div>
                    <div className="hidden md:flex items-center justify-center flex-1">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-arc-accent-primary via-arc-accent-secondary to-arc-accent-primary opacity-30 blur-lg rounded-lg"></div>
                            <span className="relative bg-gradient-to-r from-arc-accent-primary via-arc-accent-secondary to-arc-accent-primary bg-clip-text text-transparent font-black text-lg tracking-widest animate-pulse">
                                ARC LENDING PLATFORM & DEX
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <a
                            href="https://faucet.circle.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border border-arc-accent-secondary text-arc-accent-secondary font-bold py-2 px-4 rounded-lg transition-colors hover:bg-arc-accent-secondary hover:text-white"
                        >
                            Faucet
                        </a>
                        {walletAddress ? (
                            <div className="flex items-center space-x-3">
                                <div className="bg-arc-dark-700 text-arc-text-primary px-4 py-2 rounded-lg text-sm font-mono">
                                    {shortenAddress(walletAddress)}
                                </div>
                                <button
                                    onClick={onDisconnectWallet}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                                >
                                    Disconnect
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={onConnectWallet}
                                disabled={isConnecting}
                                className="bg-arc-accent-primary hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                            </button>
                        )}
                    </div>
                </div>
                 <nav className="md:hidden flex items-center justify-center space-x-4 pb-2">
                   <NavLink view="dashboard">Dashboard</NavLink>
                   <NavLink view="market">Market</NavLink>
                   <NavLink view="swap">Swap</NavLink>
                   <NavLink view="history">History</NavLink>
                   <a
                       href="https://arcbridge.vercel.app/"
                       target="_blank"
                       rel="noopener noreferrer"
                       className="px-4 py-2 rounded-md text-sm font-medium text-arc-text-secondary hover:bg-arc-dark-800 hover:text-white transition-colors"
                   >
                       Bridge
                   </a>
                </nav>
            </div>
        </header>
    );
};

export default Header;