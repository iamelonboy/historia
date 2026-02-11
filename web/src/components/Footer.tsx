'use client';

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] mt-16 bg-[var(--card)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-16">
        <div className="flex items-center justify-between text-sm text-[var(--muted)]">
          <a
            href="https://gno.land"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:text-[var(--foreground)] transition-colors"
          >
            Built on Gno.land
          </a>
          <div className="flex items-center gap-10">
            <a
              href="https://gno.land/r/melonboy314/v1_whitepaper_historia"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--foreground)] transition-colors font-medium"
            >
              Whitepaper
            </a>
            <a
              href="https://docs.adena.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--foreground)] transition-colors font-medium"
            >
              Adena
            </a>
            <a
              href={`https://gno.land/${process.env.NEXT_PUBLIC_REALM_PATH?.replace('gno.land/', '') || 'r/melonboy314/historiav9'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--foreground)] transition-colors font-medium"
            >
              Realm
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
