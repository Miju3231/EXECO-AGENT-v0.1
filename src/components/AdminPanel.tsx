import { useState } from 'react';
import { X, Lock, Eye, EyeOff, Save, Check, Plus, ShieldCheck, FlaskConical, Loader2 } from 'lucide-react';
import { useStore } from '../stores/appStore';
import { NETWORKS } from '../config/networks';
import type { AIProvider } from '../types';

const PROVIDERS: { value: AIProvider; label: string; model: string; url?: string }[] = [
  { value: 'gemini',   label: 'Gemini (Google)',           model: 'gemini-2.5-flash',          url: 'https://aistudio.google.com/app/apikey' },
  { value: 'claude',   label: 'Claude (Anthropic)',         model: 'claude-3-5-haiku-20241022', url: 'https://console.anthropic.com' },
  { value: 'openai',   label: 'GPT-4o (OpenAI)',           model: 'gpt-4o',                    url: 'https://platform.openai.com' },
  { value: 'deepseek', label: 'DeepSeek',                   model: 'deepseek-chat',             url: 'https://platform.deepseek.com' },
  { value: 'grok',     label: 'Grok (xAI)',                model: 'grok-2-latest',             url: 'https://console.x.ai' },
  { value: 'mistral',  label: 'Mistral',                    model: 'mistral-large-latest',      url: 'https://console.mistral.ai' },
  { value: 'custom',   label: 'Custom (OpenAI-compatible)', model: '',                          url: undefined },
];

function Label({ text }: { text: string }) {
  return <label className="block text-xs font-mono mb-1.5" style={{ color: 'var(--c-warning)', opacity: 0.7, letterSpacing: '0.06em' }}>{text}</label>;
}

export function AdminPanel() {
  const { isAdminOpen, setAdminOpen, settings, updateSettings, updateAI } = useStore();
  const [pw, setPw] = useState('');
  const [authed, setAuthed] = useState(false);
  const [pwErr, setPwErr] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaved, setPwSaved] = useState(false);
  const [pwChangeErr, setPwChangeErr] = useState('');

  const [net, setNet] = useState({ name: '', chainId: '', rpc: '', explorer: '', symbol: '' });
  const [netAdded, setNetAdded] = useState(false);

  // AI config state
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testOk, setTestOk] = useState<boolean | null>(null);
  const [aiSaved, setAiSaved] = useState(false);
  const ai = settings.aiConfig;

  if (!isAdminOpen) return null;

  const close = () => { setAdminOpen(false); setAuthed(false); setPw(''); setPwErr(''); };

  const auth = () => {
    if (pw === settings.adminPassword) { setAuthed(true); setPwErr(''); }
    else { setPwErr('Wrong password'); }
  };

  const changePw = () => {
    setPwChangeErr('');
    if (!newPw.trim())        { setPwChangeErr('Password cannot be empty'); return; }
    if (newPw !== confirmPw)  { setPwChangeErr('Passwords do not match'); return; }
    updateSettings({ adminPassword: newPw });
    setNewPw(''); setConfirmPw('');
    setPwSaved(true); setTimeout(() => setPwSaved(false), 2000);
  };

  const addNet = () => {
    if (!net.name || !net.chainId || !net.rpc) return;
    setNetAdded(true); setTimeout(() => { setNetAdded(false); setNet({ name: '', chainId: '', rpc: '', explorer: '', symbol: '' }); }, 2500);
  };

  const handleProvider = (p: AIProvider) => {
    const found = PROVIDERS.find(x => x.value === p);
    updateAI({ provider: p, model: found?.model || '' });
    setTestOk(null);
  };

  const handleTest = async () => {
    setTesting(true); setTestOk(null);
    try {
      const { chatReply } = await import('../lib/aiProvider');
      const r = await chatReply([{ role: 'user', content: 'Reply with exactly: OK' }], ai, 'Test');
      setTestOk(r.trim().length > 0);
    } catch { setTestOk(false); }
    setTesting(false);
  };

  const handleAiSave = () => { setAiSaved(true); setTimeout(() => setAiSaved(false), 2000); };

  const providerInfo = PROVIDERS.find(p => p.value === ai.provider);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }} onClick={close} />
      <div
        className="relative w-full sm:max-w-md glass rounded-t-2xl sm:rounded-xl z-10 overflow-y-auto"
        style={{ maxHeight: '92dvh', padding: '24px', borderColor: 'rgba(255,184,0,0.2)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold tracking-widest text-sm" style={{ color: 'var(--c-warning)' }}>ADMIN PANEL</h2>
          <button onClick={close} style={{ color: 'var(--c-muted)' }}><X size={18} /></button>
        </div>

        {/* ── Auth Gate ────────────────────────────────────────────────────── */}
        {!authed ? (
          <div className="space-y-4">
            <div className="text-center py-6">
              <Lock size={36} className="mx-auto mb-3" style={{ color: 'var(--c-warning)', opacity: 0.5 }} />
              <p className="text-sm" style={{ color: 'var(--c-muted)' }}>Enter admin password to continue</p>
            </div>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={pw}
                onChange={e => setPw(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && auth()}
                placeholder="Admin password"
                className="input-field pr-10"
                autoFocus
                style={{ borderColor: 'rgba(255,184,0,0.3)' }}
              />
              <button onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--c-dim)' }}>
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {pwErr && <p className="text-xs text-center" style={{ color: 'var(--c-danger)' }}>{pwErr}</p>}
            <button
              onClick={auth}
              className="w-full py-2.5 text-sm font-display font-bold rounded transition-all"
              style={{ background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.3)', color: 'var(--c-warning)' }}
            >
              Authenticate
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={14} style={{ color: 'var(--c-success)' }} />
              <span className="text-xs font-mono" style={{ color: 'var(--c-success)' }}>Authenticated</span>
            </div>

            {/* ── AI Provider Config ────────────────────────────────────── */}
            <div>
              <Label text="AI PROVIDER" />
              <div className="space-y-3">
                <select
                  value={ai.provider}
                  onChange={e => handleProvider(e.target.value as AIProvider)}
                  className="input-field"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                {providerInfo?.url && (
                  <a href={providerInfo.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs mt-1 inline-block" style={{ color: 'var(--c-warning)', opacity: 0.7 }}>
                    Get free API key →
                  </a>
                )}

                <div>
                  <label className="block text-xs font-mono mb-1.5" style={{ color: 'var(--c-warning)', opacity: 0.7, letterSpacing: '0.06em' }}>API KEY</label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={ai.apiKey}
                      onChange={e => { updateAI({ apiKey: e.target.value }); setTestOk(null); }}
                      placeholder="Paste your API key here..."
                      className="input-field pr-10"
                    />
                    <button onClick={() => setShowKey(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--c-dim)' }}>
                      {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {(ai.provider === 'custom' || ai.baseUrl) && (
                  <div>
                    <label className="block text-xs font-mono mb-1.5" style={{ color: 'var(--c-warning)', opacity: 0.7, letterSpacing: '0.06em' }}>BASE URL (optional)</label>
                    <input
                      type="text"
                      value={ai.baseUrl || ''}
                      onChange={e => updateAI({ baseUrl: e.target.value })}
                      placeholder="https://your-api.com/v1"
                      className="input-field"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-mono mb-1.5" style={{ color: 'var(--c-warning)', opacity: 0.7, letterSpacing: '0.06em' }}>MODEL (optional — overrides default)</label>
                  <input
                    type="text"
                    value={ai.model || ''}
                    onChange={e => updateAI({ model: e.target.value })}
                    placeholder={providerInfo?.model || 'e.g. gpt-4o'}
                    className="input-field"
                  />
                </div>

                <div className="flex gap-2">
                  <button onClick={handleTest} disabled={testing || !ai.apiKey} className="btn-ghost flex-1"
                    style={{ borderColor: 'rgba(255,184,0,0.3)', color: 'var(--c-warning)', fontSize: 12 }}>
                    {testing
                      ? <><Loader2 size={13} className="animate-spin" /> Testing...</>
                      : testOk === true  ? <><Check size={13} style={{ color: 'var(--c-success)' }} /> Connected</>
                      : testOk === false ? <><span style={{ color: 'var(--c-danger)' }}>✕</span> Failed</>
                      : <><FlaskConical size={13} /> Test API</>}
                  </button>
                  <button onClick={handleAiSave} className="btn-ghost flex-1"
                    style={{ borderColor: 'rgba(255,184,0,0.3)', color: 'var(--c-warning)', fontSize: 12 }}>
                    {aiSaved ? <><Check size={13} /> Saved!</> : <><Save size={13} /> Save AI</>}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--c-border)' }} />

            {/* ── Change Password ───────────────────────────────────────── */}
            <div>
              <Label text="CHANGE ADMIN PASSWORD" />
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    placeholder="New password (any string)"
                    className="input-field pr-10"
                  />
                  <button onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--c-dim)' }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  placeholder="Confirm new password"
                  className="input-field"
                />
                {pwChangeErr && <p className="text-xs" style={{ color: 'var(--c-danger)' }}>{pwChangeErr}</p>}
                <button onClick={changePw} className="btn-ghost" style={{ fontSize: 11, borderColor: 'rgba(255,184,0,0.3)', color: 'var(--c-warning)' }}>
                  {pwSaved ? <><Check size={12} /> Saved!</> : <><Save size={12} /> Update Password</>}
                </button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--c-border)' }} />

            {/* ── Active Networks ───────────────────────────────────────── */}
            <div>
              <Label text="ACTIVE NETWORKS" />
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {NETWORKS.map(n => (
                  <div key={n.id} className="flex items-center justify-between px-3 py-2 rounded text-xs font-mono" style={{ background: 'var(--c-elevated)' }}>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: n.color }} />
                      {n.name}
                    </span>
                    <span style={{ color: 'var(--c-dim)' }}>#{n.id}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--c-border)' }} />

            {/* ── Add Network ───────────────────────────────────────────── */}
            <div>
              <Label text="ADD CUSTOM TESTNET" />
              <div className="space-y-2">
                {[
                  { key: 'name',     placeholder: 'Network name' },
                  { key: 'chainId',  placeholder: 'Chain ID (number)' },
                  { key: 'rpc',      placeholder: 'RPC URL' },
                  { key: 'explorer', placeholder: 'Explorer URL (optional)' },
                  { key: 'symbol',   placeholder: 'Native currency symbol' },
                ].map(f => (
                  <input
                    key={f.key}
                    type="text"
                    value={net[f.key as keyof typeof net]}
                    onChange={e => setNet(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="input-field"
                  />
                ))}
                <button
                  onClick={addNet}
                  className="w-full py-2 text-xs font-mono rounded flex items-center justify-center gap-1.5 transition-all"
                  style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.2)', color: 'var(--c-warning)' }}
                >
                  {netAdded ? <><Check size={12} /> Network Added!</> : <><Plus size={12} /> Add Network</>}
                </button>
                <p className="text-xs" style={{ color: 'var(--c-dim)' }}>
                  After adding, the network will be pushed to MetaMask automatically when a user tries to switch to it.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
