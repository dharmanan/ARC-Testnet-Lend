import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      global: 'globalThis',
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        buffer: 'buffer/',
      },
    },
    optimizeDeps: {
      include: ['buffer'],
    },
    build: {
      rollupOptions: {
        onwarn(warning, defaultHandler) {
          if (warning.message.includes('contains an annotation that Rollup cannot interpret')) {
            return;
          }

          defaultHandler(warning);
        },
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@walletconnect') || id.includes('reown') || id.includes('valtio')) {
                return 'walletconnect';
              }

              if (id.includes('@rainbow-me') || id.includes('@coinbase')) {
                return 'wallet-ui';
              }

              if (id.includes('wagmi') || id.includes('viem')) {
                return 'web3-core';
              }

              if (id.includes('ethers')) {
                return 'ethers';
              }
            }
          },
        },
      },
    },
  };
});
