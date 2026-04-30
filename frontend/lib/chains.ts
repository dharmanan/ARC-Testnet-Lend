import { defineChain, type EIP1193Provider } from 'viem';

const DEFAULT_ARC_RPC_URL = 'https://rpc.testnet.arc.network';
const FALLBACK_ARC_RPC_URLS = [
  DEFAULT_ARC_RPC_URL,
  'https://rpc.drpc.testnet.arc.network',
  'https://rpc.quicknode.testnet.arc.network',
  'https://rpc.blockdaemon.testnet.arc.network',
];

const envRpcUrl = import.meta.env.VITE_ARC_RPC_URL?.trim();

export const ARC_RPC_URLS = envRpcUrl
  ? [envRpcUrl, ...FALLBACK_ARC_RPC_URLS.filter((url) => url !== envRpcUrl)]
  : FALLBACK_ARC_RPC_URLS;

export const ARC_TESTNET_CHAIN = {
  chainId: '0x4cf1a2',
  chainName: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18,
  },
  rpcUrls: ARC_RPC_URLS,
  blockExplorerUrls: ['https://testnet.arcscan.app'],
};

export const arcTestnet = defineChain({
  id: 5_042_002,
  name: 'Arc Testnet',
  nativeCurrency: ARC_TESTNET_CHAIN.nativeCurrency,
  rpcUrls: {
    default: { http: ARC_RPC_URLS },
    public: { http: ARC_RPC_URLS },
  },
  blockExplorers: {
    default: {
      name: 'Arcscan',
      url: 'https://testnet.arcscan.app',
    },
  },
  testnet: true,
});

type EthereumProvider = EIP1193Provider & {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
};

const isMissingChainError = (error: unknown) => {
  if (!(error instanceof Error) || !('code' in error)) {
    return false;
  }

  const errorCode = (error as { code?: number }).code;
  return errorCode === 4902;
};

export const addArcTestnetToWallet = async (ethereum: EthereumProvider) => {
  await ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [ARC_TESTNET_CHAIN],
  });
};

export const switchToArcTestnet = async (ethereum: EthereumProvider) => {
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ARC_TESTNET_CHAIN.chainId }],
    });
  } catch (error) {
    if (!isMissingChainError(error)) {
      throw error;
    }

    await addArcTestnetToWallet(ethereum);
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ARC_TESTNET_CHAIN.chainId }],
    });
  }
};