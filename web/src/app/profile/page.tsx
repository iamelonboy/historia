'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { render, parseEventList, parseEventDetail, getUserStats, UserStats } from '@/lib/gno';
import { HistoriaEvent } from '@/lib/types';
import { WalletConnect } from '@/components/WalletConnect';
import { useWallet } from '@/contexts/WalletContext';
import { StatusBadge, OutcomeBadge } from '@/components/StatusBadge';
import { Footer } from '@/components/Footer';
import { calculateUserScore, getScoreLabel } from '@/lib/scoring';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  const { connected, address } = useWallet();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchAddress, setSearchAddress] = useState('');

  // Get address from URL params or use connected wallet address
  const targetAddress = searchParams.get('address') || address;
  const [allEvents, setAllEvents] = useState<HistoriaEvent[]>([]);
  const [detailedEvents, setDetailedEvents] = useState<HistoriaEvent[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAddress.trim()) {
      router.push(`/profile?address=${searchAddress.trim()}`);
    }
  };

  const clearSearch = () => {
    setSearchAddress('');
    router.push('/profile');
  };

  const isViewingOwnProfile = targetAddress === address;

  useEffect(() => {
    async function loadData() {
      if (!targetAddress) return;

      try {
        setIsLoading(true);

        // Load events list
        const markdown = await render('');
        const parsed = parseEventList(markdown);
        setAllEvents(parsed);

        // Load details for first 50 events
        const detailPromises = parsed.slice(0, 50).map(async (e) => {
          try {
            const detailMd = await render(e.id);
            return parseEventDetail(detailMd);
          } catch {
            return e;
          }
        });

        const details = await Promise.all(detailPromises);
        setDetailedEvents(details.filter(Boolean) as HistoriaEvent[]);

        // Load user stats from blockchain
        const stats = await getUserStats(targetAddress);
        setUserStats(stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [targetAddress]);

  // If no target address and not connected, show connect message
  if (!targetAddress) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <header className="bg-[var(--card)] border-b border-[var(--border)] sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-16">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-20">
                <Link href="/" className="text-2xl font-light text-[var(--foreground)] tracking-tight">
                  HISTORIA
                </Link>
              </div>
              <WalletConnect />
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <p className="text-lg text-[var(--muted)] font-light mb-6">Connect your wallet to view your profile</p>
            <WalletConnect />
          </div>
        </div>
      </div>
    );
  }

  // Filter events proposed by this user
  const myProposals = detailedEvents.filter(e =>
    e.proposer.toLowerCase().includes(targetAddress.toLowerCase().slice(2, 10))
  );

  // Get commits from localStorage (only for own profile, for reveal alerts)
  const myCommits: { eventId: string; vote: boolean; hash: string }[] = [];
  if (isViewingOwnProfile && address) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`historia_commit_`) && !key.includes('_new_') && key.includes(address)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          const parts = key.split('_');
          const eventId = parts[2];
          if (eventId && !isNaN(Number(eventId))) {
            myCommits.push({ eventId, vote: data.vote, hash: data.hash });
          }
        } catch {
          // Ignore invalid data
        }
      }
    }
  }

  // Find events that need revealing (only for own profile)
  const needsReveal = isViewingOwnProfile
    ? detailedEvents.filter(e =>
        e.status === 'REVEAL' && myCommits.some(c => c.eventId === e.id)
      )
    : [];

  // Use blockchain stats
  const totalVoted = userStats?.totalVotes || 0;
  const winRate = userStats?.winRate || 0;
  const totalStaked = (userStats?.totalStaked || 0) / 1000000; // Convert ugnot to GNOT
  const totalProposed = userStats?.proposedEvents || 0;

  // Estimate net gain (simplified calculation)
  // This is approximate since we don't have detailed payout history
  const wonVotes = userStats?.wonVotes || 0;
  const lostVotes = (userStats?.totalReveals || 0) - wonVotes;
  const avgStakePerVote = totalVoted > 0 ? totalStaked / totalVoted : 0;

  // Rough estimate: won votes = +50% profit, lost votes = -100% loss
  const estimatedWon = wonVotes * avgStakePerVote * 0.5;
  const estimatedLost = lostVotes * avgStakePerVote;
  const netGain = estimatedWon - estimatedLost;

  // Calculate user score (0-10)
  const userScore = calculateUserScore(winRate, totalVoted, totalStaked, myProposals);
  const scoreInfo = getScoreLabel(userScore);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border border-[var(--border)] border-t-[var(--foreground)] animate-spin mb-6"></div>
          <p className="text-sm text-[var(--muted)] font-light">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
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

      {/* Search Bar */}
      <section className="max-w-7xl mx-auto px-6 lg:px-16 pt-8">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            placeholder="Search user by address (e.g., g1abc...)"
            className="flex-1 px-5 py-3 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--foreground)] transition-colors font-mono text-sm font-light"
          />
          <button
            type="submit"
            className="px-8 py-3 bg-[var(--foreground)] text-[var(--background)] text-sm font-light hover:bg-[var(--muted)] transition-colors uppercase tracking-wider"
          >
            Search
          </button>
          {!isViewingOwnProfile && (
            <button
              type="button"
              onClick={clearSearch}
              className="px-8 py-3 border border-[var(--border)] text-[var(--foreground)] text-sm font-light hover:border-[var(--foreground)] transition-colors uppercase tracking-wider"
            >
              My Profile
            </button>
          )}
        </form>
      </section>

      <main className="max-w-7xl mx-auto px-6 lg:px-16 py-16">
        <div className="mb-12 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-5xl font-light text-[var(--foreground)] tracking-tight">Profile</h1>
              {!isViewingOwnProfile && (
                <span className="px-3 py-1 bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--muted)] font-light uppercase tracking-wider">
                  Viewing Other User
                </span>
              )}
            </div>
            <p className="text-lg text-[var(--muted)] font-light font-mono">
              {targetAddress.slice(0, 12)}...{targetAddress.slice(-8)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-[var(--muted)] uppercase tracking-widest font-light mb-2">
              User Score
            </div>
            <div className="text-6xl font-light text-[var(--foreground)]">
              {userScore.toFixed(1)}<span className="text-3xl">/10</span>
            </div>
            <div className={`text-sm font-light mt-2 ${scoreInfo.color}`}>
              {scoreInfo.label}
            </div>
          </div>
        </div>

        {/* Reveal Alerts (only for own profile) */}
        {needsReveal.length > 0 && (
          <div className="bg-[var(--card)] border-2 border-[var(--foreground)] p-8 mb-16">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-[var(--foreground)] text-[var(--background)]">
                <span className="text-2xl">⏰</span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-light text-[var(--foreground)] mb-3">
                  {needsReveal.length} Vote{needsReveal.length > 1 ? 's' : ''} Need Revealing
                </h2>
                <p className="text-sm text-[var(--muted)] font-light mb-6">
                  The following events are in the reveal phase. Reveal your vote before the deadline to claim your stake.
                </p>
                <div className="space-y-3">
                  {needsReveal.map(event => (
                    <Link
                      key={event.id}
                      href={`/event/${event.id}`}
                      className="block p-4 bg-[var(--background)] border border-[var(--border)] hover:border-[var(--foreground)] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-mono text-[var(--muted)] font-light">#{event.id}</span>
                            <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 font-light">
                              REVEAL PHASE
                            </span>
                          </div>
                          <p className="text-sm text-[var(--foreground)] font-light">{event.description}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-6">
                          <span className="text-sm text-[var(--foreground)] font-light">Reveal Now →</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-[var(--border)] mb-16">
          <div className="bg-[var(--card)] p-6">
            <div className="text-3xl font-light text-[var(--foreground)] mb-2">{totalProposed}</div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-widest font-light">Events Proposed</div>
          </div>
          <div className="bg-[var(--card)] p-6">
            <div className="text-3xl font-light text-[var(--foreground)] mb-2">{totalVoted}</div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-widest font-light">Total Votes</div>
          </div>
          <div className="bg-[var(--card)] p-6">
            <div className="text-3xl font-light text-[var(--foreground)] mb-2">{totalStaked.toFixed(1)}</div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-widest font-light">GNOT Staked</div>
          </div>
          <div className="bg-[var(--card)] p-6">
            <div className={`text-3xl font-light mb-2 ${netGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netGain >= 0 ? '+' : ''}{netGain.toFixed(2)}
            </div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-widest font-light">Net Gain (GNOT)</div>
          </div>
          <div className="bg-[var(--card)] p-6">
            <div className="text-3xl font-light text-[var(--foreground)] mb-2">{winRate.toFixed(0)}%</div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-widest font-light">Win Rate</div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
