'use client';

import { useState, useEffect, useCallback } from 'react';
import { WalletState } from '@/lib/types';
import {
  isAdenaInstalled,
  connectWallet as connectAdena,
  getAccount,
  disconnectWallet as disconnectAdena,
} from '@/lib/wallet';

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    connected: false,
    address: null,
    chainId: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check connection on mount
  useEffect(() => {
    async function checkConnection() {
      if (!isAdenaInstalled()) return;

      try {
        const account = await getAccount();
        if (account) {
          setState({
            connected: true,
            address: account.address,
            chainId: account.chainId,
          });
        }
      } catch {
        // Not connected, that's fine
      }
    }

    checkConnection();
  }, []);

  const connect = useCallback(async () => {
    if (!isAdenaInstalled()) {
      setError('Adena wallet not installed. Please install from adena.app');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { address, chainId } = await connectAdena();
      setState({
        connected: true,
        address,
        chainId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectAdena();
    setState({
      connected: false,
      address: null,
      chainId: null,
    });
  }, []);

  return {
    ...state,
    isLoading,
    error,
    connect,
    disconnect,
    isInstalled: typeof window !== 'undefined' && isAdenaInstalled(),
  };
}
