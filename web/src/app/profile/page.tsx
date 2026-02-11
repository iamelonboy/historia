'use client';

import { Suspense } from 'react';
import ProfileContent from './ProfileContent';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border border-[var(--border)] border-t-[var(--foreground)] animate-spin mb-6"></div>
          <p className="text-sm text-[var(--muted)] font-light">Loading profile...</p>
        </div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
