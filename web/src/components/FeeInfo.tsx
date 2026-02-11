'use client';

import { useState } from 'react';

export function FeeInfo() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] p-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-light text-[var(--foreground)] uppercase tracking-wider">
            Fee Structure
          </span>
          <span className="px-2 py-0.5 text-xs bg-[var(--gray-light)] text-[var(--muted)] font-light">
            2% Total
          </span>
        </div>
        <span className="text-[var(--muted)] text-sm">{isExpanded ? '−' : '+'}</span>
      </button>

      {isExpanded && (
        <div className="mt-6 space-y-4 text-sm font-light text-[var(--muted)]">
          <div className="grid grid-cols-2 gap-4 p-4 bg-[var(--background)] border border-[var(--border)]">
            <div>
              <p className="text-xs uppercase tracking-wider mb-2">Event Proposer</p>
              <p className="text-2xl font-light text-[var(--foreground)]">1%</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider mb-2">Platform Founder</p>
              <p className="text-2xl font-light text-[var(--foreground)]">1%</p>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-[var(--border)]">
            <p className="text-xs uppercase tracking-wider text-[var(--muted)]">How it Works</p>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="text-[var(--foreground)]">•</span>
                <span>Fees are taken from the <strong>losing pool</strong> only</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--foreground)]">•</span>
                <span>Winners receive: <strong>their stake + share of remaining pool</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--foreground)]">•</span>
                <span>Non-revealers forfeit their stake to the pool</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--foreground)]">•</span>
                <span>In case of tie: <strong>all revealers get refunded</strong></span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-[var(--gray-light)] border border-[var(--border)]">
            <p className="text-xs font-light">
              <strong>Example:</strong> 100 GNOT losing pool → 1 GNOT to proposer, 1 GNOT to founder, 98 GNOT distributed to winners
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
