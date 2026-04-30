
import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

import { TwitterIcon, GithubIcon } from './icons';

interface HeaderProps {
    activeView: string;
    setActiveView: (view: 'dashboard' | 'market' | 'swap' | 'history' | 'legacy') => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, setActiveView }) => {
    const NavLink: React.FC<{ view: 'dashboard' | 'market' | 'swap' | 'history' | 'legacy', children: React.ReactNode }> = ({ view, children }) => (
        <button
            onClick={() => setActiveView(view)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
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
                           <NavLink view="legacy">Legacy</NavLink>
                           <button
                               onClick={() => window.open('https://arcbridge.vercel.app/', '_blank', 'noopener')}
                   className="px-4 py-2 rounded-md text-sm font-medium text-arc-text-secondary hover:bg-arc-dark-800 hover:text-white transition-colors cursor-pointer"
                           >
                               Bridge
                           </button>
                        </nav>
                    </div>
                    <div className="hidden md:flex items-center justify-center flex-1">
                        <div className="flex items-center gap-3">
                            <span className="text-arc-text-primary font-bold text-lg tracking-wide">
                                ARC Testnet Lending
                            </span>
                            <span className="px-2.5 py-1 rounded-full border border-yellow-600/40 bg-yellow-900/20 text-yellow-200 text-xs font-semibold tracking-wide uppercase">
                                Legacy Migration
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <a
                            href="https://faucet.circle.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border border-yellow-600/50 text-yellow-200 font-bold py-2 px-4 rounded-lg transition-colors hover:bg-yellow-500/10 hover:border-yellow-400 cursor-pointer"
                        >
                            Faucet
                        </a>
                        <a
                            href="https://x.com/KohenEric"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-arc-text-secondary hover:text-white transition-colors p-2 rounded-lg hover:bg-arc-dark-700 cursor-pointer"
                            title="Follow on X (Twitter)"
                        >
                            <TwitterIcon />
                        </a>
                        <a
                            href="https://github.com/dharmanan"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-arc-text-secondary hover:text-white transition-colors p-2 rounded-lg hover:bg-arc-dark-700 cursor-pointer"
                            title="View on GitHub"
                        >
                            <GithubIcon />
                        </a>
                        <ConnectButton chainStatus="none" />
                    </div>
                </div>
                 <nav className="md:hidden flex items-center justify-center space-x-4 pb-2">
                   <NavLink view="dashboard">Dashboard</NavLink>
                   <NavLink view="market">Market</NavLink>
                   <NavLink view="swap">Swap</NavLink>
                   <NavLink view="history">History</NavLink>
                   <NavLink view="legacy">Legacy</NavLink>
                   <a
                       href="https://arcbridge.vercel.app/"
                       target="_blank"
                       rel="noopener noreferrer"
                       className="px-4 py-2 rounded-md text-sm font-medium text-arc-text-secondary hover:bg-arc-dark-800 hover:text-white transition-colors cursor-pointer"
                   >
                       Bridge
                   </a>
                </nav>
            </div>
        </header>
    );
};

export default Header;