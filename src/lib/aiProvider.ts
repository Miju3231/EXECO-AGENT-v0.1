import type { AIConfig, ParsedIntent } from '../types';

// ─── Chat message shape ───────────────────────────────────────────────────────
export interface ChatMsg { role: 'user' | 'assistant'; content: string; }

// ─── System prompts ───────────────────────────────────────────────────────────

const INTENT_SYSTEM = `You are a blockchain intent parser. Respond ONLY with a JSON object — no markdown, no text, no backticks.

Detect one of these actions:
- send       → "send X TOKEN to ADDRESS", "transfer X TOKEN to ADDRESS"
- swap       → "swap X TOKEN for TOKEN", "exchange X TOKEN to TOKEN"
- bridge     → "bridge X TOKEN from NETWORK to NETWORK"
- switch_network → "switch to NETWORK", "change network to NETWORK"
- query      → balance check, gas question, network info, general Web3 question
- none       → no blockchain intent at all

JSON schema (all fields optional except action):
{
  "action": "send|swap|bridge|switch_network|query|none",
  "token": "symbol or null",
  "amount": "string number or null",
  "toAddress": "0x... or null",
  "fromToken": "for swap",
  "toToken": "for swap",
  "fromNetwork": "for bridge",
  "toNetwork": "for bridge",
  "network": "for switch or context",
  "missingFields": ["fields still needed"]
}`;

const CHAT_SYSTEM = `You are EXECO — an AI-powered Web3 agent built by 0xjuiceee.

Rules:
- Always reply in English only
- Be concise. One to three sentences max unless asked for detail
- You can answer any Web3 question: gas fees, tokens, networks, DeFi, NFTs, etc.
- You are aware of what the user's wallet is connected to (see WALLET CONTEXT below)

Capabilities:
- Send ETH/ERC20 tokens
- Swap tokens via Uniswap V3 (on supported testnets: Sepolia, Base Sepolia)
- Bridge tokens via LayerZero (Sepolia ↔ Mumbai, Arbitrum Sepolia, Base Sepolia, Optimism Sepolia)
- Query balances and gas
- Switch networks

Supported Networks: Sepolia, Mumbai, BSC Testnet, Arbitrum Sepolia, Base Sepolia, Optimism Sepolia, Arc Testnet

IMPORTANT: No Alchemy or Uniswap API key is needed — EXECO uses public RPCs and calls
smart contracts directly (Uniswap V3 SwapRouter, ERC20 contracts). Everything works out of the box.`;

// ─── Public entry points ──────────────────────────────────────────────────────

export async function detectIntent(text: string, cfg: AIConfig): Promise<ParsedIntent> {
  const raw = await callAI([{ role: 'user', content: text }], cfg, INTENT_SYSTEM, 300);
  try {
    const clean = raw.replace(/```(?:json)?|```/g, '').trim();
    return JSON.parse(clean) as ParsedIntent;
  } catch {
    return { action: 'none' };
  }
}

export async function chatReply(
  history: ChatMsg[],
  cfg: AIConfig,
  walletCtx: string
): Promise<string> {
  const system = `${CHAT_SYSTEM}\n\nWALLET CONTEXT:\n${walletCtx}`;
  return callAI(history, cfg, system, 600);
}

// ─── Unified router ───────────────────────────────────────────────────────────

async function callAI(
  messages: ChatMsg[],
  cfg: AIConfig,
  system: string,
  maxTokens: number
): Promise<string> {
  if (!cfg.apiKey) throw new Error('No API key set. Open Settings (⚙) and paste your key.');

  switch (cfg.provider) {
    case 'gemini':  return gemini(messages, system, cfg, maxTokens);
    case 'claude':  return claude(messages, system, cfg, maxTokens);
    default:        return openaiCompat(messages, system, cfg, maxTokens);
  }
}

// ─── Gemini (Google) — REST, no SDK ──────────────────────────────────────────

async function gemini(
  messages: ChatMsg[],
  system: string,
  cfg: AIConfig,
  maxTokens: number
): Promise<string> {
  const model = cfg.model || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cfg.apiKey}`;

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
    }),
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    const msg = e?.error?.message || `Gemini error ${res.status}`;
    throw new Error(msg);
  }

  const d = await res.json();
  const text = d?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return text;
}

// ─── Claude (Anthropic) — REST ────────────────────────────────────────────────

async function claude(
  messages: ChatMsg[],
  system: string,
  cfg: AIConfig,
  maxTokens: number
): Promise<string> {
  const model = cfg.model || 'claude-3-5-haiku-20241022';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': cfg.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e?.error?.message || `Claude error ${res.status}`);
  }

  const d = await res.json();
  return d?.content?.[0]?.text ?? '';
}

// ─── OpenAI-compatible (OpenAI, DeepSeek, Grok, Mistral, Custom) ─────────────

const DEFAULT_URLS: Record<string, string> = {
  openai:   'https://api.openai.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
  grok:     'https://api.x.ai/v1',
  mistral:  'https://api.mistral.ai/v1',
};

const DEFAULT_MODELS: Record<string, string> = {
  openai:   'gpt-4o',
  deepseek: 'deepseek-chat',
  grok:     'grok-2-latest',
  mistral:  'mistral-large-latest',
};

async function openaiCompat(
  messages: ChatMsg[],
  system: string,
  cfg: AIConfig,
  maxTokens: number
): Promise<string> {
  const base = cfg.baseUrl || DEFAULT_URLS[cfg.provider] || 'https://api.openai.com/v1';
  const model = cfg.model || DEFAULT_MODELS[cfg.provider] || 'gpt-4o';

  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'system', content: system }, ...messages],
    }),
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e?.error?.message || `API error ${res.status}`);
  }

  const d = await res.json();
  return d?.choices?.[0]?.message?.content ?? '';
}
