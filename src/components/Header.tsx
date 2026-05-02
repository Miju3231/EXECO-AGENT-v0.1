import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useChainId } from 'wagmi';
import { Settings, ShieldAlert, Trash2 } from 'lucide-react';
import { useStore } from '../stores/appStore';
import { getNetworkById } from '../config/networks';

export function Header() {
  const chainId = useChainId();
  const { setSettingsOpen, setAdminOpen, clearMessages } = useStore();
  const net = getNetworkById(chainId);

  return (
    <header className="glass flex items-center justify-between px-4 py-2.5 shrink-0" style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
      {/* Logo */}
      <div className="flex items-center gap-3">
        <span className="font-display text-lg font-bold tracking-widest" style={{ color: 'var(--c-accent)', textShadow: '0 0 24px var(--c-accent-40)' }}>
          EXECO
        </span>
        {net && (
          <span className="tag hidden sm:inline-flex">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: net.color }} />
            {net.name}
          </span>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        {net && (
          <span className="tag sm:hidden">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: net.color }} />
            {net.shortName}
          </span>
        )}

        <ConnectButton accountStatus="avatar" chainStatus="none" showBalance={false} label="Connect" />

        <button
          onClick={() => clearMessages()}
          title="Clear chat"
          className="p-2 rounded transition-colors"
          style={{ color: 'var(--c-dim)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-danger)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--c-dim)')}
        >
          <Trash2 size={14} />
        </button>

        <button
          onClick={() => setSettingsOpen(true)}
          title="Settings"
          className="p-2 rounded transition-colors"
          style={{ color: 'var(--c-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-accent)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--c-muted)')}
        >
          <Settings size={15} />
        </button>

        <button
          onClick={() => setAdminOpen(true)}
          title="Admin"
          className="p-2 rounded transition-colors"
          style={{ color: 'var(--c-dim)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-warning)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--c-dim)')}
        >
          <ShieldAlert size={14} />
        </button>
      </div>
    </header>
  );
}
