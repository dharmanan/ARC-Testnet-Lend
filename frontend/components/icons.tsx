
import React from 'react';

export const ArcIcon = ({ className = 'w-auto h-8' }: { className?: string }) => (
  <img 
    src={`/assets/arc.png?t=${Date.now()}`}
    alt="ARC" 
    className={className} 
    style={{ objectFit: 'contain' }} 
  />
);


export const EthIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L11.5 3.5L6 9.5L12 13L18 9.5L12.5 3.5L12 2Z" fill="#343434"/>
        <path d="M12 14.5L6 10.5L12 22V14.5Z" fill="#8C8C8C"/>
        <path d="M12 14.5L18 10.5L12 22V14.5Z" fill="#3C3C3B"/>
        <path d="M6 9.5L12 13L12 14.5L6 10.5L6 9.5Z" fill="#141414"/>
        <path d="M18 9.5L12 13L12 14.5L18 10.5L18 9.5Z" fill="#141414"/>
    </svg>
);

export const BtcIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <img 
        src={`/assets/btc.png?t=${Date.now()}`}
        alt="BTC" 
        className={className} 
        style={{ objectFit: 'contain' }} 
    />
);

export const UsdcIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <img src="/assets/usdc.png" alt="USDC" className={className} style={{ objectFit: 'contain' }} />
);

export const EurcIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="12" fill="#003399"/>
        <text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">€</text>
    </svg>
);