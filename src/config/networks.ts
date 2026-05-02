import type { NetworkInfo } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// All supported testnet networks
// Arc docs: https://docs.arc.network/arc/references/connect-to-arc
// ─────────────────────────────────────────────────────────────────────────────

export const NETWORKS: NetworkInfo[] = [
  {
    id: 11155111,
    name: 'Sepolia',
    shortName: 'SEP',
    rpcUrls: [
      'https://rpc.sepolia.org',
      'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
      'https://rpc2.sepolia.org',
    ],
    explorerUrl: 'https://sepolia.etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    isTestnet: true,
    color: '#627EEA',
  },
  {
    id: 80001,
    name: 'Mumbai',
    shortName: 'MUM',
    rpcUrls: [
      'https://rpc-mumbai.maticvigil.com',
      'https://polygon-mumbai-bor.publicnode.com',
      'https://matic-mumbai.chainstacklabs.com',
    ],
    explorerUrl: 'https://mumbai.polygonscan.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    isTestnet: true,
    color: '#8247E5',
  },
  {
    id: 97,
    name: 'BSC Testnet',
    shortName: 'BSC',
    rpcUrls: [
      'https://data-seed-prebsc-1-s1.binance.org:8545',
      'https://data-seed-prebsc-2-s1.binance.org:8545',
    ],
    explorerUrl: 'https://testnet.bscscan.com',
    nativeCurrency: { name: 'BNB', symbol: 'tBNB', decimals: 18 },
    isTestnet: true,
    color: '#F3BA2F',
  },
  {
    id: 421614,
    name: 'Arbitrum Sepolia',
    shortName: 'ARB',
    rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
    explorerUrl: 'https://sepolia.arbiscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    isTestnet: true,
    color: '#28A0F0',
  },
  {
    id: 84532,
    name: 'Base Sepolia',
    shortName: 'BASE',
    rpcUrls: [
      'https://sepolia.base.org',
      'https://base-sepolia-rpc.publicnode.com',
    ],
    explorerUrl: 'https://sepolia.basescan.org',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    isTestnet: true,
    color: '#0052FF',
  },
  {
    id: 11011,
    name: 'Optimism Sepolia',
    shortName: 'OP',
    rpcUrls: ['https://sepolia.optimism.io'],
    explorerUrl: 'https://sepolia-optimism.etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    isTestnet: true,
    color: '#FF0420',
  },
  {
    // Arc Testnet — https://docs.arc.network/arc/references/connect-to-arc
    id: 5042002,
    name: 'Arc Testnet',
    shortName: 'ARC',
    rpcUrls: ['https://rpc.testnet.arc.network'],
    explorerUrl: 'https://testnet.arcscan.app',
    nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
    isTestnet: true,
    color: '#00E5FF',
  },
];

export const getNetworkById = (id: number): NetworkInfo | undefined =>
  NETWORKS.find(n => n.id === id);

export const getNetworkByName = (name: string): NetworkInfo | undefined => {
  const q = name.toLowerCase().trim();
  return NETWORKS.find(
    n =>
      n.name.toLowerCase().includes(q) ||
      n.shortName.toLowerCase() === q ||
      n.id.toString() === q
  );
};

// ─── Token addresses per chain (testnet verified addresses) ──────────────────
// NOTE: These are well-known testnet addresses. No external API needed.
// Public RPCs are used — no Alchemy key required unless you want higher rate limits.

export const TOKEN_ADDRESSES: Record<number, Record<string, `0x${string}`>> = {
  // Sepolia
  11155111: {
    WETH: '0x7b79995e5f793A07Bc6F5001c4270D4e91f26E50',
    USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
    USDT: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
    DAI:  '0x68194a729C2450ad26072b3D33ADaCbcef39D574',
  },
  // Mumbai
  80001: {
    WMATIC: '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889',
    USDC:   '0x9999f7Fea5938fD3b1E26A12c3f2fb024e194f97',
    USDT:   '0x3813e82e6f7098b9583FC0F33a962D02018B6803',
    DAI:    '0x001B3B4d0F3714Ca98ba10F6042DaEbF0B1B7b6f',
  },
  // Base Sepolia
  84532: {
    WETH: '0x4200000000000000000000000000000000000006',
    USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  },
  // Arbitrum Sepolia
  421614: {
    WETH: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73',
    USDC: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
  },
    },
  // Arc Testnet — https://docs.arc.network/arc/references/connect-to-arc
  5042002: {
    USDC: '0x3600000000000000000000000000000000000000',
  },
};

// Uniswap V3 SwapRouter02 addresses (no SDK needed — direct contract call)
// Only deployed on certain testnets
export const UNISWAP_ROUTER: Record<number, `0x${string}`> = {
  11155111: '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48', // Sepolia
  84532:    '0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4', // Base Sepolia
};

// Bridge supported routes
export const BRIDGE_ROUTES: Record<number, number[]> = {
  11155111: [80001, 421614, 84532, 11011],
  80001:    [11155111],
  421614:   [11155111],
  84532:    [11155111],
  11011:    [11155111],
};

// wallet_addEthereumChain params for every network
export const WALLET_ADD_PARAMS: Record<number, object> = {
  11155111: {
    chainId: '0xaa36a7',
    chainName: 'Sepolia Testnet',
    rpcUrls: ['https://rpc.sepolia.org'],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
  },
  80001: {
    chainId: '0x13881',
    chainName: 'Mumbai',
    rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    blockExplorerUrls: ['https://mumbai.polygonscan.com'],
  },
  97: {
    chainId: '0x61',
    chainName: 'BSC Testnet',
    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
    nativeCurrency: { name: 'BNB', symbol: 'tBNB', decimals: 18 },
    blockExplorerUrls: ['https://testnet.bscscan.com'],
  },
  421614: {
    chainId: '0x66eee',
    chainName: 'Arbitrum Sepolia',
    rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: ['https://sepolia.arbiscan.io'],
  },
  84532: {
    chainId: '0x14a34',
    chainName: 'Base Sepolia',
    rpcUrls: ['https://sepolia.base.org'],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: ['https://sepolia.basescan.org'],
  },
  11011: {
    chainId: '0x2b03',
    chainName: 'Optimism Sepolia',
    rpcUrls: ['https://sepolia.optimism.io'],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: ['https://sepolia-optimism.etherscan.io'],
  },
  5042002: {
    chainId: '0x4ccf2',
    chainName: 'Arc Testnet',
    rpcUrls: ['https://rpc.testnet.arc.network'],
    nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
    blockExplorerUrls: ['https://testnet.arcscan.app'],
  },
};
