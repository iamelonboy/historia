'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { generateSecret, generateCommitHash } from '@/lib/hash';
import { callHistoria } from '@/lib/wallet';
import { Tooltip } from './Tooltip';
import { CopyButton } from './CopyButton';

interface CommitFormProps {
  eventId: string;
  stakeAmount: number;
  currentCommits?: number;
  poolGnot?: number;
  onSuccess?: () => void;
}

export function CommitForm({ eventId, stakeAmount, currentCommits = 0, poolGnot = 0, onSuccess }: CommitFormProps) {
  const { connected, address } = useWallet();
  const [vote, setVote] = useState<boolean | null>(null);
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);
  const [secretConfirmed, setSecretConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleGenerateSecret = () => {
    if (vote === null) return;
    const secret = generateSecret();
    setGeneratedSecret(secret);
    setSecretConfirmed(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address || !generatedSecret || !secretConfirmed || vote === null) return;

    // Confirmation for large stakes (> 10 GNOT)
    if (stakeAmount > 10_000000 && !showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const hash = generateCommitHash(address, vote, generatedSecret);

      await callHistoria(
        address,
        'CommitVote',
        [eventId, hash],
        `${stakeAmount}ugnot`
      );

      // Store secret locally for reveal phase
      const commitData = {
        eventId,
        vote,
        secret: generatedSecret,
        hash,
        timestamp: Date.now(),
      };
      localStorage.setItem(`historia_commit_${eventId}_${address}`, JSON.stringify(commitData));

      onSuccess?.();
    } catch (err) {
      // Improved error messages
      let errorMessage = 'Transaction failed';
      if (err instanceof Error) {
        if (err.message.includes('insufficient funds')) {
          errorMessage = `Insufficient GNOT balance. You need ${stakeAmount / 1000000} GNOT to vote.`;
        } else if (err.message.includes('already voted')) {
          errorMessage = 'You have already voted on this event. Check your profile.';
        } else if (err.message.includes('commit phase ended')) {
          errorMessage = 'Commit phase has ended. Wait for the reveal phase to start.';
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
        <p className="text-[var(--muted)] text-base font-light">Connect your wallet to vote</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-[var(--card)] border border-[var(--border)] p-10">
      <div>
        <h3 className="text-2xl font-light text-[var(--foreground)]">
          <Tooltip text="Your vote is hidden during commit, revealed later to prevent manipulation">
            Commit Your Vote
          </Tooltip>
        </h3>
        <p className="text-sm text-[var(--muted)] mt-3 font-light">Your vote will be hidden until the reveal phase</p>
      </div>

      {/* Vote Selection */}
      <div>
        <label className="block text-sm font-light text-[var(--foreground)] mb-4 uppercase tracking-wider">
          Your Position
        </label>
        <div className="grid grid-cols-2 gap-px bg-[var(--border)]">
          <button
            type="button"
            onClick={() => { setVote(true); setGeneratedSecret(null); }}
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
            onClick={() => { setVote(false); setGeneratedSecret(null); }}
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

      {/* Gain Calculator */}
      {vote !== null && (
        <div className="p-6 bg-[var(--gray-light)] border border-[var(--border)]">
          <h4 className="text-sm font-light text-[var(--foreground)] mb-4 uppercase tracking-wider">
            Potential Earnings Calculator
          </h4>

          <div className="space-y-4 text-sm">
            {/* Current Pool Stats */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[var(--border)]">
              <div>
                <p className="text-xs text-[var(--muted)] uppercase tracking-wider mb-1 font-light">Current Pool</p>
                <p className="text-xl font-light text-[var(--foreground)]">{poolGnot} GNOT</p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted)] uppercase tracking-wider mb-1 font-light">Current Votes</p>
                <p className="text-xl font-light text-[var(--foreground)]">{currentCommits}</p>
              </div>
            </div>

            {/* Scenario: Win with 50/50 split */}
            <div>
              <p className="text-xs text-[var(--muted)] uppercase tracking-wider mb-2 font-light">
                If you win (50/50 split scenario)
              </p>
              <div className="bg-[var(--background)] border border-[var(--border)] p-4">
                {(() => {
                  const yourStake = stakeAmount / 1000000;
                  const totalAfterYou = poolGnot + yourStake;
                  const assumedVoters = Math.max(currentCommits + 1, 2);
                  const winningVoters = Math.ceil(assumedVoters / 2);
                  const losingVoters = assumedVoters - winningVoters;
                  const losingPool = (losingVoters / assumedVoters) * totalAfterYou;
                  const feeAmount = losingPool * 0.02; // 2% total fee (1% proposer + 1% founder)
                  const distributedPool = losingPool - feeAmount;
                  const yourShare = distributedPool / winningVoters;
                  const yourTotal = yourStake + yourShare;
                  const yourGain = yourTotal - yourStake;

                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[var(--muted)] font-light">Your stake:</span>
                        <span className="text-[var(--foreground)] font-light">{yourStake.toFixed(2)} GNOT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--muted)] font-light">Your share from losing pool:</span>
                        <span className="text-[var(--foreground)] font-light">+{yourShare.toFixed(2)} GNOT</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--muted)] font-light">(Fee deducted: {feeAmount.toFixed(2)} GNOT)</span>
                        <span className="text-[var(--muted)] font-light"></span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-[var(--border)]">
                        <span className="text-[var(--foreground)] font-light"><strong>Total return:</strong></span>
                        <span className="text-[var(--foreground)] font-light"><strong>{yourTotal.toFixed(2)} GNOT</strong></span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-600 font-light"><strong>Net gain:</strong></span>
                        <span className="text-green-600 font-light"><strong>+{yourGain.toFixed(2)} GNOT</strong></span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Note */}
            <p className="text-xs text-[var(--muted)] font-light italic">
              * Actual earnings depend on final vote distribution. If you lose or don't reveal, you forfeit your stake.
            </p>
          </div>
        </div>
      )}

      {/* Secret Generation */}
      {vote !== null && (
        <div>
          <label className="block text-sm font-light text-[var(--foreground)] mb-3 uppercase tracking-wider">
            Secret (for reveal phase)
          </label>
          {!generatedSecret ? (
            <button
              type="button"
              onClick={handleGenerateSecret}
              className="w-full py-4 border border-[var(--border)] text-[var(--foreground)] font-light hover:border-[var(--foreground)] transition-colors"
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
                  className="w-4 h-4 border-[var(--border)]"
                />
                <span className="text-sm text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors font-light">
                  I have saved my secret
                </span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-5 border border-[var(--foreground)] bg-[var(--gray-light)] text-[var(--foreground)] text-sm font-light">
          ❌ {error}
        </div>
      )}

      {/* Confirmation Modal for Large Stakes */}
      {showConfirmation && (
        <div className="p-6 border-2 border-[var(--foreground)] bg-[var(--card)]">
          <h4 className="text-lg font-light text-[var(--foreground)] mb-3">⚠️ Confirm Large Stake</h4>
          <p className="text-sm text-[var(--muted)] font-light mb-4">
            You are about to stake <strong>{stakeAmount / 1000000} GNOT</strong> on this event.
          </p>
          <p className="text-sm text-[var(--muted)] font-light mb-6">
            <strong>This action cannot be undone.</strong> If you lose or don't reveal, you will forfeit your stake.
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
              Confirm & Stake
            </button>
          </div>
        </div>
      )}

      {/* Submit */}
      {!showConfirmation && (
        <button
          type="submit"
          disabled={vote === null || !generatedSecret || !secretConfirmed || isSubmitting}
          className="w-full py-5 bg-[var(--foreground)] text-[var(--background)] font-light text-base disabled:opacity-30 disabled:cursor-not-allowed relative overflow-hidden group"
        >
          <span className="relative z-10 transition-colors duration-1000 group-hover:text-[var(--foreground)]">
            {isSubmitting ? 'Committing...' : `Commit Vote (${stakeAmount / 1000000} GNOT)`}
          </span>
          <div className="absolute inset-0 bg-[var(--background)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-1000 origin-left"></div>
        </button>
      )}
    </form>
  );
}
