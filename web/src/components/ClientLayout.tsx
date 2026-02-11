'use client';

import { SplashScreen } from './SplashScreen';
import { WalletProvider } from '@/contexts/WalletContext';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <SplashScreen />
      {children}
    </WalletProvider>
  );
}
