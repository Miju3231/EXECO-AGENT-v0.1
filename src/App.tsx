import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Header } from './components/Header';
import { TestnetBanner } from './components/TestnetBanner';
import { ChatView } from './components/ChatView';
import { SettingsPanel } from './components/SettingsPanel';
import { AdminPanel } from './components/AdminPanel';
import { useStore } from './stores/appStore';

export default function App() {
  const { address, isConnected } = useAccount();
  const { addMessage } = useStore();

  // Wallet connect/disconnect system messages
  useEffect(() => {
    if (isConnected && address) {
      addMessage({
        role: 'system',
        type: 'text',
        content: `Wallet connected: ${address.slice(0, 6)}…${address.slice(-4)}`,
      });
    }
  }, [isConnected, address]); // eslint-disable-line

  return (
    <div className="grid-bg" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--c-bg)' }}>
      <Header />
      <TestnetBanner />
      <ChatView />
      <SettingsPanel />
      <AdminPanel />
    </div>
  );
}
