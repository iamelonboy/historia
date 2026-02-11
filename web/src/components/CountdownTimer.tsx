'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  endTimestamp: number; // Unix timestamp in seconds
  label: string;
}

export function CountdownTimer({ endTimestamp, label }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      const diff = endTimestamp - now;

      if (diff <= 0) {
        return 'Ended';
      }

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      // Format HH:MM:SS
      const hh = String(hours).padStart(2, '0');
      const mm = String(minutes).padStart(2, '0');
      const ss = String(seconds).padStart(2, '0');

      return `${hh}:${mm}:${ss}`;
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [endTimestamp]);

  if (timeLeft === 'Ended') {
    return (
      <div className="text-center py-3 px-4 bg-[var(--card)] border border-[var(--border)]">
        <p className="text-xs text-[var(--muted)] uppercase tracking-widest font-light mb-1">{label}</p>
        <p className="text-sm text-[var(--muted)] font-light">Ended</p>
      </div>
    );
  }

  return (
    <div className="text-center py-3 px-4 bg-[var(--card)] border border-[var(--border)]">
      <p className="text-xs text-[var(--muted)] uppercase tracking-widest font-light mb-1">{label}</p>
      <p className="text-lg font-mono font-light text-[var(--foreground)]">{timeLeft}</p>
    </div>
  );
}
