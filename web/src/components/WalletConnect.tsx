'use client';

import { useWallet } from '@/contexts/WalletContext';

export function WalletConnect() {
  const { connected, address, isLoading, error, connect, disconnect, isInstalled } = useWallet();

  if (!isInstalled) {
    return (
      <a
        href="https://adena.app"
        target="_blank"
        rel="noopener noreferrer"
        className="px-5 py-2 text-xs font-light border border-[var(--border)] hover:border-[var(--foreground)] transition-colors"
      >
        Install Wallet
      </a>
    );
  }

  if (connected && address) {
    return (
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-mono border border-[var(--border)] bg-[var(--card)] font-light">
          <div className="w-1 h-1 bg-[var(--foreground)]"></div>
          {address.slice(0, 6)}...{address.slice(-4)}
        </div>
        <button
          onClick={disconnect}
          className="px-3 py-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] font-light transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={connect}
        disabled={isLoading}
        className="px-6 py-2 text-xs font-light bg-[var(--foreground)] text-[var(--background)] hover:bg-[var(--muted)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Connecting...' : 'Connect'}
      </button>
      {error && <span className="text-[10px] text-[var(--foreground)] font-light">{error}</span>}
    </div>
  );
}
