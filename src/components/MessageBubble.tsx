import { useState } from 'react';
import { Copy, Check, ExternalLink, ArrowRight, Loader2 } from 'lucide-react';
import type { Message, TxStep } from '../types';

// ─── Utilities ────────────────────────────────────────────────────────────────

function short(addr: string) {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); }}
      className="ml-1 opacity-40 hover:opacity-90 transition-opacity"
    >
      {ok ? <Check size={10} style={{ color: 'var(--c-success)' }} /> : <Copy size={10} />}
    </button>
  );
}

function Row({ label, value, accent, copyText }: { label: string; value: string; accent?: boolean; copyText?: string }) {
  return (
    <div className="flex justify-between items-center text-xs font-mono py-0.5">
      <span style={{ color: 'var(--c-muted)' }}>{label}</span>
      <span style={{ color: accent ? 'var(--c-warning)' : 'var(--c-text)' }} className="flex items-center">
        {value}
        {copyText && <CopyBtn text={copyText} />}
      </span>
    </div>
  );
}

function Steps({ steps }: { steps: TxStep[] }) {
  const icons: Record<string, React.ReactNode> = {
    done:    <Check size={10} />,
    loading: <Loader2 size={10} className="animate-spin" />,
    error:   <span>✕</span>,
    pending: <span style={{ opacity: 0.3 }}>○</span>,
  };
  return (
    <div className="mt-2.5 space-y-1">
      {steps.map((s, i) => (
        <div key={i} className={`flex items-center gap-1.5 text-xs font-mono step-${s.status}`}>
          {icons[s.status]}
          <span>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── AI Avatar ────────────────────────────────────────────────────────────────

function EAvatar() {
  return (
    <div
      className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[9px] font-display font-bold mt-0.5"
      style={{ background: 'var(--c-accent-10)', border: '1px solid var(--c-accent-20)', color: 'var(--c-accent)' }}
    >
      E
    </div>
  );
}

// ─── Card: Confirm ────────────────────────────────────────────────────────────

function ConfirmCard({ msg, onConfirm, onCancel }: { msg: Message; onConfirm: () => void; onCancel: () => void }) {
  const d = msg.confirmData!;
  return (
    <div className="bubble-ai w-full" style={{ maxWidth: 360 }}>
      <div className="text-xs font-mono mb-3" style={{ color: 'var(--c-accent)', opacity: 0.7 }}>
        ▸ CONFIRM {d.action.toUpperCase()}
      </div>

      <div className="space-y-0.5 mb-4 pb-3" style={{ borderBottom: '1px solid var(--c-border)' }}>
        {d.action === 'send' && <>
          <Row label="Amount"  value={`${d.amount} ${d.token}`} />
          <Row label="To"      value={short(d.toAddress!)} copyText={d.toAddress} />
          <Row label="Network" value={d.network || '—'} />
          <Row label="Gas est" value={d.estimatedGas || '—'} accent />
        </>}

        {d.action === 'swap' && <>
          <Row label="From"     value={`${d.amount} ${d.fromToken}`} />
          <Row label="To"       value={d.toToken!} />
          <Row label="Network"  value={d.network || '—'} />
          <Row label="Slippage" value={d.slippage || '—'} />
          <Row label="Gas est"  value={d.estimatedGas || '—'} accent />
        </>}

        {d.action === 'bridge' && <>
          <Row label="Token"   value={`${d.amount} ${d.token}`} />
          <div className="flex justify-between items-center text-xs font-mono py-0.5">
            <span style={{ color: 'var(--c-muted)' }}>Route</span>
            <span className="flex items-center gap-1" style={{ color: 'var(--c-text)' }}>
              {d.fromNetwork} <ArrowRight size={10} style={{ color: 'var(--c-muted)' }} /> {d.toNetwork}
            </span>
          </div>
          <Row label="Fee est"  value={d.estimatedFee || '—'} accent />
          <Row label="Time est" value={d.estimatedTime || '—'} />
        </>}
      </div>

      <div className="flex gap-2">
        <button className="btn-primary flex-1" style={{ fontSize: 11 }} onClick={onConfirm}>Confirm</button>
        <button className="btn-ghost flex-1"   style={{ fontSize: 11 }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Card: TX Result ──────────────────────────────────────────────────────────

function TxCard({ msg }: { msg: Message }) {
  const r = msg.txResult!;
  const ok = r.status === 'success';
  return (
    <div className="bubble-ai w-full" style={{ maxWidth: 360, borderColor: ok ? 'rgba(0,255,148,0.2)' : 'rgba(255,59,107,0.2)' }}>
      <div className="text-xs font-mono mb-2.5" style={{ color: ok ? 'var(--c-success)' : 'var(--c-danger)' }}>
        {ok ? '✓ TX CONFIRMED' : '✕ TX FAILED'}
      </div>
      <Row label="Hash"    value={short(r.hash)}   copyText={r.hash} />
      <Row label="Network" value={r.network} />
      {msg.steps && <Steps steps={msg.steps} />}
      {ok && (
        <a
          href={r.explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 mt-3 text-xs font-mono"
          style={{ color: 'var(--c-accent)' }}
        >
          View on Explorer <ExternalLink size={10} />
        </a>
      )}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function MessageBubble({
  msg,
  onConfirm,
  onCancel,
}: {
  msg: Message;
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
}) {
  // System message (centered)
  if (msg.role === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className="tag" style={{ fontSize: 11 }}>{msg.content}</span>
      </div>
    );
  }

  // User
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end mb-3">
        <div className="bubble-user text-sm" style={{ color: 'var(--c-text)' }}>
          {msg.content}
        </div>
      </div>
    );
  }

  // Loading
  if (msg.type === 'loading') {
    return (
      <div className="flex items-start gap-2 mb-3">
        <EAvatar />
        <div className="bubble-ai flex items-center gap-2" style={{ padding: '10px 14px' }}>
          <span className="dot" /><span className="dot" /><span className="dot" />
        </div>
      </div>
    );
  }

  // Confirm card
  if (msg.type === 'confirm') {
    return (
      <div className="flex items-start gap-2 mb-3">
        <EAvatar />
        <ConfirmCard
          msg={msg}
          onConfirm={() => onConfirm?.(msg.id)}
          onCancel={() => onCancel?.(msg.id)}
        />
      </div>
    );
  }

  // TX result
  if (msg.type === 'tx_result') {
    return (
      <div className="flex items-start gap-2 mb-3">
        <EAvatar />
        <TxCard msg={msg} />
      </div>
    );
  }

  // Error
  if (msg.type === 'error') {
    return (
      <div className="flex items-start gap-2 mb-3">
        <EAvatar />
        <div className="bubble-ai text-sm" style={{ maxWidth: 420, borderColor: 'rgba(255,59,107,0.25)', color: 'var(--c-danger)' }}>
          <span style={{ color: 'var(--c-danger)' }}>⚠ </span>
          {msg.content}
        </div>
      </div>
    );
  }

  // Standard AI text
  return (
    <div className="flex items-start gap-2 mb-3">
      <EAvatar />
      <div className="bubble-ai text-sm" style={{ maxWidth: 460, color: 'var(--c-text)', lineHeight: 1.6 }}>
        <div className="text-xs font-mono mb-1.5" style={{ color: 'var(--c-accent)', opacity: 0.55 }}>EXECO</div>
        <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
        {msg.steps && <Steps steps={msg.steps} />}
      </div>
    </div>
  );
}
