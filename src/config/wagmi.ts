import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';
import {
  sepolia,
  bscTestnet,
  arbitrumSepolia,
  baseSepolia,
  optimismSepolia,
} from 'wagmi/chains';

// ─── Custom chains not in wagmi/chains ───────────────────────────────────────

export const polygonMumbai = defineChain({
  id: 80001,
  name: 'Mumbai',
  nativeCurrency: { decimals: 18, name: 'MATIC', symbol: 'MATIC' },
  rpcUrls: {
    default: { http: ['https://rpc-mumbai.maticvigil.com'] },
    public:  { http: ['https://rpc-mumbai.maticvigil.com'] },
  },
  blockExplorers: {
    default: { name: 'PolygonScan', url: 'https://mumbai.polygonscan.com' },
  },
  testnet: true,
});

// Arc Testnet — https://docs.arc.network/arc/references/connect-to-arc
export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { decimals: 18, name: 'USDC', symbol: 'USDC' },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public:  { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'Arc Explorer', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
});

// ─── Wagmi config ─────────────────────────────────────────────────────────────
// WalletConnect projectId is optional — MetaMask works without it.
// Get one free at https://cloud.walletconnect.com if you want WC modal.

const WC_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'b56e18d47c72ab683b10814fe9495694';

export const wagmiConfig = getDefaultConfig({
  appName: 'EXECO',
  projectId: WC_PROJECT_ID,
  chains: [
    sepolia,     // ← first = default focus network
    baseSepolia,
    arcTestnet,
    polygonMumbai,
    bscTestnet,
    arbitrumSepolia,
    optimismSepolia,
  ],
  ssr: false,
});

export { sepolia, bscTestnet, arbitrumSepolia, baseSepolia, optimismSepolia };
