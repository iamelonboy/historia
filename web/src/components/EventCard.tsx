import Link from 'next/link';
import { HistoriaEvent } from '@/lib/types';
import { StatusBadge } from './StatusBadge';

interface EventCardProps {
  event: HistoriaEvent;
}

export function EventCard({ event }: EventCardProps) {
  const hasVotes = event.votesFor !== undefined && event.votesAgainst !== undefined;
  const totalVotes = hasVotes ? event.votesFor! + event.votesAgainst! : 0;
  const forPercentage = totalVotes > 0 ? (event.votesFor! / totalVotes) * 100 : 0;

  return (
    <Link href={`/event/${event.id}`} className="block group">
      <div className="bg-[var(--card)] border border-[var(--border)] p-6 hover:border-[var(--foreground)] transition-colors">
        <div className="flex items-start justify-between gap-8">
          {/* Left: Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-mono text-[var(--muted)] font-light">#{event.id}</span>
              <StatusBadge status={event.status} />
              {event.version > 1 && (
                <span className="px-2 py-0.5 text-xs bg-[var(--gray-light)] text-[var(--muted)] font-light">
                  v{event.version}
                </span>
              )}
            </div>

            <h3 className="text-xl font-light text-[var(--foreground)] group-hover:text-[var(--muted)] transition-colors mb-5 leading-tight">
              {event.description}
            </h3>

            {/* Vote Bar */}
            {hasVotes && totalVotes > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[var(--muted)] font-light">
                  <span>Verified {event.votesFor} / {totalVotes} ({forPercentage.toFixed(1)}%)</span>
                  <span>Rejected {event.votesAgainst} / {totalVotes} ({(100 - forPercentage).toFixed(1)}%)</span>
                </div>
                <div className="h-px bg-[var(--border)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--foreground)] transition-all"
                    style={{ width: `${forPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right: Stats */}
          <div className="flex flex-col items-end gap-4">
            {event.outcome && event.outcome !== 'PENDING' && (
              <div className={`px-4 py-1.5 text-xs font-light uppercase tracking-widest ${
                event.outcome === 'ACCEPTED' ? 'bg-[var(--foreground)] text-[var(--background)]' :
                event.outcome === 'REJECTED' ? 'bg-[var(--card)] text-[var(--foreground)] border border-[var(--foreground)]' :
                'bg-[var(--gray-light)] text-[var(--muted)]'
              }`}>
                {event.outcome}
              </div>
            )}

            <div className="flex items-center gap-6 text-xs text-[var(--muted)]">
              <div className="text-right">
                <div className="text-2xl font-light text-[var(--foreground)]">
                  {event.poolGnot !== undefined ? event.poolGnot : 0}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-wider font-light">staked</div>
              </div>
              {event.reveals > 0 && (
                <div className="text-right">
                  <div className="text-2xl font-light text-[var(--foreground)]">{event.reveals}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-wider font-light">revealed</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
