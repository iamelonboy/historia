'use client';

import { useState, useEffect } from 'react';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hide splash screen after 2.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[var(--background)] flex items-center justify-center animate-fade-out">
      <div className="text-center space-y-8 px-6">
        {/* Block Number */}
        <h1 className="text-6xl font-light text-[var(--foreground)] tracking-tight">
          Block #34780
        </h1>

        {/* Quote */}
        <div className="max-w-2xl mx-auto">
          <p className="text-3xl font-light text-[var(--foreground)] italic">
            Gno is for Truth.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-out {
          0% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            visibility: hidden;
          }
        }

        .animate-fade-out {
          animation: fade-out 2.5s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}
