'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { callHistoria } from '@/lib/wallet';

interface ResolveButtonProps {
  eventId: string;
  onSuccess?: () => void;
}

export function ResolveButton({ eventId, onSuccess, revealEndTimestamp }: ResolveButtonProps & { revealEndTimestamp?: number }) {
  const { connected, address } = useWallet();
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation on mount
  useEffect(() => {
    if (revealEndTimestamp) {
      const now = Math.floor(Date.now() / 1000);
      const diff = now - revealEndTimestamp;
      // Check if reveal phase has truly ended
      if (diff <= 0) {
        setError(`Reveal phase not yet ended. Wait ${Math.ceil(-diff / 60)} minute(s).`);
      }
    }
  }, [eventId, connected, address, revealEndTimestamp]);

  const handleResolve = async () => {
    if (!connected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!address || address.trim() === '') {
      setError(`Invalid wallet address. Connected: ${connected}, Address: "${address}". Please reconnect your wallet.`);
      return;
    }

    setIsResolving(true);
    setError(null);

    try {
      await callHistoria(
        address,
        'Resolve',
        [eventId],
        '' // No coins needed for resolve
      );

      onSuccess?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to resolve';

      let detailedError = errorMsg;
      if (errorMsg.includes('4000') || errorMsg.includes('Failed to estimate gas')) {
        const now = Math.floor(Date.now() / 1000);
        const timeUntilEnd = revealEndTimestamp ? revealEndTimestamp - now : 0;

        if (timeUntilEnd > 0) {
          detailedError = `Reveal phase not yet ended on blockchain. Wait ${Math.ceil(timeUntilEnd / 60)} more minutes.`;
        } else {
          detailedError = `${errorMsg} - Possible causes: 1) Reveal phase not ended on blockchain (time sync issue), 2) Event already resolved, or 3) No reveals were made.`;
        }
      }

      setError(detailedError);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] p-10">
      <div className="text-center space-y-6">
        <div>
          <h3 className="text-2xl font-light text-[var(--foreground)] mb-3">Reveal Phase Ended</h3>
          <p className="text-sm text-[var(--muted)] font-light">
            This event needs to be resolved. Anyone can call the resolve function to finalize the outcome and distribute stakes.
          </p>
        </div>

        {!connected && (
          <div className="p-5 border border-[var(--border)] bg-[var(--gray-light)] text-[var(--foreground)] text-sm font-light">
            ⚠️ Please connect your wallet to resolve this event
          </div>
        )}

        {error && (
          <div className="p-5 border border-[var(--foreground)] bg-[var(--gray-light)] text-[var(--foreground)] text-sm font-light">
            {error}
          </div>
        )}

        <button
          onClick={handleResolve}
          disabled={isResolving || !connected || !address}
          className="w-full py-5 bg-[var(--foreground)] text-[var(--background)] font-light text-base disabled:opacity-30 disabled:cursor-not-allowed relative overflow-hidden group"
        >
          <span className="relative z-10 transition-colors duration-1000 group-hover:text-[var(--foreground)]">
            {isResolving ? 'Resolving...' : !connected ? 'Connect Wallet First' : 'Resolve Event'}
          </span>
          <div className="absolute inset-0 bg-[var(--background)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-1000 origin-left"></div>
        </button>

        <p className="text-xs text-[var(--muted)] font-light">
          This will finalize the voting outcome and distribute stakes to winners.
        </p>

        {connected && address && (
          <p className="text-xs text-[var(--muted)] font-mono font-light">
            Calling as: {address.slice(0, 12)}...{address.slice(-8)}
          </p>
        )}
      </div>
    </div>
  );
}
