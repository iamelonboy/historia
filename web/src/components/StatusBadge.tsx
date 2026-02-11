import { EventStatus, Outcome } from '@/lib/types';

interface StatusBadgeProps {
  status: EventStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<EventStatus, string> = {
    COMMIT: 'bg-[var(--foreground)] text-[var(--background)]',
    REVEAL: 'bg-[var(--muted)] text-[var(--background)]',
    RESOLVED: 'bg-[var(--card)] text-[var(--muted)] border border-[var(--border)]',
    VOIDED: 'bg-[var(--card)] text-[var(--muted)] border border-[var(--border)]',
  };

  return (
    <span className={`px-2.5 py-0.5 text-[10px] font-light uppercase tracking-widest ${styles[status]}`}>
      {status}
    </span>
  );
}

interface OutcomeBadgeProps {
  outcome: Outcome;
}

export function OutcomeBadge({ outcome }: OutcomeBadgeProps) {
  const styles: Record<Outcome, string> = {
    PENDING: 'text-[var(--muted)]',
    ACCEPTED: 'text-[var(--foreground)] font-light',
    REJECTED: 'text-[var(--muted)]',
    TIED: 'text-[var(--muted)]',
  };

  return (
    <div className={`text-sm font-light uppercase tracking-widest ${styles[outcome]}`}>
      {outcome}
    </div>
  );
}
