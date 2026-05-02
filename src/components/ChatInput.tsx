import { useState, useRef, type KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';

const QUICK = [
  "What's my ETH balance?",
  'Send 0.01 ETH to 0x...',
  'Swap ETH for USDC',
  'Switch to Base Sepolia',
  'What is gas fee?',
];

export function ChatInput({ onSend, disabled }: { onSend: (t: string) => void; disabled?: boolean }) {
  const [val, setVal] = useState('');
  const [showQuick, setShowQuick] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const t = val.trim();
    if (!t || disabled) return;
    onSend(t);
    setVal('');
    setShowQuick(false);
    if (ref.current) ref.current.style.height = 'auto';
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  const autoSize = () => {
    const el = ref.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 120)}px`; }
  };

  return (
    <div style={{ borderTop: '1px solid var(--c-border)' }}>
      {/* Quick suggestions */}
      {showQuick && !val && (
        <div className="px-3 py-2 flex gap-2 overflow-x-auto" style={{ borderBottom: '1px solid var(--c-border)' }}>
          {QUICK.map(q => (
            <button
              key={q}
              onMouseDown={() => { setVal(q); setShowQuick(false); ref.current?.focus(); }}
              className="shrink-0 text-xs font-mono px-3 py-1.5 rounded-full whitespace-nowrap transition-colors"
              style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border)', color: 'var(--c-muted)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--c-accent)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--c-muted)'; }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 px-3 py-3">
        <textarea
          ref={ref}
          value={val}
          disabled={disabled}
          rows={1}
          placeholder="Type here... (Enter to send)"
          onChange={e => setVal(e.target.value)}
          onInput={autoSize}
          onKeyDown={onKey}
          onFocus={() => setShowQuick(true)}
          onBlur={() => setTimeout(() => setShowQuick(false), 150)}
          className="input-field flex-1 resize-none"
          style={{
            lineHeight: '1.5',
            maxHeight: 120,
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 14,
          }}
        />
        <button
          onClick={submit}
          disabled={disabled || !val.trim()}
          className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all"
          style={{
            background: val.trim() && !disabled ? 'var(--c-accent)' : 'var(--c-elevated)',
            color:      val.trim() && !disabled ? 'var(--c-bg)' : 'var(--c-dim)',
            border: '1px solid var(--c-border)',
            boxShadow: val.trim() && !disabled ? '0 0 16px var(--c-accent-20)' : 'none',
          }}
        >
          {disabled ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </div>
    </div>
  );
}
