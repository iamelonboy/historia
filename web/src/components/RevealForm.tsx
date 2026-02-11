'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { generateCommitHash } from '@/lib/hash';
import { callHistoria } from '@/lib/wallet';
import { CommitData } from '@/lib/types';

interface RevealFormProps {
  eventId: string;
  onSuccess?: () => void;
}

export function RevealForm({ eventId, onSuccess }: RevealFormProps) {
  const { connected, address } = useWallet();
  const [vote, setVote] = useState<boolean | null>(null);
  const [secret, setSecret] = useState('');
  const [savedCommit, setSavedCommit] = useState<CommitData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hashMatches, setHashMatches] = useState<boolean | null>(null);

  // Try to load saved commit data
  useEffect(() => {
    if (!address) return;

    const stored = localStorage.getItem(`historia_commit_${eventId}_${address}`);
    if (stored) {
      try {
        const data = JSON.parse(stored) as CommitData;
        setSavedCommit(data);
        setVote(data.vote);
        setSecret(data.secret);
      } catch {
        // Invalid stored data
      }
    }
  }, [address, eventId]);

  // Validate hash in real-time
  useEffect(() => {
    if (!address || !savedCommit || vote === null || !secret) {
      setHashMatches(null);
      return;
    }

    const computedHash = generateCommitHash(address, vote, secret.trim());
    setHashMatches(computedHash === savedCommit.hash);
  }, [address, vote, secret, savedCommit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address || vote === null || !secret) return;

    // Trim secret to remove any accidental whitespace
    const trimmedSecret = secret.trim();

    setIsSubmitting(true);
    setError(null);

    try {
      // Verify against saved commit if available
      if (savedCommit) {
        const expectedHash = generateCommitHash(address, vote, trimmedSecret);
        if (expectedHash !== savedCommit.hash) {
          setError(`Hash mismatch! Your inputs don't match your original commit. Expected: ${savedCommit.hash.substring(0, 16)}...`);
          setIsSubmitting(false);
          return;
        }
      }

      await callHistoria(
        address,
        'RevealVote',
        [eventId, vote ? 'true' : 'false', trimmedSecret],
        '' // No coins needed for reveal
      );

      // Clear stored commit data
      localStorage.removeItem(`historia_commit_${eventId}_${address}`);

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!connected) {
    return (
      <div className="py-24 text-center bg-[var(--card)] border border-[var(--border)]">
        <p className="text-[var(--muted)] text-base font-light">Connect your wallet to reveal</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-[var(--card)] border border-[var(--border)] p-10">
      <div>
        <h3 className="text-2xl font-light text-[var(--foreground)]">Reveal Your Vote</h3>
        <p className="text-sm text-[var(--muted)] mt-3 font-light">Your vote and secret must match your commit</p>
      </div>

      {savedCommit && (
        <div className="p-5 border border-[var(--border)] bg-[var(--gray-light)] space-y-2">
          <p className="text-sm text-[var(--foreground)] font-light">
            ✓ Found your saved commit! Vote and secret pre-filled.
          </p>
          <div className="text-xs text-[var(--muted)] font-mono space-y-1">
            <div>Committed vote: {savedCommit.vote ? 'VERIFY (true)' : 'REJECT (false)'}</div>
            <div>Committed hash: {savedCommit.hash.substring(0, 32)}...</div>
          </div>
        </div>
      )}

      {!savedCommit && address && (
        <div className="p-5 border border-[var(--border)] bg-[var(--gray-light)] text-sm font-light">
          <p className="text-[var(--foreground)]">
            ⚠️ No saved commit found for this wallet. Make sure to enter the exact vote and secret you used during commit phase.
          </p>
        </div>
      )}

      {/* Vote Selection */}
      <div>
        <label className="block text-sm font-light text-[var(--foreground)] mb-4 uppercase tracking-wider">
          Your Position (must match commit)
        </label>
        <div className="grid grid-cols-2 gap-px bg-[var(--border)]">
          <button
            type="button"
            onClick={() => setVote(true)}
            className={`py-5 text-sm font-light uppercase tracking-widest transition-colors ${
              vote === true
                ? 'bg-[var(--foreground)] text-[var(--background)]'
                : 'bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            VERIFY
          </button>
          <button
            type="button"
            onClick={() => setVote(false)}
            className={`py-5 text-sm font-light uppercase tracking-widest transition-colors ${
              vote === false
                ? 'bg-[var(--foreground)] text-[var(--background)]'
                : 'bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            REJECT
          </button>
        </div>
      </div>

      {/* Secret Input */}
      <div>
        <label className="block text-sm font-light text-[var(--foreground)] mb-3 uppercase tracking-wider">
          Your Secret
        </label>
        <input
          type="text"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Enter the secret you saved during commit"
          className={`w-full px-5 py-4 bg-[var(--background)] border text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none transition-colors font-mono text-sm font-light ${
            hashMatches === true ? 'border-green-500' :
            hashMatches === false ? 'border-red-500' :
            'border-[var(--border)] focus:border-[var(--foreground)]'
          }`}
        />
        {hashMatches === true && savedCommit && (
          <p className="text-xs text-green-600 mt-2 font-light">
            ✓ Hash matches! This will work.
          </p>
        )}
        {hashMatches === false && savedCommit && (
          <p className="text-xs text-red-600 mt-2 font-light">
            ✗ Hash doesn&apos;t match. Check your vote and secret.
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-5 border border-[var(--foreground)] bg-[var(--gray-light)] text-[var(--foreground)] text-sm font-light">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={vote === null || !secret || isSubmitting}
        className="w-full py-5 bg-[var(--foreground)] text-[var(--background)] font-light text-base disabled:opacity-30 disabled:cursor-not-allowed relative overflow-hidden group"
      >
        <span className="relative z-10 transition-colors duration-1000 group-hover:text-[var(--foreground)]">
          {isSubmitting ? 'Revealing...' : 'Reveal Vote'}
        </span>
        <div className="absolute inset-0 bg-[var(--background)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-1000 origin-left"></div>
      </button>

      <p className="text-xs text-[var(--muted)] text-center font-light">
        If your vote or secret don&apos;t match your commit, the transaction will fail.
      </p>
    </form>
  );
}
