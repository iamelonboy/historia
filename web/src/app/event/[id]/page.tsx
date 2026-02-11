'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { render, parseEventDetail } from '@/lib/gno';
import { HistoriaEvent } from '@/lib/types';
import { WalletConnect } from '@/components/WalletConnect';
import { StatusBadge, OutcomeBadge } from '@/components/StatusBadge';
import { CommitForm } from '@/components/CommitForm';
import { RevealForm } from '@/components/RevealForm';
import { CountdownTimer } from '@/components/CountdownTimer';
import { ResolveButton } from '@/components/ResolveButton';
import { useWallet } from '@/contexts/WalletContext';
import { Footer } from '@/components/Footer';

export default function EventDetailPage() {
  const { connected, address } = useWallet();
  const params = useParams();
  const eventId = params.id as string;
  const [event, setEvent] = useState<HistoriaEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvent() {
      try {
        const markdown = await render(eventId);
        const parsed = parseEventDetail(markdown);
        setEvent(parsed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load event');
      } finally {
        setIsLoading(false);
      }
    }

    loadEvent();
  }, [eventId]);

  // Auto-refresh during active phases (every 15 seconds)
  useEffect(() => {
    if (!event || event.status === 'RESOLVED' || event.status === 'VOIDED') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const markdown = await render(eventId);
        const parsed = parseEventDetail(markdown);
        setEvent(parsed);
      } catch {
        // Ignore refresh errors
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [event, eventId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border border-[var(--border)] border-t-[var(--foreground)] animate-spin mb-6"></div>
          <p className="text-sm text-[var(--muted)] font-light">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-base text-[var(--muted)] mb-6 font-light">{error || 'Event not found'}</p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--foreground)] text-[var(--background)] hover:bg-[var(--muted)] transition-colors font-light">
            <span>←</span>
            <span>Back</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-[var(--card)] border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-20">
              <Link href="/" className="text-2xl font-light text-[var(--foreground)] tracking-tight">
                HISTORIA
              </Link>
              <Link
                href="/memoria"
                className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors font-light"
              >
                Archive
              </Link>
            </div>
            <div className="flex items-center gap-6">
              {connected && address && (
                <Link
                  href="/profile"
                  className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors font-light"
                >
                  Profile
                </Link>
              )}
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 lg:px-16 py-12">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors font-light">
            <span>←</span>
            <span>Back</span>
          </Link>
        </div>

        {/* Contest Genealogy */}
        {event.version > 1 && event.parentId && (
          <div className="bg-[var(--card)] border border-[var(--border)] p-6 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--muted)] uppercase tracking-wider font-light">Genealogy</span>
              <div className="flex-1 h-px bg-[var(--border)]"></div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Link
                href={`/event/${event.parentId}`}
                className="text-sm text-[var(--foreground)] hover:text-[var(--muted)] transition-colors font-light font-mono"
              >
                ← Event #{event.parentId} (v{event.version - 1})
              </Link>
              <span className="text-xs text-[var(--muted)] font-light">contested by this event</span>
            </div>
          </div>
        )}

        {/* Event Info */}
        <div className="bg-[var(--card)] border border-[var(--border)] p-8 mb-8">
          <div className="flex items-start justify-between gap-8 mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-5">
                <span className="text-xs font-mono text-[var(--muted)] font-light">#{event.id}</span>
                <StatusBadge status={event.status} />
                {event.version > 1 && (
                  <span className="px-2 py-0.5 text-xs bg-[var(--gray-light)] text-[var(--muted)] font-light">
                    Contest v{event.version}
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-light text-[var(--foreground)] leading-tight">{event.description}</h1>
            </div>
            {event.outcome && event.outcome !== 'PENDING' && (
              <div className="flex-shrink-0">
                <OutcomeBadge outcome={event.outcome} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pt-8 border-t border-[var(--border)]">
            <div>
              <p className="text-xs text-[var(--muted)] mb-3 uppercase tracking-widest font-light">Proposer</p>
              <p className="text-sm font-mono text-[var(--foreground)] font-light">
                {event.proposer.slice(0, 8)}...
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)] mb-3 uppercase tracking-widest font-light">Stake/Vote</p>
              <p className="text-lg font-light text-[var(--foreground)]">
                {event.stakeAmount / 1000000} GNOT
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)] mb-3 uppercase tracking-widest font-light">Total Pool</p>
              <p className="text-lg font-light text-[var(--foreground)]">
                {(event.stakeAmount * event.commits) / 1000000} GNOT
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)] mb-3 uppercase tracking-widest font-light">Commits</p>
              <p className="text-lg font-light text-[var(--foreground)]">{event.commits}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)] mb-3 uppercase tracking-widest font-light">Reveals</p>
              <p className="text-lg font-light text-[var(--foreground)]">{event.reveals}</p>
            </div>
          </div>

          {/* Countdown Timers */}
          {event.commitEnd && event.revealEnd && (event.status === 'COMMIT' || event.status === 'REVEAL') && (() => {
            const now = Math.floor(Date.now() / 1000);
            const isCommitPhase = now < event.commitEnd;
            const isRevealPhase = now >= event.commitEnd && now < event.revealEnd;

            if (isCommitPhase) {
              return (
                <div className="flex gap-4 pt-8 border-t border-[var(--border)] mt-8">
                  <div className="flex-1">
                    <CountdownTimer endTimestamp={event.commitEnd} label="Commit Phase Ends In" />
                  </div>
                </div>
              );
            }

            if (isRevealPhase) {
              return (
                <div className="flex gap-4 pt-8 border-t border-[var(--border)] mt-8">
                  <div className="flex-1">
                    <CountdownTimer endTimestamp={event.revealEnd} label="Reveal Phase Ends In" />
                  </div>
                </div>
              );
            }

            return null;
          })()}

          {event.votesFor !== undefined && event.votesAgainst !== undefined && (() => {
            const total = event.votesFor + event.votesAgainst;
            const forPercent = total > 0 ? (event.votesFor / total * 100).toFixed(1) : '0.0';
            const againstPercent = total > 0 ? (event.votesAgainst / total * 100).toFixed(1) : '0.0';

            return (
              <div className="pt-8 border-t border-[var(--border)] mt-8">
                <div className="grid grid-cols-2 gap-8 mb-4">
                  <div>
                    <p className="text-xs text-[var(--muted)] mb-3 uppercase tracking-widest font-light">Verified</p>
                    <p className="text-4xl font-light text-[var(--foreground)]">{event.votesFor}</p>
                    <p className="text-sm text-[var(--muted)] mt-2 font-light">{forPercent}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--muted)] mb-3 uppercase tracking-widest font-light">Rejected</p>
                    <p className="text-4xl font-light text-[var(--foreground)]">{event.votesAgainst}</p>
                    <p className="text-sm text-[var(--muted)] mt-2 font-light">{againstPercent}%</p>
                  </div>
                </div>
                <div className="h-2 bg-[var(--border)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--foreground)] transition-all"
                    style={{ width: `${forPercent}%` }}
                  />
                </div>
              </div>
            );
          })()}
        </div>

        {/* Actions */}
        <div>
          {(() => {
            const now = Math.floor(Date.now() / 1000);
            const isCommitPhase = event.commitEnd && now < event.commitEnd;
            const isRevealPhase = event.commitEnd && event.revealEnd && now >= event.commitEnd && now < event.revealEnd;
            const needsResolve = event.revealEnd && now >= event.revealEnd && event.status !== 'RESOLVED' && event.status !== 'VOIDED';

            // Commit Phase
            if (event.status === 'COMMIT' && isCommitPhase) {
              return (
                <CommitForm
                  eventId={event.id}
                  stakeAmount={event.stakeAmount}
                  currentCommits={event.commits}
                  poolGnot={event.poolGnot}
                  onSuccess={() => window.location.reload()}
                />
              );
            }

            // Reveal Phase
            if ((event.status === 'COMMIT' && !isCommitPhase) || (event.status === 'REVEAL') || isRevealPhase) {
              // If reveal phase ended but not resolved yet, show resolve button
              if (needsResolve) {
                return (
                  <ResolveButton
                    eventId={event.id}
                    revealEndTimestamp={event.revealEnd}
                    onSuccess={() => window.location.reload()}
                  />
                );
              }

              // Otherwise show reveal form
              return (
                <RevealForm
                  eventId={event.id}
                  onSuccess={() => window.location.reload()}
                />
              );
            }

            // Needs resolution (reveal phase ended)
            if (needsResolve) {
              return (
                <ResolveButton
                  eventId={event.id}
                  revealEndTimestamp={event.revealEnd}
                  onSuccess={() => window.location.reload()}
                />
              );
            }

            return null;
          })()}

          {event.status === 'RESOLVED' && (
            <div className="py-16 bg-[var(--card)] border border-[var(--border)] text-center">
              <p className="text-base text-[var(--foreground)] font-light uppercase tracking-wider">
                Event resolved — Outcome: {event.outcome}
              </p>
              <p className="text-sm text-[var(--muted)] font-light mt-4">
                Stakes have been distributed to winners
              </p>
            </div>
          )}

          {event.status === 'VOIDED' && (
            <div className="py-16 bg-[var(--card)] border border-[var(--border)] text-center">
              <p className="text-base text-[var(--muted)] font-light uppercase tracking-wider">
                Event voided (no reveals)
              </p>
            </div>
          )}
        </div>

        {/* Hash Debugger (show during reveal phase) */}
        {(() => {
          const now = Math.floor(Date.now() / 1000);
          const isRevealPhase = event.commitEnd && event.revealEnd && now >= event.commitEnd && now < event.revealEnd;

          return null;
        })()}
      </main>

      <Footer />
    </div>
  );
}
