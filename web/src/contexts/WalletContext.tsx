'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { WalletState } from '@/lib/types';
import {
  isAdenaInstalled,
  connectWallet as connectAdena,
  getAccount,
  disconnectWallet as disconnectAdena,
} from '@/lib/wallet';

interface WalletContextType {
  connected: boolean;
  address: string | null;
  chainId: string | null;
  isLoading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isInstalled: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    connected: false,
    address: null,
    chainId: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Check for Adena installation on mount and periodically
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10;

    const checkInstallation = () => {
      if (isAdenaInstalled()) {
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkInstallation()) {
      return;
    }

    // Check every 100ms for up to 1 second
    const interval = setInterval(() => {
      attempts++;
      if (checkInstallation() || attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Check connection on mount
  useEffect(() => {
    async function checkConnection() {
      if (!isInstalled) return;

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
  }, [isInstalled]);

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

  return (
    <WalletContext.Provider
      value={{
        ...state,
        isLoading,
        error,
        connect,
        disconnect,
        isInstalled,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
