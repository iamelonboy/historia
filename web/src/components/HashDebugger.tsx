'use client';

import { useState } from 'react';
import { generateCommitHash } from '@/lib/hash';
import { useWallet } from '@/contexts/WalletContext';

export function HashDebugger() {
  const { address } = useWallet();
  const [vote, setVote] = useState<boolean>(true);
  const [secret, setSecret] = useState('');
  const [computedHash, setComputedHash] = useState('');

  const handleCompute = () => {
    if (!address || !secret) return;
    const hash = generateCommitHash(address, vote, secret);
    setComputedHash(hash);
  };

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] p-6 space-y-4">
      <h3 className="text-lg font-light text-[var(--foreground)]">Hash Debugger</h3>

      <div>
        <label className="block text-xs text-[var(--muted)] mb-2">Your Address</label>
        <code className="block p-2 bg-[var(--background)] border border-[var(--border)] text-xs font-mono break-all">
          {address || 'Not connected'}
        </code>
      </div>

      <div>
        <label className="block text-xs text-[var(--muted)] mb-2">Vote</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setVote(true)}
            className={`py-2 text-xs ${vote === true ? 'bg-[var(--foreground)] text-[var(--background)]' : 'bg-[var(--background)] text-[var(--muted)]'}`}
          >
            VERIFY (true/1)
          </button>
          <button
            type="button"
            onClick={() => setVote(false)}
            className={`py-2 text-xs ${vote === false ? 'bg-[var(--foreground)] text-[var(--background)]' : 'bg-[var(--background)] text-[var(--muted)]'}`}
          >
            REJECT (false/0)
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs text-[var(--muted)] mb-2">Secret</label>
        <input
          type="text"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Enter secret"
          className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] text-xs font-mono"
        />
      </div>

      <button
        type="button"
        onClick={handleCompute}
        disabled={!address || !secret}
        className="w-full py-2 bg-[var(--foreground)] text-[var(--background)] text-xs disabled:opacity-30"
      >
        Compute Hash
      </button>

      {computedHash && (
        <div>
          <label className="block text-xs text-[var(--muted)] mb-2">Computed Hash</label>
          <code className="block p-2 bg-[var(--background)] border border-[var(--border)] text-xs font-mono break-all">
            {computedHash}
          </code>
          <p className="text-xs text-[var(--muted)] mt-2">
            Preimage: {address}:{vote ? '1' : '0'}:{secret}
          </p>
        </div>
      )}
    </div>
  );
}
