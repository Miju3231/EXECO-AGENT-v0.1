import { useCallback, useRef } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import toast from 'react-hot-toast';
import { useStore } from '../stores/appStore';
import { detectIntent, chatReply, type ChatMsg } from '../lib/aiProvider';
import {
  executeSend, executeSwap, switchNetwork,
  addChainToWallet, estimateGasCost, getBalance,
} from '../lib/web3';
import { getNetworkByName, getNetworkById, BRIDGE_ROUTES } from '../config/networks';
import type { TxConfirmData } from '../types';

export function useChat() {
  const {
    messages, addMessage, updateMessage,
    settings, isBusy, setBusy,
    setPendingTx,
  } = useStore();

  const { address, chain } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Conversation history for multi-turn context
  const history = useRef<ChatMsg[]>([]);

  const walletCtx = address
    ? `Wallet: ${address}\nNetwork: ${chain?.name || 'Unknown'} (chainId: ${chain?.id ?? 'unknown'})`
    : 'No wallet connected';

  // ─── Send a user message ──────────────────────────────────────────────────

  const send = useCallback(async (input: string) => {
    const text = input.trim();
    if (!text || isBusy) return;

    addMessage({ role: 'user', type: 'text', content: text });
    history.current.push({ role: 'user', content: text });

    setBusy(true);
    const loadId = addMessage({ role: 'ai', type: 'loading', content: '' });

    try {
      // Detect intent
      const intent = await detectIntent(text, settings.aiConfig);

      // ── Pure conversation / query ──────────────────────────────────────────
      if (intent.action === 'none' || intent.action === 'query') {
        // Handle balance queries specially
        if (intent.action === 'query' && address && publicClient && chain?.id) {
          const lower = text.toLowerCase();
          const tokenMatch = lower.match(/\b(eth|matic|bnb|arc|usdc|usdt|dai|weth)\b/);
          if (lower.includes('balance') && tokenMatch) {
            try {
              const bal = await getBalance(publicClient, address as `0x${string}`, tokenMatch[1].toUpperCase(), chain.id);
              const reply = `Your ${tokenMatch[1].toUpperCase()} balance: **${bal}**`;
              history.current.push({ role: 'assistant', content: reply });
              updateMessage(loadId, { type: 'text', content: reply });
              return;
            } catch { /* fall through to AI */ }
          }

          // Gas query
          if (lower.includes('gas')) {
            try {
              const gas = await estimateGasCost(publicClient);
              const reply = `Current gas estimate for a basic transfer: **${gas}**`;
              history.current.push({ role: 'assistant', content: reply });
              updateMessage(loadId, { type: 'text', content: reply });
              return;
            } catch { /* fall through to AI */ }
          }
        }

        const reply = await chatReply(history.current, settings.aiConfig, walletCtx);
        history.current.push({ role: 'assistant', content: reply });
        updateMessage(loadId, { type: 'text', content: reply });
        return;
      }

      // ── Network switch ─────────────────────────────────────────────────────
      if (intent.action === 'switch_network') {
        const net = getNetworkByName(intent.network || '');
        if (!net) {
          updateMessage(loadId, { type: 'error', content: `Unknown network: "${intent.network}". Supported: Sepolia, Mumbai, BSC Testnet, Arbitrum Sepolia, Base Sepolia, Optimism Sepolia, Arc Testnet.` });
          return;
        }
        updateMessage(loadId, { type: 'text', content: `Switching to ${net.name}...` });
        await switchNetwork(net.id);
        const reply = `✓ Switched to ${net.name}`;
        history.current.push({ role: 'assistant', content: reply });
        updateMessage(loadId, { type: 'text', content: reply });
        toast.success(`Switched to ${net.name}`);
        return;
      }

      // ── SEND ───────────────────────────────────────────────────────────────
      if (intent.action === 'send') {
        const missing: string[] = [];
        if (!intent.token)     missing.push('token (e.g. ETH, USDC)');
        if (!intent.amount)    missing.push('amount');
        if (!intent.toAddress) missing.push('recipient address (0x...)');

        if (missing.length > 0) {
          const reply = `I need a bit more info — please provide: **${missing.join(', ')}**.`;
          history.current.push({ role: 'assistant', content: reply });
          updateMessage(loadId, { type: 'text', content: reply });
          return;
        }

        // Gas estimate
        let gasEst = '~$0.01';
        if (publicClient) {
          try { gasEst = await estimateGasCost(publicClient); } catch { /* ignore */ }
        }

        const confirmData: TxConfirmData = {
          action: 'send',
          token: intent.token!.toUpperCase(),
          amount: intent.amount!,
          toAddress: intent.toAddress!,
          network: chain?.name,
          chainId: chain?.id,
          estimatedGas: gasEst,
        };

        updateMessage(loadId, { type: 'confirm', content: 'Review transaction:', confirmData });
        setPendingTx({ msgId: loadId, data: confirmData });
        return;
      }

      // ── SWAP ───────────────────────────────────────────────────────────────
      if (intent.action === 'swap') {
        const missing: string[] = [];
        if (!intent.fromToken) missing.push('from token');
        if (!intent.toToken)   missing.push('to token');
        if (!intent.amount)    missing.push('amount');

        if (missing.length > 0) {
          const reply = `Please tell me: **${missing.join(', ')}**.`;
          history.current.push({ role: 'assistant', content: reply });
          updateMessage(loadId, { type: 'text', content: reply });
          return;
        }

        const confirmData: TxConfirmData = {
          action: 'swap',
          fromToken: intent.fromToken!.toUpperCase(),
          toToken: intent.toToken!.toUpperCase(),
          amount: intent.amount!,
          network: chain?.name,
          chainId: chain?.id,
          slippage: `${settings.defaultSlippage}%`,
          estimatedGas: '~$0.05',
        };

        updateMessage(loadId, { type: 'confirm', content: 'Review swap:', confirmData });
        setPendingTx({ msgId: loadId, data: confirmData });
        return;
      }

      // ── BRIDGE ─────────────────────────────────────────────────────────────
      if (intent.action === 'bridge') {
        const missing: string[] = [];
        if (!intent.token)       missing.push('token');
        if (!intent.amount)      missing.push('amount');
        if (!intent.fromNetwork) missing.push('source network');
        if (!intent.toNetwork)   missing.push('destination network');

        if (missing.length > 0) {
          const reply = `Please provide: **${missing.join(', ')}**.`;
          history.current.push({ role: 'assistant', content: reply });
          updateMessage(loadId, { type: 'text', content: reply });
          return;
        }

        const fromNet = getNetworkByName(intent.fromNetwork!);
        const toNet   = getNetworkByName(intent.toNetwork!);

        if (!fromNet || !toNet) {
          updateMessage(loadId, { type: 'error', content: `Unrecognized network name. Check supported networks.` });
          return;
        }

        const allowedRoutes = BRIDGE_ROUTES[fromNet.id] || [];
        if (!allowedRoutes.includes(toNet.id)) {
          updateMessage(loadId, {
            type: 'error',
            content: `Bridge route ${fromNet.name} → ${toNet.name} is not supported. Supported routes: Sepolia ↔ Mumbai, Arbitrum Sepolia, Base Sepolia, Optimism Sepolia.`,
          });
          return;
        }

        const confirmData: TxConfirmData = {
          action: 'bridge',
          token: intent.token!.toUpperCase(),
          amount: intent.amount!,
          fromNetwork: fromNet.name,
          toNetwork: toNet.name,
          chainId: fromNet.id,
          estimatedFee: '~$0.50',
          estimatedTime: '~5–15 min',
        };

        updateMessage(loadId, { type: 'confirm', content: 'Review bridge:', confirmData });
        setPendingTx({ msgId: loadId, data: confirmData });
        return;
      }

      // Fallback
      const reply = await chatReply(history.current, settings.aiConfig, walletCtx);
      history.current.push({ role: 'assistant', content: reply });
      updateMessage(loadId, { type: 'text', content: reply });

    } catch (err: any) {
      const msg = err?.message || 'Something went wrong.';
      updateMessage(loadId, { type: 'error', content: msg });
      toast.error(msg.slice(0, 80));
    } finally {
      setBusy(false);
    }
  }, [isBusy, address, chain, publicClient, settings, walletCtx, addMessage, updateMessage, setBusy, setPendingTx]);

  // ─── Confirm TX ───────────────────────────────────────────────────────────

  const confirm = useCallback(async (msgId: string, data: TxConfirmData) => {
    if (!address || !walletClient || !publicClient || !chain) {
      toast.error('Wallet not connected');
      return;
    }

    setBusy(true);
    updateMessage(msgId, {
      type: 'text',
      content: 'Processing...',
      confirmData: undefined,
      steps: [
        { label: 'Validating', status: 'done' },
        { label: 'Waiting for wallet signature', status: 'loading' },
        { label: 'Broadcasting transaction', status: 'pending' },
        { label: 'Confirming on-chain', status: 'pending' },
      ],
    });

    try {
      let hash: `0x${string}`;

      if (data.action === 'send') {
        hash = await executeSend(
          walletClient, publicClient,
          address as `0x${string}`, chain.id,
          data.toAddress!, data.token!, data.amount!
        );
      } else if (data.action === 'swap') {
        hash = await executeSwap(
          walletClient, publicClient,
          address as `0x${string}`, chain.id,
          data.fromToken!, data.toToken!, data.amount!,
          settings.defaultSlippage
        );
      } else {
        throw new Error('Bridge is coming soon. Use stargate.finance for testnet bridging.');
      }

      const net = getNetworkById(chain.id);
      const explorerUrl = net ? `${net.explorerUrl}/tx/${hash}` : `#`;

      updateMessage(msgId, {
        type: 'tx_result',
        content: 'Transaction confirmed!',
        steps: [
          { label: 'Validating', status: 'done' },
          { label: 'Wallet signed', status: 'done' },
          { label: 'Transaction broadcast', status: 'done' },
          { label: 'Confirmed on-chain', status: 'done' },
        ],
        txResult: { hash, status: 'success', explorerUrl, action: data.action, network: chain.name },
      });

      toast.success('Transaction confirmed! ✓');
      history.current.push({ role: 'assistant', content: `Transaction confirmed. Hash: ${hash}` });

    } catch (err: any) {
      const msg = err?.message || 'Transaction failed';
      updateMessage(msgId, {
        type: 'error',
        content: `TX Failed: ${msg}`,
        steps: undefined,
      });
      toast.error(msg.slice(0, 80));
    } finally {
      setBusy(false);
      setPendingTx(null);
    }
  }, [address, walletClient, publicClient, chain, settings.defaultSlippage, updateMessage, setBusy, setPendingTx]);

  // ─── Cancel TX ────────────────────────────────────────────────────────────

  const cancel = useCallback((msgId: string) => {
    updateMessage(msgId, { type: 'text', content: 'Transaction cancelled.', confirmData: undefined });
    setPendingTx(null);
    toast('Cancelled', { icon: '✕' });
  }, [updateMessage, setPendingTx]);

  return { messages, send, confirm, cancel, isBusy };
}
