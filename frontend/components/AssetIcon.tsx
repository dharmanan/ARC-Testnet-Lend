import React from 'react';
import { ArcIcon, EthIcon, BtcIcon, UsdcIcon, EurcIcon } from './icons';

interface AssetIconProps {
  iconId: string;
  className?: string;
}

export const AssetIcon: React.FC<AssetIconProps> = ({ iconId, className }) => {
  switch (iconId) {
    case 'eth':
      return <EthIcon className={className} />;
    case 'wbtc':
      return <BtcIcon className={className} />;
    case 'usdc':
      return <UsdcIcon className={className} />;
    case 'eurc':
      return <EurcIcon className={className} />;
    case 'arc':
      return <ArcIcon className={className} />;
    default:
      return null;
  }
};