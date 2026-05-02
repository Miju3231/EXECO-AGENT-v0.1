/// <reference types="vite/client" />

interface Window {
  ethereum?: {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on: (event: string, cb: (...args: unknown[]) => void) => void;
    removeListener: (event: string, cb: (...args: unknown[]) => void) => void;
    isMetaMask?: boolean;
  };
}

interface ImportMetaEnv {
  readonly VITE_WALLETCONNECT_PROJECT_ID: string;
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_ADMIN_PASSWORD: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
