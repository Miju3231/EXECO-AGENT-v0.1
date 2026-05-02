import { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { useChat } from '../hooks/useChat';

function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-6 text-center select-none">
      <div>
        <div
          className="font-display font-bold tracking-widest mb-1"
          style={{ fontSize: 42, color: 'var(--c-accent)', textShadow: '0 0 48px var(--c-accent-40), 0 0 80px var(--c-accent-20)' }}
        >
          EXECO
        </div>
        <div className="text-xs font-mono tracking-widest" style={{ color: 'var(--c-dim)' }}>
          AI WEB3 AGENT · BY 0xjuiceee
        </div>
      </div>

      <div className="max-w-xs text-sm leading-relaxed" style={{ color: 'var(--c-muted)' }}>
        Talk naturally. I'll parse your intent and execute blockchain transactions — send, swap, bridge, query.
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {['send ETH', 'swap tokens', 'bridge assets', 'check balance', 'switch network'].map(t => (
          <span key={t} className="tag">{t}</span>
        ))}
      </div>

      <ConnectButton label="Connect Wallet to Start" />
    </div>
  );
}

function EmptyChat({ onSend }: { onSend: (t: string) => void }) {
  const prompts = [
    "What's my ETH balance?",
    'Send 0.01 ETH to 0x...',
    'Swap 0.1 ETH for USDC',
    'Switch to Base Sepolia',
    'What is gas fee?',
  ];
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold"
        style={{ background: 'var(--c-accent-10)', border: '1px solid var(--c-accent-20)', color: 'var(--c-accent)' }}
      >
        E
      </div>
      <div>
        <p className="font-display text-sm" style={{ color: 'var(--c-accent)' }}>EXECO ready.</p>
        <p className="text-xs mt-1" style={{ color: 'var(--c-dim)' }}>What would you like to do?</p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center max-w-sm">
        {prompts.map(p => (
          <button
            key={p}
            onClick={() => onSend(p)}
            className="text-xs font-mono px-3 py-1.5 rounded-full transition-colors"
            style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border)', color: 'var(--c-muted)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--c-accent)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--c-muted)'; }}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ChatView() {
  const { isConnected } = useAccount();
  const { messages, send, confirm, cancel, isBusy } = useChat();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isConnected) {
    return <div className="flex-1 overflow-hidden"><WelcomeScreen /></div>;
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2">
        {messages.length === 0
          ? <EmptyChat onSend={send} />
          : messages.map(m => (
              <MessageBubble
                key={m.id}
                msg={m}
                onConfirm={(id) => {
                  const found = messages.find(x => x.id === id);
                  if (found?.confirmData) confirm(id, found.confirmData);
                }}
                onCancel={cancel}
              />
            ))
        }
        <div ref={endRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={send} disabled={isBusy} />
    </div>
  );
}
