import { useState } from 'react';
import { X, Save, Check } from 'lucide-react';
import { useStore } from '../stores/appStore';

function Label({ text }: { text: string }) {
  return <label className="block text-xs font-mono mb-1.5" style={{ color: 'var(--c-muted)', letterSpacing: '0.06em' }}>{text}</label>;
}

export function SettingsPanel() {
  const { settings, updateSettings, isSettingsOpen, setSettingsOpen } = useStore();
  const [saved, setSaved] = useState(false);

  if (!isSettingsOpen) return null;

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} onClick={() => setSettingsOpen(false)} />
      <div
        className="relative w-full sm:max-w-md glass rounded-t-2xl sm:rounded-xl z-10 overflow-y-auto"
        style={{ maxHeight: '92dvh', padding: '24px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold tracking-widest text-sm" style={{ color: 'var(--c-accent)' }}>SETTINGS</h2>
          <button onClick={() => setSettingsOpen(false)} style={{ color: 'var(--c-muted)' }}><X size={18} /></button>
        </div>

        <div className="space-y-5">

          {/* Slippage */}
          <div>
            <Label text="DEFAULT SLIPPAGE" />
            <div className="flex gap-2">
              {[0.1, 0.5, 1.0, 3.0].map(v => (
                <button key={v} onClick={() => updateSettings({ defaultSlippage: v })}
                  className="flex-1 py-2 text-xs font-mono rounded transition-all"
                  style={{
                    background: settings.defaultSlippage === v ? 'var(--c-accent-10)' : 'var(--c-elevated)',
                    border: `1px solid ${settings.defaultSlippage === v ? 'var(--c-accent)' : 'var(--c-border)'}`,
                    color:  settings.defaultSlippage === v ? 'var(--c-accent)' : 'var(--c-muted)',
                  }}>
                  {v}%
                </button>
              ))}
            </div>
          </div>

          {/* Session Limit */}
          <div>
            <Label text="SESSION SPEND LIMIT ($)" />
            <input
              type="number"
              value={settings.sessionSpendLimit}
              onChange={e => updateSettings({ sessionSpendLimit: parseInt(e.target.value) || 100 })}
              min={1} className="input-field"
            />
          </div>

          {/* Theme */}
          <div>
            <Label text="THEME" />
            <div className="flex gap-2">
              {(['dark', 'light'] as const).map(t => (
                <button key={t} onClick={() => updateSettings({ theme: t })}
                  className="flex-1 py-2 text-xs font-mono rounded capitalize transition-all"
                  style={{
                    background: settings.theme === t ? 'var(--c-accent-10)' : 'var(--c-elevated)',
                    border: `1px solid ${settings.theme === t ? 'var(--c-accent)' : 'var(--c-border)'}`,
                    color:  settings.theme === t ? 'var(--c-accent)' : 'var(--c-muted)',
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          <button onClick={handleSave} className="btn-primary w-full">
            {saved ? <><Check size={13} /> Saved!</> : <><Save size={13} /> Save</>}
          </button>

          <div style={{ borderTop: '1px solid var(--c-border)', paddingTop: 12 }}>
            <p className="text-xs font-mono" style={{ color: 'var(--c-dim)' }}>
              ℹ No Alchemy or Uniswap API key needed — EXECO uses public RPCs and calls
              smart contracts directly. Your AI key is stored locally only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
