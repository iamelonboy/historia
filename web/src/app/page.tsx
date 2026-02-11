'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { render, parseEventList, parseGlobalStats } from '@/lib/gno';
import { HistoriaEvent } from '@/lib/types';
import { WalletConnect } from '@/components/WalletConnect';
import { EventCard } from '@/components/EventCard';
import { useWallet } from '@/contexts/WalletContext';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  const { connected, address } = useWallet();
  const [events, setEvents] = useState<HistoriaEvent[]>([]);
  const [uniqueVoters, setUniqueVoters] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'commit' | 'reveal' | 'resolved'>('commit');

  useEffect(() => {
    async function loadEvents() {
      try {
        const markdown = await render('');
        const parsed = parseEventList(markdown);
        const stats = parseGlobalStats(markdown);
        setEvents(parsed);
        setUniqueVoters(stats.uniqueVoters);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setIsLoading(false);
      }
    }

    loadEvents();

    // Auto-refresh every 30 seconds
    const interval = setInterval(async () => {
      try {
        const markdown = await render('');
        const parsed = parseEventList(markdown);
        const stats = parseGlobalStats(markdown);
        setEvents(parsed);
        setUniqueVoters(stats.uniqueVoters);
      } catch {
        // Ignore refresh errors
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const filteredEvents = events.filter(event => {
    if (filter === 'commit') return event.status === 'COMMIT';
    if (filter === 'reveal') return event.status === 'REVEAL';
    if (filter === 'resolved') return event.status === 'RESOLVED' || event.status === 'VOIDED';
    return true;
  });

  const totalGnotStaked = events.reduce((sum, e) => sum + (e.poolGnot || 0), 0);
  const resolvedCount = events.filter(e => e.status === 'RESOLVED' || e.status === 'VOIDED').length;

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

      {/* Hero */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-16 py-16 lg:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-[var(--card)] border border-[var(--border)] mb-8">
              <div className="w-1.5 h-1.5 bg-[var(--foreground)]"></div>
              <span className="text-xs text-[var(--muted)] font-light tracking-wide">Decentralized truth protocol</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-light text-[var(--foreground)] mb-8 leading-[1.1] tracking-tight">
              Truth is<br />
              <span className="italic font-light">verified</span>,<br />
              not dictated
            </h1>

            <p className="text-lg text-[var(--muted)] mb-10 max-w-2xl mx-auto leading-relaxed font-light">
              Stake-based consensus for historical claims. No gatekeepers, only economic alignment and collective verification.
            </p>

            <Link
              href="/submit"
              className="inline-flex items-center gap-4 px-8 py-4 bg-[var(--foreground)] text-[var(--background)] font-light text-base overflow-hidden relative group"
            >
              <span className="relative z-10 transition-colors duration-1000 group-hover:text-[var(--foreground)]">Submit Claim</span>
              <svg className="w-4 h-4 relative z-10 transition-colors duration-1000 group-hover:stroke-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <div className="absolute inset-0 bg-[var(--background)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-1000 origin-left"></div>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-6 lg:px-16 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--border)]">
          <div className="bg-[var(--card)] p-8">
            <div className="text-4xl font-light text-[var(--foreground)] mb-2">{totalGnotStaked}</div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-widest font-light">Total GNOT Staked</div>
          </div>
          <div className="bg-[var(--card)] p-8">
            <div className="text-4xl font-light text-[var(--foreground)] mb-2">{resolvedCount}</div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-widest font-light">Resolved</div>
          </div>
          <div className="bg-[var(--card)] p-8">
            <div className="text-4xl font-light text-[var(--foreground)] mb-2">{uniqueVoters}</div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-widest font-light">Users</div>
          </div>
        </div>
      </section>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 lg:px-16 pb-24">
        {/* Filters */}
        <div className="flex items-center gap-px mb-8 bg-[var(--border)]">
          {(['commit', 'reveal', 'resolved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-8 py-3 text-xs font-light transition-colors uppercase tracking-widest ${
                filter === f
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-10 h-10 border border-[var(--border)] border-t-[var(--foreground)] animate-spin mb-6"></div>
            <p className="text-sm text-[var(--muted)] font-light">Loading claims...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="py-24 text-center bg-[var(--card)] border border-[var(--border)]">
            <p className="text-[var(--muted)] text-base font-light">{error}</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && filteredEvents.length === 0 && (
          <div className="py-40 text-center bg-[var(--card)] border border-[var(--border)]">
            <h3 className="text-3xl font-light text-[var(--foreground)] mb-5">
              No claims found
            </h3>
            <p className="text-[var(--muted)] mb-12 text-base font-light">
              Submit a historical claim.
            </p>
            <Link
              href="/submit"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[var(--foreground)] text-[var(--background)] hover:bg-[var(--muted)] transition-colors font-light"
            >
              Submit Claim
            </Link>
          </div>
        )}

        {/* Events */}
        {!isLoading && !error && filteredEvents.length > 0 && (
          <div className="space-y-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
