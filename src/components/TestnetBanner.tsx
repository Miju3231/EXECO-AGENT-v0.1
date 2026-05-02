import { AlertTriangle } from 'lucide-react';
import { useAccount } from 'wagmi';

export function TestnetBanner() {
  const { isConnected } = useAccount();
  if (!isConnected) return null;
  return (
    <div
      className="flex items-center justify-center gap-1.5 px-3 py-1 text-xs font-mono shrink-0"
      style={{
        background: 'rgba(255,184,0,0.06)',
        borderBottom: '1px solid rgba(255,184,0,0.15)',
        color: 'var(--c-warning)',
      }}
    >
      <AlertTriangle size={10} />
      TESTNET MODE — Funds have no real value
    </div>
  );
}
