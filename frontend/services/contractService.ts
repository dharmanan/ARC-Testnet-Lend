import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, ARC_TESTNET_CHAIN, RPC_URLS } from '../constants';

// ABI'ler - basit versiyonlar
const STABLE_TOKEN_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
  'function mint(address,uint256) external',
];

const LENDING_POOL_ABI = [
  'function deposit(address,uint256) external',
  'function withdraw(address,uint256) external',
  'function balanceOf(address,address) view returns (uint256)',
  'function borrow(address,uint256) external',
  'function repay(address,uint256) external',
  'function getBorrowBalance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
  'function totalSupplied(address) view returns (uint256)',
  'function totalBorrowed(address) view returns (uint256)',
];

const SCHEDULED_PAYOUT_MANAGER_ABI = [
  'function schedulePayout(address,uint256,uint256,uint256) external returns (uint256)',
  'function executeScheduled(uint256) external',
  'function schedules(uint256) view returns (uint256,address,address,uint256,uint256,uint256,bool,bool)',
];

const AMM_PAIR_ABI = [
  'function swap(address,uint256,uint256) external',
  'function addLiquidity(uint256,uint256) external',
  'function removeLiquidity(uint256) external',
  'function getAmountOut(address,uint256) view returns (uint256)',
  'function reserveUSDC() view returns (uint256)',
  'function reserveEURC() view returns (uint256)',
  'function totalLiquidity() view returns (uint256)',
  'function liquidity(address) view returns (uint256)',
];

let provider: ethers.BrowserProvider | null = null;
let signer: ethers.Signer | null = null;

// Failover provider - tries multiple RPCs sequentially
const getFailoverProvider = (): ethers.JsonRpcProvider | null => {
  // Use only primary RPC for speed (no multi-RPC overhead)
  // If it fails, app will error (failover can be added later if needed)
  if (RPC_URLS.length === 0) return null;
  return new ethers.JsonRpcProvider(RPC_URLS[0]); // Primary RPC only
};

export const connectWallet = async (): Promise<string> => {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  
  // Check current network
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  
  // Arc Testnet chain ID: 5042002 (0x4cf1a2)
  // Sepolia chain ID: 11155111 (0xaa36a7)
  if (chainId !== 5042002) {
    throw new Error('WRONG_NETWORK');
  }
  
  // Request accounts from MetaMask
  const accounts = await provider.send('eth_requestAccounts', []);
  
  // Small delay to ensure MetaMask popup processes
  await new Promise(resolve => setTimeout(resolve, 500));
  
  signer = await provider.getSigner();
  return await signer.getAddress();
};

export const disconnectWallet = async () => {
  // Clear local state
  provider = null;
  signer = null;
  
  // Disconnect from MetaMask
  if (window.ethereum && window.ethereum.selectedAddress) {
    try {
      // MetaMask doesn't have a direct disconnect, but we can clear permissions
      await window.ethereum.request({
        method: 'wallet_revokePermissions',
        params: [
          {
            eth_accounts: {}
          }
        ]
      }).catch(() => {
        // If revoke fails, that's ok - just clear local state
      });
    } catch (error) {
      console.log('Revoke permissions not supported, local state cleared');
    }
  }
};

export const getTokenContract = (tokenAddress: string, useProviderOnly = false) => {
  if (!provider) {
    throw new Error('Wallet not connected');
  }
  if (useProviderOnly) {
    return new ethers.Contract(tokenAddress, STABLE_TOKEN_ABI, provider);
  }
  if (!signer) {
    throw new Error('Wallet not connected');
  }
  return new ethers.Contract(tokenAddress, STABLE_TOKEN_ABI, signer);
};

export const getContracts = () => {
  if (!provider || !signer) {
    throw new Error('Wallet not connected');
  }

  const lendingPool = new ethers.Contract(CONTRACT_ADDRESSES.lendingPool, LENDING_POOL_ABI, signer);
  const scheduledPayoutManager = new ethers.Contract(CONTRACT_ADDRESSES.scheduledPayoutManager, SCHEDULED_PAYOUT_MANAGER_ABI, signer);
  
  // For AMM pairs, default to ETH/WBTC but could be any of the three
  const ammPair = new ethers.Contract(CONTRACT_ADDRESSES.ammPairETHWBTC, AMM_PAIR_ABI, signer);

  return { lendingPool, scheduledPayoutManager, ammPair };
};

export const getTokenBalance = async (tokenAddress: string, address: string): Promise<string> => {
  try {
    // Try to use failover provider for read-only operations
    const readProvider = getFailoverProvider() || provider;
    if (!readProvider) throw new Error('No provider available');
    
    // For all tokens (including native USDC), use ERC20 call
    const token = new ethers.Contract(tokenAddress, STABLE_TOKEN_ABI, readProvider);
    const balance = await token.balanceOf(address);
    
    // USDC and EURC are 6 decimals, WBTC is 8, others are 18
    const decimals = (tokenAddress === CONTRACT_ADDRESSES.usdc || tokenAddress === CONTRACT_ADDRESSES.eurc) ? 6 : 
                     (tokenAddress === CONTRACT_ADDRESSES.wbtc) ? 8 : 18;
    const formatted = ethers.formatUnits(balance, decimals);
    console.log(`Balance of ${tokenAddress.slice(0, 6)} for ${address.slice(0, 6)}: ${formatted}`);
    return formatted;
  } catch (error) {
    console.error('Error getting token balance:', error);
    throw error; // Re-throw to see the actual error
  }
};

export const depositToPool = async (tokenAddress: string, amount: string): Promise<void> => {
  const { lendingPool } = getContracts();

  // EURC is 6 decimals, WBTC is 8, others are 18; native USDC also 6
  const decimals = (tokenAddress === CONTRACT_ADDRESSES.usdc || tokenAddress === CONTRACT_ADDRESSES.eurc) ? 6 : 
                   (tokenAddress === CONTRACT_ADDRESSES.wbtc) ? 8 : 18;
  const amountWei = ethers.parseUnits(amount, decimals);

  // ALL tokens need approve, including native USDC (it's still ERC20)
  console.log('Approving token for deposit...');
  const token = getTokenContract(tokenAddress);
  const approveTx = await token.approve(CONTRACT_ADDRESSES.lendingPool, amountWei);
  await approveTx.wait();
  console.log('Token approved');

  // Then deposit
  console.log('Executing deposit...');
  const depositTx = await lendingPool.deposit(tokenAddress, amountWei);
  await depositTx.wait();
  console.log('Deposit successful');
};

export const withdrawFromPool = async (tokenAddress: string, amount: string): Promise<void> => {
  const { lendingPool } = getContracts();
  // USDC and EURC are 6 decimals, WBTC is 8, others are 18
  const decimals = (tokenAddress === CONTRACT_ADDRESSES.usdc || tokenAddress === CONTRACT_ADDRESSES.eurc) ? 6 : 
                   (tokenAddress === CONTRACT_ADDRESSES.wbtc) ? 8 : 18;
  const amountWei = ethers.parseUnits(amount, decimals);
  const tx = await lendingPool.withdraw(tokenAddress, amountWei);
  await tx.wait();
};

export const borrowFromPool = async (tokenAddress: string, amount: string): Promise<void> => {
  const { lendingPool } = getContracts();
  // USDC and EURC are 6 decimals, WBTC is 8, others are 18
  const decimals = (tokenAddress === CONTRACT_ADDRESSES.usdc || tokenAddress === CONTRACT_ADDRESSES.eurc) ? 6 : 
                   (tokenAddress === CONTRACT_ADDRESSES.wbtc) ? 8 : 18;
  // Fazla ondalık varsa kes
  let safeAmount = amount;
  if (decimals === 6) {
    const parts = amount.split('.');
    if (parts.length === 2 && parts[1].length > 6) {
      safeAmount = parts[0] + '.' + parts[1].slice(0, 6);
    }
  } else if (decimals === 8) {
    const parts = amount.split('.');
    if (parts.length === 2 && parts[1].length > 8) {
      safeAmount = parts[0] + '.' + parts[1].slice(0, 8);
    }
  }
  const amountWei = ethers.parseUnits(safeAmount, decimals);
  const tx = await lendingPool.borrow(tokenAddress, amountWei);
  await tx.wait();
};

export const repayToPool = async (tokenAddress: string, amount: string): Promise<void> => {
  const { lendingPool } = getContracts();
  // EURC is 6 decimals, WBTC is 8, others are 18; native USDC also 6
  const decimals = (tokenAddress === CONTRACT_ADDRESSES.usdc || tokenAddress === CONTRACT_ADDRESSES.eurc) ? 6 : 
                   (tokenAddress === CONTRACT_ADDRESSES.wbtc) ? 8 : 18;
  const amountWei = ethers.parseUnits(amount, decimals);

  // ALL tokens need approve, including native USDC
  console.log('Approving token for repay...');
  const token = getTokenContract(tokenAddress);
  const approveTx = await token.approve(CONTRACT_ADDRESSES.lendingPool, amountWei);
  await approveTx.wait();
  console.log('Token approved');

  // Then repay
  console.log('Executing repay...');
  const tx = await lendingPool.repay(tokenAddress, amountWei);
  await tx.wait();
  console.log('Repay successful');
};

export const getPoolBalance = async (tokenAddress: string, address: string): Promise<string> => {
  try {
    if (!provider) throw new Error('Wallet not connected');
    const { lendingPool } = getContracts();
    const balance = await lendingPool.balanceOf(tokenAddress, address);
    // USDC and EURC are 6 decimals, WBTC is 8, others are 18
    const decimals = (tokenAddress === CONTRACT_ADDRESSES.usdc || tokenAddress === CONTRACT_ADDRESSES.eurc) ? 6 : 
                     (tokenAddress === CONTRACT_ADDRESSES.wbtc) ? 8 : 18;
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error('Error getting pool balance:', error);
    return '0';
  }
};

export const getBorrowBalance = async (tokenAddress: string, address: string): Promise<string> => {
  try {
    if (!provider) throw new Error('Wallet not connected');
    const { lendingPool } = getContracts();
    const balance = await lendingPool.getBorrowBalance(tokenAddress, address);
    // USDC and EURC are 6 decimals, WBTC is 8, others are 18
    const decimals = (tokenAddress === CONTRACT_ADDRESSES.usdc || tokenAddress === CONTRACT_ADDRESSES.eurc) ? 6 : 
                     (tokenAddress === CONTRACT_ADDRESSES.wbtc) ? 8 : 18;
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error('Error getting borrow balance:', error);
    return '0';
  }
};

export const getTotalSupply = async (tokenAddress: string): Promise<string> => {
  try {
    if (!provider) throw new Error('Wallet not connected');
    const token = getTokenContract(tokenAddress, true); // useProviderOnly = true
    const totalSupply = await token.totalSupply();
    // USDC and EURC are 6 decimals, others are 18
    const decimals = (tokenAddress === CONTRACT_ADDRESSES.usdc || tokenAddress === CONTRACT_ADDRESSES.eurc) ? 6 : 18;
    return ethers.formatUnits(totalSupply, decimals);
  } catch (error) {
    console.error('Error getting total supply:', error);
    return '0';
  }
};

export const getTotalBorrowed = async (tokenAddress: string): Promise<string> => {
  try {
    if (!provider) throw new Error('Wallet not connected');
    // For now, calculate based on total supply with realistic utilization rates
    const totalSupply = await getTotalSupply(tokenAddress);
    const utilizationRate = tokenAddress === CONTRACT_ADDRESSES.usdc ? 0.7 : 0.7; // 70% utilization
    const totalBorrowed = parseFloat(totalSupply) * utilizationRate;
    return totalBorrowed.toFixed(tokenAddress === CONTRACT_ADDRESSES.usdc || tokenAddress === CONTRACT_ADDRESSES.eurc ? 6 : 18);
  } catch (error) {
    console.error('Error getting total borrowed:', error);
    return '0';
  }
};

export const getPoolTotalSupplied = async (tokenAddress: string): Promise<string> => {
  try {
    if (!provider) throw new Error('Wallet not connected');
    const { lendingPool } = getContracts();
    console.log('Calling totalSupplied for', tokenAddress);
    const totalSupplied = await lendingPool.totalSupplied(tokenAddress);
    console.log('Raw totalSupplied:', totalSupplied.toString());
    // USDC and EURC are 6 decimals, WBTC is 8, others are 18
    const decimals = (tokenAddress === CONTRACT_ADDRESSES.usdc || tokenAddress === CONTRACT_ADDRESSES.eurc) ? 6 : 
                     (tokenAddress === CONTRACT_ADDRESSES.wbtc) ? 8 : 18;
    const formatted = ethers.formatUnits(totalSupplied, decimals);
    console.log('Formatted totalSupplied:', formatted);
    return formatted;
  } catch (error) {
    console.error('Error getting pool total supplied:', error);
    return '0';
  }
};

export const getPoolTotalBorrowed = async (tokenAddress: string): Promise<string> => {
  try {
    if (!provider) throw new Error('Wallet not connected');
    const { lendingPool } = getContracts();
    const totalBorrowed = await lendingPool.totalBorrowed(tokenAddress);
    // USDC and EURC are 6 decimals, WBTC is 8, others are 18
    const decimals = (tokenAddress === CONTRACT_ADDRESSES.usdc || tokenAddress === CONTRACT_ADDRESSES.eurc) ? 6 : 
                     (tokenAddress === CONTRACT_ADDRESSES.wbtc) ? 8 : 18;
    return ethers.formatUnits(totalBorrowed, decimals);
  } catch (error) {
    console.error('Error getting pool total borrowed:', error);
    return '0';
  }
};

export const schedulePayout = async (tokenAddress: string, recipient: string, amount: string, releaseTimestamp: number, executorFee: string): Promise<any> => {
  const { scheduledPayoutManager } = getContracts();
  // USDC and EURC are 6 decimals, WBTC is 8, others are 18
  const decimals = (tokenAddress === CONTRACT_ADDRESSES.usdc || tokenAddress === CONTRACT_ADDRESSES.eurc) ? 6 : 
                   (tokenAddress === CONTRACT_ADDRESSES.wbtc) ? 8 : 18;
  const amountWei = ethers.parseUnits(amount, decimals);
  const feeWei = ethers.parseUnits(executorFee, decimals);

  const tx = await scheduledPayoutManager.schedulePayout(tokenAddress, recipient, amountWei, releaseTimestamp, feeWei);
  await tx.wait();
  return tx;
};

// AMM Pair functions
// Helper function to select the correct pair based on token combination
const getPairAddressForTokens = (tokenIn: string, tokenOut: string): string => {
  // Normalize to lowercase for comparison
  const tin = tokenIn.toLowerCase();
  const tout = tokenOut.toLowerCase();
  const eth = CONTRACT_ADDRESSES.eth.toLowerCase();
  const wbtc = CONTRACT_ADDRESSES.wbtc.toLowerCase();
  const arc = CONTRACT_ADDRESSES.arc.toLowerCase();

  // ETH/WBTC pair
  if ((tin === eth && tout === wbtc) || (tin === wbtc && tout === eth)) {
    return CONTRACT_ADDRESSES.ammPairETHWBTC;
  }
  // ETH/ARC pair
  if ((tin === eth && tout === arc) || (tin === arc && tout === eth)) {
    return CONTRACT_ADDRESSES.ammPairETHARC;
  }
  // WBTC/ARC pair
  if ((tin === wbtc && tout === arc) || (tin === arc && tout === wbtc)) {
    return CONTRACT_ADDRESSES.ammPairWBTCARC;
  }

  throw new Error(`No pair available for tokens ${tokenIn} and ${tokenOut}`);
};

// Helper function to get token decimals
const getTokenDecimals = (tokenAddress: string): number => {
  if (tokenAddress === CONTRACT_ADDRESSES.wbtc) return 8;
  if (tokenAddress === CONTRACT_ADDRESSES.usdc || tokenAddress === CONTRACT_ADDRESSES.eurc) return 6;
  return 18; // ETH, ARC, and other tokens
};

export const swapTokens = async (tokenIn: string, tokenOut: string, amountIn: string, minAmountOut: string): Promise<any> => {
  if (!provider || !signer) {
    throw new Error('Wallet not connected');
  }

  // Get the correct pair for this token combination
  const pairAddress = getPairAddressForTokens(tokenIn, tokenOut);
  const ammPair = new ethers.Contract(pairAddress, AMM_PAIR_ABI, signer);

  // Parse amounts with correct decimals for each token
  const inDecimals = getTokenDecimals(tokenIn);
  const outDecimals = getTokenDecimals(tokenOut);
  
  const amountInWei = ethers.parseUnits(amountIn, inDecimals);
  const minAmountOutWei = ethers.parseUnits(minAmountOut, outDecimals);

  // Check allowance and approve if necessary
  const tokenContract = new ethers.Contract(tokenIn, ['function allowance(address,address) view returns (uint256)', 'function approve(address,uint256) returns (bool)'], signer);
  const userAddress = await signer!.getAddress();
  const currentAllowance = await tokenContract.allowance(userAddress, pairAddress);
  
  console.log(`Current allowance for ${tokenIn}:`, currentAllowance.toString());
  console.log(`Required amount:`, amountInWei.toString());
  
  // Only approve if current allowance is insufficient
  if (currentAllowance < amountInWei) {
    console.log('Approving token for AMM pair (insufficient allowance)...');
    const approveTx = await tokenContract.approve(pairAddress, ethers.MaxUint256);
    console.log('Waiting for approval transaction...');
    await approveTx.wait();
    console.log('Token approved for AMM pair with unlimited allowance');
    
    // Small delay after approval
    await new Promise(resolve => setTimeout(resolve, 500));
  } else {
    console.log('Sufficient allowance already present, skipping approval');
  }

  console.log('Executing swap transaction...');
  const tx = await ammPair.swap(tokenIn, amountInWei, minAmountOutWei);
  await tx.wait();
  console.log('Swap completed successfully');
  return tx;
};

export const addLiquidity = async (amountUSDC: string, amountEURC: string): Promise<any> => {
  const { ammPair } = getContracts();
  
  const amountUSDCWei = ethers.parseUnits(amountUSDC, 6);
  const amountEURCWei = ethers.parseUnits(amountEURC, 6);

  const tx = await ammPair.addLiquidity(amountUSDCWei, amountEURCWei);
  await tx.wait();
  return tx;
};

export const removeLiquidity = async (liquidityAmount: string): Promise<any> => {
  const { ammPair } = getContracts();
  
  const liquidityWei = ethers.parseUnits(liquidityAmount, 18); // Liquidity tokens are 18 decimals

  const tx = await ammPair.removeLiquidity(liquidityWei);
  await tx.wait();
  return tx;
};

export const getSwapAmountOut = async (tokenIn: string, tokenOut: string, amountIn: string): Promise<bigint> => {
  // Try to use failover provider for read-only operations
  const readProvider = getFailoverProvider() || provider;
  if (!readProvider) {
    throw new Error('No provider available');
  }

  // Get the correct pair for this token combination
  const pairAddress = getPairAddressForTokens(tokenIn, tokenOut);
  const ammPair = new ethers.Contract(pairAddress, AMM_PAIR_ABI, readProvider);
  
  const inDecimals = getTokenDecimals(tokenIn);
  const amountInWei = ethers.parseUnits(amountIn, inDecimals);
  const amountOutWei = await ammPair.getAmountOut(tokenIn, amountInWei);
  
  return amountOutWei;
};

export const getPoolReserves = async (): Promise<{usdc: string, eurc: string}> => {
  const { ammPair } = getContracts();
  
  const [usdcReserve, eurcReserve] = await Promise.all([
    ammPair.reserveUSDC(),
    ammPair.reserveEURC()
  ]);
  
  return {
    usdc: ethers.formatUnits(usdcReserve, 6),
    eurc: ethers.formatUnits(eurcReserve, 6)
  };
};

export const getUserLiquidity = async (userAddress: string): Promise<string> => {
  const { ammPair } = getContracts();
  
  const liquidity = await ammPair.liquidity(userAddress);
  return ethers.formatUnits(liquidity, 18);
};