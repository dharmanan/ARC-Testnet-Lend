import type { EIP1193Provider } from 'viem';

declare global {
  interface Window {
    ethereum?: EIP1193Provider & {
      isMetaMask?: boolean;
      selectedAddress?: string;
      request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
    };
  }
}

export {};