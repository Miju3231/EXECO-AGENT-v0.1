import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { Toaster } from 'react-hot-toast';
import { wagmiConfig } from './config/wagmi';
import App from './App';
import './index.css';

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 10_000 } },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={qc}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#00E5FF',
            accentColorForeground: '#080B10',
            borderRadius: 'small',
            fontStack: 'system',
          })}
        >
          <App />
          <Toaster
            position="top-right"
            gutter={8}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#0D1117',
                border: '1px solid #1E2736',
                color: '#E8ECF0',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                borderRadius: '8px',
              },
              success: { iconTheme: { primary: '#00FF94', secondary: '#080B10' } },
              error:   { iconTheme: { primary: '#FF3B6B', secondary: '#080B10' } },
            }}
          />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
