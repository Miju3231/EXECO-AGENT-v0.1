// ─── Message Types ───────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'ai' | 'system';
export type MessageType = 'text' | 'confirm' | 'tx_result' | 'loading' | 'error';

export type TxAction = 'send' | 'swap' | 'bridge' | 'query' | 'switch_network' | 'none';

export interface TxStep {
  label: string;
  status: 'pending' | 'loading' | 'done' | 'error';
}

export interface TxConfirmData {
  action: 'send' | 'swap' | 'bridge';
  // Send
  token?: string;
  amount?: string;
  toAddress?: string;
  // Swap
  fromToken?: string;
  toToken?: string;
  // Bridge
  fromNetwork?: string;
  toNetwork?: string;
  // Common
  network?: string;
  chainId?: number;
  estimatedGas?: string;
  estimatedFee?: string;
  slippage?: string;
  estimatedTime?: string;
  priceImpact?: string;
  // Swap quote
  outputAmount?: string;
}

export interface TxResultData {
  hash: string;
  status: 'success' | 'failed';
  explorerUrl: string;
  action: string;
  network: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  type: MessageType;
  content: string;
  timestamp: number;
  confirmData?: TxConfirmData;
  txResult?: TxResultData;
  steps?: TxStep[];
}

// ─── AI Types ────────────────────────────────────────────────────────────────

export type AIProvider = 'gemini' | 'claude' | 'openai' | 'deepseek' | 'grok' | 'mistral' | 'custom';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

// ─── Intent Parsing ──────────────────────────────────────────────────────────

export interface ParsedIntent {
  action: TxAction;
  // Send
  token?: string;
  amount?: string;
  toAddress?: string;
  // Swap
  fromToken?: string;
  toToken?: string;
  // Bridge
  fromNetwork?: string;
  toNetwork?: string;
  // Network switch / general
  network?: string;
  missingFields?: string[];
}

// ─── Network ─────────────────────────────────────────────────────────────────

export interface NetworkInfo {
  id: number;
  name: string;
  shortName: string;
  rpcUrls: string[];
  explorerUrl: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  isTestnet: boolean;
  color: string;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface AppSettings {
  aiConfig: AIConfig;
  defaultSlippage: number;
  sessionSpendLimit: number;
  theme: 'dark' | 'light';
  adminPassword: string;
}
