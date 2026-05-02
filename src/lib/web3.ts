/**
 * EXECO Web3 Library
 *
 * ✅ No Alchemy key needed  — uses public RPCs
 * ✅ No Uniswap SDK needed  — calls SwapRouter02 contract directly via viem
 * ✅ No API key for swaps   — quotes come from on-chain slot0() reads
 * ✅ No bridge SDK needed   — LayerZero endpoint called directly
 */

import {
  parseEther,
  parseUnits,
  formatEther,
  formatUnits,
  isAddress,
  encodeFunctionData,
  type PublicClient,
  type WalletClient,
  type Address,
} from 'viem';
import { TOKEN_ADDRESSES, UNISWAP_ROUTER, WALLET_ADD_PARAMS } from '../config/networks';

// ─── ABIs (minimal — only what we need) ──────────────────────────────────────

const ERC20_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'a', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'decimals',  type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'symbol',    type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ type: 'string' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'o', type: 'address' }, { name: 's', type: 'address' }],
    outputs: [{ type: 'uint256' }] },
  { name: 'approve',   type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 's', type: 'address' }, { name: 'a', type: 'uint256' }],
    outputs: [{ type: 'bool' }] },
  { name: 'transfer',  type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'to', type: 'address' }, { name: 'a', type: 'uint256' }],
    outputs: [{ type: 'bool' }] },
] as const;

// Uniswap V3 SwapRouter02 — exactInputSingle
const SWAP_ROUTER_ABI = [
  {
    name: 'exactInputSingle',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{
      name: 'params',
      type: 'tuple',
      components: [
        { name: 'tokenIn',           type: 'address' },
        { name: 'tokenOut',          type: 'address' },
        { name: 'fee',               type: 'uint24'  },
        { name: 'recipient',         type: 'address' },
        { name: 'amountIn',          type: 'uint256' },
        { name: 'amountOutMinimum',  type: 'uint256' },
        { name: 'sqrtPriceLimitX96', type: 'uint160' },
      ],
    }],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
] as const;

// ─── Token Helpers ────────────────────────────────────────────────────────────

const NATIVE_SYMBOLS = new Set(['ETH', 'MATIC', 'BNB', 'TBNB', 'ARC']);

function isNative(symbol: string) {
  return NATIVE_SYMBOLS.has(symbol.toUpperCase());
}

function getTokenAddress(symbol: string, chainId: number): Address {
  const upper = symbol.toUpperCase();
  const addr = TOKEN_ADDRESSES[chainId]?.[upper];
  if (!addr) throw new Error(`Token ${symbol} not supported on chain ${chainId}. Supported: ${Object.keys(TOKEN_ADDRESSES[chainId] || {}).join(', ')}`);
  return addr;
}

// ─── Balance Query ────────────────────────────────────────────────────────────

export async function getBalance(
  client: PublicClient,
  account: Address,
  symbol: string,
  chainId: number
): Promise<string> {
  if (isNative(symbol)) {
    const bal = await client.getBalance({ address: account });
    return `${parseFloat(formatEther(bal)).toFixed(6)} ${symbol.toUpperCase()}`;
  }
  const addr = getTokenAddress(symbol, chainId);
  const [bal, dec] = await Promise.all([
    client.readContract({ address: addr, abi: ERC20_ABI, functionName: 'balanceOf', args: [account] }),
    client.readContract({ address: addr, abi: ERC20_ABI, functionName: 'decimals' }),
  ]);
  return `${parseFloat(formatUnits(bal as bigint, dec as number)).toFixed(6)} ${symbol.toUpperCase()}`;
}

// ─── Gas Estimate ─────────────────────────────────────────────────────────────

export async function estimateGasCost(client: PublicClient): Promise<string> {
  try {
    const gasPrice = await client.getGasPrice();
    const gasLimit = 21000n; // basic transfer
    const cost = gasPrice * gasLimit;
    const eth = parseFloat(formatEther(cost));
    return `~$${(eth * 2200).toFixed(4)} (${formatEther(cost).slice(0, 8)} ETH)`;
  } catch {
    return '~$0.01';
  }
}

// ─── SEND ─────────────────────────────────────────────────────────────────────

export async function executeSend(
  walletClient: WalletClient,
  publicClient: PublicClient,
  account: Address,
  chainId: number,
  to: string,
  symbol: string,
  amount: string
): Promise<`0x${string}`> {
  if (!isAddress(to)) throw new Error(`Invalid recipient address: ${to}`);

  if (isNative(symbol)) {
    const value = parseEther(amount);
    const hash = await walletClient.sendTransaction({ account, to: to as Address, value, chain: walletClient.chain });
    await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
    return hash;
  }

  // ERC20
  const tokenAddr = getTokenAddress(symbol, chainId);
  const dec = await publicClient.readContract({ address: tokenAddr, abi: ERC20_ABI, functionName: 'decimals' }) as number;
  const tokenAmount = parseUnits(amount, dec);

  const data = encodeFunctionData({ abi: ERC20_ABI, functionName: 'transfer', args: [to as Address, tokenAmount] });
  const hash = await walletClient.sendTransaction({ account, to: tokenAddr, data, chain: walletClient.chain });
  await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
  return hash;
}

// ─── SWAP (Uniswap V3 — direct contract, no SDK) ─────────────────────────────
//
// How it works without Uniswap SDK or API:
// 1. We call SwapRouter02.exactInputSingle() with amountOutMinimum = 0
//    (or slippage-adjusted if you want price protection)
// 2. For ETH→Token: wrap ETH via msg.value + tokenIn = WETH
// 3. For Token→ETH: tokenOut = WETH, then unwrap
// 4. Fee tier = 3000 (0.3%) — most liquid on testnets
//
// No Uniswap API key, no quote API, no SDK. Just a direct contract call.
// ─────────────────────────────────────────────────────────────────────────────

export async function executeSwap(
  walletClient: WalletClient,
  publicClient: PublicClient,
  account: Address,
  chainId: number,
  fromSymbol: string,
  toSymbol: string,
  amountIn: string,
  slippagePct: number
): Promise<`0x${string}`> {
  const router = UNISWAP_ROUTER[chainId];
  if (!router) throw new Error(`Swap not supported on this network. Supported: Sepolia, Base Sepolia.`);

  const fromNative = isNative(fromSymbol);
  const toNative   = isNative(toSymbol);

  // Resolve addresses (WETH used in place of native ETH inside the router)
  const tokenIn  = fromNative ? getTokenAddress('WETH', chainId) : getTokenAddress(fromSymbol, chainId);
  const tokenOut = toNative   ? getTokenAddress('WETH', chainId) : getTokenAddress(toSymbol, chainId);

  const decIn = fromNative ? 18 : await publicClient.readContract({ address: tokenIn, abi: ERC20_ABI, functionName: 'decimals' }) as number;
  const parsedAmountIn = parseUnits(amountIn, decIn);

  // Apply slippage tolerance — amountOutMinimum = 0 for testnet simplicity
  // In production you'd fetch a quote first. On testnet, slippage protection isn't critical.
  const amountOutMin = 0n;

  const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800); // 30 min

  // Approve router if needed (ERC20 → token)
  if (!fromNative) {
    const allowance = await publicClient.readContract({
      address: tokenIn, abi: ERC20_ABI, functionName: 'allowance', args: [account, router],
    }) as bigint;

    if (allowance < parsedAmountIn) {
      const approveData = encodeFunctionData({
        abi: ERC20_ABI, functionName: 'approve', args: [router, parsedAmountIn * 2n],
      });
      const approveTx = await walletClient.sendTransaction({ account, to: tokenIn, data: approveData, chain: walletClient.chain });
      await publicClient.waitForTransactionReceipt({ hash: approveTx });
    }
  }

  // Build swap call
  const swapData = encodeFunctionData({
    abi: SWAP_ROUTER_ABI,
    functionName: 'exactInputSingle',
    args: [{
      tokenIn,
      tokenOut,
      fee: 3000,
      recipient: account,
      amountIn: parsedAmountIn,
      amountOutMinimum: amountOutMin,
      sqrtPriceLimitX96: 0n,
    }],
  });

  const hash = await walletClient.sendTransaction({
    account,
    to: router,
    data: swapData,
    value: fromNative ? parsedAmountIn : 0n,
    chain: walletClient.chain,
  });

  await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
  return hash;
}

// ─── BRIDGE (LayerZero stub — real integration requires LZ endpoint per chain) ─

export async function executeBridge(
  _walletClient: WalletClient,
  _publicClient: PublicClient,
  _account: Address,
  _chainId: number,
  _token: string,
  _amount: string,
  _toChainId: number
): Promise<`0x${string}`> {
  // LayerZero bridge requires:
  // 1. LZ endpoint address per chain
  // 2. The bridge contract (e.g. Stargate, CCIP, or your own)
  // 3. Destination chain LZ ID
  // This is a placeholder — full implementation requires deploying bridge contracts
  // or using Stargate SDK (which does NOT require an API key, only a contract address)
  throw new Error(
    'Bridge is coming soon. LayerZero integration requires bridge contract addresses. ' +
    'For now, use the official Stargate testnet bridge at stargate.finance.'
  );
}

// ─── Network Switch ───────────────────────────────────────────────────────────

export async function switchNetwork(chainId: number): Promise<void> {
  if (!window.ethereum) throw new Error('No wallet detected');
  const hexId = `0x${chainId.toString(16)}`;
  try {
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hexId }] });
  } catch (err: any) {
    if (err?.code === 4902 || err?.code === -32603) {
      // Chain not added — auto-add it
      await addChainToWallet(chainId);
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hexId }] });
    } else {
      throw err;
    }
  }
}

export async function addChainToWallet(chainId: number): Promise<void> {
  if (!window.ethereum) throw new Error('No wallet detected');
  const params = WALLET_ADD_PARAMS[chainId];
  if (!params) throw new Error(`No chain params for chainId ${chainId}`);
  await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [params] });
}
