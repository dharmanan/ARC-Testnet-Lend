import { createConfig, http } from 'wagmi';
import { coinbaseWallet, injected } from 'wagmi/connectors';

import { arcTestnet, ARC_RPC_URLS } from './chains';

export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors: [
    injected({ shimDisconnect: true }),
    coinbaseWallet({
      appName: 'Machina Lending',
    }),
  ],
  transports: {
    [arcTestnet.id]: http(ARC_RPC_URLS[0]),
  },
  ssr: false,
});