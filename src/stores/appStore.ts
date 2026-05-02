import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Message, AppSettings, AIConfig, TxConfirmData } from '../types';

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface PendingTx {
  msgId: string;
  data: TxConfirmData;
}

interface Store {
  // ── Messages ────────────────────────────────
  messages: Message[];
  addMessage: (m: Omit<Message, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, patch: Partial<Message>) => void;
  clearMessages: () => void;

  // ── Settings ────────────────────────────────
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  updateAI: (patch: Partial<AIConfig>) => void;

  // ── UI ──────────────────────────────────────
  isSettingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
  isAdminOpen: boolean;
  setAdminOpen: (v: boolean) => void;
  isBusy: boolean;
  setBusy: (v: boolean) => void;

  // ── Pending TX ───────────────────────────────
  pendingTx: PendingTx | null;
  setPendingTx: (tx: PendingTx | null) => void;
}

const DEFAULTS: AppSettings = {
  aiConfig: {
    provider: 'gemini',
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    model: 'gemini-2.5-flash',
  },
  defaultSlippage: 0.5,
  sessionSpendLimit: 100,
  theme: 'dark',
  adminPassword: import.meta.env.VITE_ADMIN_PASSWORD || 'execo_admin',
};

export const useStore = create<Store>()(
  persist(
    (set) => ({
      messages: [],
      addMessage: (m) => {
        const id = genId();
        set(s => ({ messages: [...s.messages, { ...m, id, timestamp: Date.now() }] }));
        return id;
      },
      updateMessage: (id, patch) =>
        set(s => ({ messages: s.messages.map(m => m.id === id ? { ...m, ...patch } : m) })),
      clearMessages: () => set({ messages: [] }),

      settings: DEFAULTS,
      updateSettings: (patch) => set(s => ({ settings: { ...s.settings, ...patch } })),
      updateAI: (patch) => set(s => ({
        settings: { ...s.settings, aiConfig: { ...s.settings.aiConfig, ...patch } },
      })),

      isSettingsOpen: false,
      setSettingsOpen: (v) => set({ isSettingsOpen: v }),
      isAdminOpen: false,
      setAdminOpen: (v) => set({ isAdminOpen: v }),
      isBusy: false,
      setBusy: (v) => set({ isBusy: v }),

      pendingTx: null,
      setPendingTx: (tx) => set({ pendingTx: tx }),
    }),
    {
      name: 'execo-v1',
      partialize: (s) => ({ settings: s.settings }),
    }
  )
);
