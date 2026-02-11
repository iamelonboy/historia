'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { render, parseEventList, parseEventDetail } from '@/lib/gno';
import { HistoriaEvent } from '@/lib/types';
import { WalletConnect } from '@/components/WalletConnect';
import { EventCard } from '@/components/EventCard';
import { useWallet } from '@/contexts/WalletContext';
import { Footer } from '@/components/Footer';

// Format Unix timestamp to readable date
function formatDate(timestamp?: number): string {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function MemoriaPage() {
  const { connected, address } = useWallet();
  const [events, setEvents] = useState<HistoriaEvent[]>([]);
  const [detailedEvents, setDetailedEvents] = useState<HistoriaEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        // Load basic list
        const markdown = await render('');
        const parsed = parseEventList(markdown);
        setEvents(parsed);

        // Filter archived events
        const archived = parsed.filter(e => e.status === 'RESOLVED' || e.status === 'VOIDED');

        // Load details for archived events (in parallel, max 20)
        const detailPromises = archived.slice(0, 20).map(async (e) => {
          try {
            const detailMd = await render(e.id);
            return parseEventDetail(detailMd);
          } catch {
            return e; // Fallback to basic data
          }
        });

        const details = await Promise.all(detailPromises);
        setDetailedEvents(details.filter(Boolean) as HistoriaEvent[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        setIsLoading(false);
      }
    }

    loadEvents();
  }, []);

  // Filter by search query
  const filteredEvents = detailedEvents.filter((e) =>
    e.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const totalArchived = detailedEvents.length;
  const totalVotes = detailedEvents.reduce((sum, e) => sum + (e.reveals || 0), 0);
  const totalStaked = detailedEvents.reduce((sum, e) => sum + e.poolGnot, 0);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Date', 'Description', 'Status', 'Outcome', 'Commits', 'Reveals', 'Votes For', 'Votes Against', 'Pool (GNOT)', 'Version'];
    const rows = detailedEvents.map((e) => [
      e.id,
      formatDate(e.revealEnd),
      `"${e.description.replace(/"/g, '""')}"`,
      e.status,
      e.outcome || 'N/A',
      e.commits,
      e.reveals,
      e.votesFor || 0,
      e.votesAgainst || 0,
      e.poolGnot,
      e.version,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historia_archive_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const exportToJSON = () => {
    const json = JSON.stringify(detailedEvents, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historia_archive_${Date.now()}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border border-[var(--border)] border-t-[var(--foreground)] animate-spin mb-6"></div>
          <p className="text-sm text-[var(--muted)] font-light">Loading archive...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center">
        <p className="text-base text-[var(--muted)] font-light">{error}</p>
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

      {/* Page Header */}
      <section className="max-w-7xl mx-auto px-6 lg:px-16 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-5xl font-light text-[var(--foreground)] mb-4 tracking-tight">Archive</h1>
            <p className="text-lg text-[var(--muted)] font-light">Historical record of all resolved claims</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              className="px-6 py-3 border border-[var(--border)] text-[var(--foreground)] text-sm font-light hover:border-[var(--foreground)] transition-colors uppercase tracking-wider"
            >
              Export CSV
            </button>
            <button
              onClick={exportToJSON}
              className="px-6 py-3 bg-[var(--foreground)] text-[var(--background)] text-sm font-light hover:bg-[var(--muted)] transition-colors uppercase tracking-wider"
            >
              Export JSON
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--border)] mb-12">
          <div className="bg-[var(--card)] p-8">
            <div className="text-4xl font-light text-[var(--foreground)] mb-2">{totalArchived}</div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-widest font-light">Archived</div>
          </div>
          <div className="bg-[var(--card)] p-8">
            <div className="text-4xl font-light text-[var(--foreground)] mb-2">{totalVotes}</div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-widest font-light">Total Votes</div>
          </div>
          <div className="bg-[var(--card)] p-8">
            <div className="text-4xl font-light text-[var(--foreground)] mb-2">{totalStaked}</div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-widest font-light">Total GNOT Staked</div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by description..."
            className="w-full px-6 py-4 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--foreground)] transition-all font-light"
          />
        </div>

        {/* Events List */}
        {filteredEvents.length === 0 ? (
          <div className="py-24 text-center bg-[var(--card)] border border-[var(--border)]">
            <p className="text-[var(--muted)] text-lg font-light">
              {searchQuery ? 'No events match your search' : 'No archived events yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredEvents.map((event) => (
              <div key={event.id} className="space-y-2">
                <div className="text-xs text-[var(--muted)] font-mono font-light">
                  Finalized on {formatDate(event.revealEnd)}
                </div>
                <EventCard event={event} />
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
