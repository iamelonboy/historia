'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { generateSecret, generateCommitHash } from '@/lib/hash';
import { callHistoria } from '@/lib/wallet';
import { Tooltip } from './Tooltip';
import { CopyButton } from './CopyButton';

interface SubmitFormProps {
  onSuccess?: (eventId: string) => void;
}

export function SubmitForm({ onSuccess }: SubmitFormProps) {
  const { connected, address } = useWallet();
  const [description, setDescription] = useState('');
  const [stakeAmount, setStakeAmount] = useState('1.000'); // In GNOT now
  const [commitHours, setCommitHours] = useState('24');
  const [commitMinutes, setCommitMinutes] = useState('0');
  const [revealHours, setRevealHours] = useState('24');
  const [revealMinutes, setRevealMinutes] = useState('0');
  const [vote, setVote] = useState<boolean>(true);
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);
  const [secretConfirmed, setSecretConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [stakeError, setStakeError] = useState<string | null>(null);

  const handleGenerateSecret = () => {
    const secret = generateSecret();
    setGeneratedSecret(secret);
    setSecretConfirmed(false);
  };

  // Real-time stake validation
  const validateStake = (value: string) => {
    const stake = parseFloat(value);
    if (isNaN(stake) || stake < 1) {
      setStakeError('Minimum stake is 1 GNOT');
    } else if (stake > 1000) {
      setStakeError('Large stake detected - please confirm before submitting');
    } else {
      setStakeError(null);
    }
  };

  const handleStakeChange = (value: string) => {
    setStakeAmount(value);
    validateStake(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !generatedSecret || !secretConfirmed) return;

    const stake = parseFloat(stakeAmount);

    // Confirmation for large stakes (> 10 GNOT)
    if (stake > 10 && !showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Validation
      if (description.length === 0) {
        setError('Description cannot be empty');
        setIsSubmitting(false);
        return;
      }
      if (description.length > 280) {
        setError('Description too long (max 280 characters)');
        setIsSubmitting(false);
        return;
      }

      const stake = parseFloat(stakeAmount);
      if (isNaN(stake) || stake < 1) {
        setError('Minimum stake is 1 GNOT');
        setIsSubmitting(false);
        return;
      }

      const totalCommitMinutes = parseInt(commitHours) * 60 + parseInt(commitMinutes);
      const totalRevealMinutes = parseInt(revealHours) * 60 + parseInt(revealMinutes);

      if (totalCommitMinutes < 1) {
        setError('Commit phase must last at least 1 minute');
        setIsSubmitting(false);
        return;
      }

      if (totalRevealMinutes < 1) {
        setError('Reveal phase must last at least 1 minute');
        setIsSubmitting(false);
        return;
      }

      if (totalCommitMinutes + totalRevealMinutes > 43200) {
        setError('Total duration cannot exceed 30 days (43200 minutes)');
        setIsSubmitting(false);
        return;
      }

      const hash = generateCommitHash(address, vote, generatedSecret);
      // Convert GNOT to ugnot (1 GNOT = 1,000,000 ugnot)
      const stakeInUgnot = Math.floor(stake * 1000000);

      await callHistoria(
        address,
        'Submit',
        [description, String(stakeInUgnot), String(totalCommitMinutes), String(totalRevealMinutes), hash],
        `${stakeInUgnot}ugnot`
      );

      const commitData = {
        vote,
        secret: generatedSecret,
        hash,
        timestamp: Date.now(),
      };
      localStorage.setItem(`historia_pending_${address}`, JSON.stringify(commitData));

      onSuccess?.('1');
    } catch (err) {
      // Improved error messages
      let errorMessage = 'Transaction failed';
      if (err instanceof Error) {
        if (err.message.includes('insufficient funds')) {
          const stake = parseFloat(stakeAmount);
          errorMessage = `Insufficient GNOT balance. You need ${stake} GNOT to create this claim.`;
        } else if (err.message.includes('description')) {
          errorMessage = 'Invalid description. Please check the length and content.';
        } else if (err.message.includes('duration')) {
          errorMessage = 'Invalid phase duration. Please check your commit and reveal times.';
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
      setShowConfirmation(false);
    }
  };

  if (!connected) {
    return (
      <div className="py-24 text-center bg-[var(--card)] border border-[var(--border)]">
        <p className="text-[var(--muted)] text-lg">Connect your wallet to submit a claim</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-[var(--card)] border border-[var(--border)] p-10">
      {/* Claim Statement */}
      <div>
        <label className="block text-sm font-light text-[var(--foreground)] mb-3 uppercase tracking-wider">
          Claim Statement
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="The moon landing occurred in 1969"
          className={`w-full px-5 py-4 bg-[var(--background)] border transition-all text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none resize-none ${
            description.length > 280
              ? 'border-red-500 focus:border-red-500'
              : 'border-[var(--border)] focus:border-[var(--foreground)]'
          }`}
          rows={4}
          maxLength={280}
        />
        <p className={`text-xs mt-2 font-light ${
          description.length > 280 ? 'text-red-500' :
          description.length > 250 ? 'text-orange-500' :
          'text-[var(--muted)]'
        }`}>
          {description.length > 280 ? '❌ ' : ''}{description.length}/280 characters
          {description.length > 280 ? ' (too long)' : ''}
        </p>
      </div>

      {/* Stake Amount */}
      <div>
        <label className="block text-sm font-light text-[var(--foreground)] mb-3 uppercase tracking-wider">
          <Tooltip text="The amount you stake to propose this claim. Required to vote on your own proposal.">
            Stake Amount (GNOT)
          </Tooltip>
        </label>
        <input
          type="number"
          value={stakeAmount}
          onChange={(e) => handleStakeChange(e.target.value)}
          min="1"
          step="0.001"
          placeholder="1.000"
          className={`w-full px-5 py-4 bg-[var(--background)] border transition-all focus:outline-none ${
            stakeError && parseFloat(stakeAmount) < 1
              ? 'border-red-500 focus:border-red-500'
              : 'border-[var(--border)] focus:border-[var(--foreground)]'
          } text-[var(--foreground)]`}
        />
        {stakeError && parseFloat(stakeAmount) < 1 ? (
          <p className="mt-2 text-xs text-red-500 font-light">❌ {stakeError}</p>
        ) : (
          <p className="mt-2 text-xs text-[var(--muted)] font-light">
            Minimum: 1 GNOT (to prevent spam)
          </p>
        )}
      </div>

      {/* Phase Durations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Commit Phase */}
        <div>
          <label className="block text-sm font-light text-[var(--foreground)] mb-3 uppercase tracking-wider">
            <Tooltip text="Time window for voters to commit their hidden votes">
              Commit Phase Duration
            </Tooltip>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="number"
                value={commitHours}
                onChange={(e) => setCommitHours(e.target.value)}
                min="0"
                max="360"
                placeholder="Hours"
                className="w-full px-5 py-4 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)] transition-all"
                    />
              <p className="mt-1 text-xs text-[var(--muted)] font-light">Hours</p>
            </div>
            <div>
              <input
                type="number"
                value={commitMinutes}
                onChange={(e) => setCommitMinutes(e.target.value)}
                min="0"
                max="59"
                placeholder="Minutes"
                className="w-full px-5 py-4 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)] transition-all"
              />
              <p className="mt-1 text-xs text-[var(--muted)] font-light">Minutes</p>
            </div>
          </div>
        </div>

        {/* Reveal Phase */}
        <div>
          <label className="block text-sm font-light text-[var(--foreground)] mb-3 uppercase tracking-wider">
            <Tooltip text="Time window for voters to reveal their votes using their secret">
              Reveal Phase Duration
            </Tooltip>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="number"
                value={revealHours}
                onChange={(e) => setRevealHours(e.target.value)}
                min="0"
                max="360"
                placeholder="Hours"
                className="w-full px-5 py-4 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)] transition-all"
                    />
              <p className="mt-1 text-xs text-[var(--muted)] font-light">Hours</p>
            </div>
            <div>
              <input
                type="number"
                value={revealMinutes}
                onChange={(e) => setRevealMinutes(e.target.value)}
                min="0"
                max="59"
                placeholder="Minutes"
                className="w-full px-5 py-4 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)] transition-all"
              />
              <p className="mt-1 text-xs text-[var(--muted)] font-light">Minutes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Your Position */}
      <div>
        <label className="block text-sm font-light text-[var(--foreground)] mb-4 uppercase tracking-wider">
          Your Position
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setVote(true)}
            className={`py-5 text-sm font-light uppercase tracking-widest border transition-all ${
              vote
                ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
                : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            VERIFY
          </button>
          <button
            type="button"
            onClick={() => setVote(false)}
            className={`py-5 text-sm font-light uppercase tracking-widest border transition-all ${
              !vote
                ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
                : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            REJECT
          </button>
        </div>
      </div>

      {/* Secret Generation */}
      <div>
        <label className="block text-sm font-light text-[var(--foreground)] mb-3 uppercase tracking-wider">
          <Tooltip text="Save this secret to reveal your vote later. Without it, you'll forfeit your stake!">
            Secret (for reveal phase)
          </Tooltip>
        </label>
        {!generatedSecret ? (
          <button
            type="button"
            onClick={handleGenerateSecret}
            className="w-full py-4 border border-[var(--border)] text-[var(--foreground)] font-light hover:border-[var(--foreground)] transition-all"
          >
            Generate Secret
          </button>
        ) : (
          <div className="space-y-4">
            <div className="p-6 bg-[var(--gray-light)] border border-[var(--border)]">
              <p className="text-xs text-[var(--muted)] mb-3 uppercase tracking-widest font-light">
                ⚠️ Save this secret — you need it to reveal your vote
              </p>
              <div className="flex items-start gap-2">
                <code className="flex-1 p-4 bg-[var(--background)] border border-[var(--border)] text-xs font-mono text-[var(--foreground)] break-all">
                  {generatedSecret}
                </code>
                <CopyButton text={generatedSecret} />
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={secretConfirmed}
                onChange={(e) => setSecretConfirmed(e.target.checked)}
                className="w-5 h-5 border-[var(--border)]"
              />
              <span className="text-sm text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors font-light">
                I have saved my secret
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-5 border-2 border-[var(--foreground)] bg-[var(--gray-light)] text-[var(--foreground)] text-sm font-light">
          ❌ {error}
        </div>
      )}

      {/* Confirmation Modal for Large Stakes */}
      {showConfirmation && (
        <div className="p-6 border-2 border-[var(--foreground)] bg-[var(--card)]">
          <h4 className="text-lg font-light text-[var(--foreground)] mb-3">⚠️ Confirm Large Stake</h4>
          <p className="text-sm text-[var(--muted)] font-light mb-4">
            You are about to create a claim with a stake of <strong>{parseFloat(stakeAmount).toFixed(3)} GNOT</strong>.
          </p>
          <p className="text-sm text-[var(--muted)] font-light mb-6">
            <strong>This action cannot be undone.</strong> Make sure you have saved your secret and are ready to commit.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowConfirmation(false)}
              className="flex-1 py-3 border border-[var(--border)] text-[var(--foreground)] font-light hover:border-[var(--foreground)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-[var(--foreground)] text-[var(--background)] font-light hover:opacity-80 transition-opacity"
            >
              Confirm & Submit
            </button>
          </div>
        </div>
      )}

      {/* Submit */}
      {!showConfirmation && (
        <button
          type="submit"
          disabled={!description || !generatedSecret || !secretConfirmed || isSubmitting || (stakeError !== null && parseFloat(stakeAmount) < 1)}
          className="w-full py-5 bg-[var(--foreground)] text-[var(--background)] font-light text-lg disabled:opacity-30 disabled:cursor-not-allowed relative overflow-hidden group"
        >
          <span className="relative z-10 transition-colors duration-1000 group-hover:text-[var(--foreground)]">
            {isSubmitting ? 'Submitting...' : `Submit Claim (${parseFloat(stakeAmount).toFixed(3)} GNOT)`}
          </span>
          <div className="absolute inset-0 bg-[var(--background)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-1000 origin-left"></div>
        </button>
      )}
    </form>
  );
}
