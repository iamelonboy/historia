'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { WalletConnect } from '@/components/WalletConnect';
import { SubmitForm } from '@/components/SubmitForm';
import { useWallet } from '@/contexts/WalletContext';
import { Footer } from '@/components/Footer';

export default function SubmitPage() {
  const { connected, address } = useWallet();
  const router = useRouter();

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

      {/* Main */}
      <main className="max-w-3xl mx-auto px-6 lg:px-16 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] mb-10 transition-colors font-light">
          <span>←</span>
          <span>Back</span>
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl lg:text-5xl font-light text-[var(--foreground)] mb-4 leading-tight">
            Submit a Claim
          </h1>
          <p className="text-base text-[var(--muted)] leading-relaxed font-light">
            Propose a historical claim to be verified collectively through stake-based consensus.
          </p>
        </div>

        <SubmitForm onSuccess={(eventId) => router.push(`/event/${eventId}`)} />
      </main>

      <Footer />
    </div>
  );
}
