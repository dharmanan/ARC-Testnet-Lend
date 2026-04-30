
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Buffer } from 'buffer';
import '@rainbow-me/rainbowkit/styles.css';

import './index.css';
import App from './App';
import { Web3Providers } from './lib/web3';

const globalScope = globalThis as typeof globalThis & {
  Buffer?: typeof Buffer;
  global?: typeof globalThis;
};

globalScope.Buffer ??= Buffer;
globalScope.global ??= globalThis;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Web3Providers>
      <App />
    </Web3Providers>
  </React.StrictMode>
);
