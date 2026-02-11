// HISTORIA types

export type EventStatus = 'COMMIT' | 'REVEAL' | 'RESOLVED' | 'VOIDED';

export type Outcome = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'TIED';

export interface HistoriaEvent {
  id: string;
  description: string;
  status: EventStatus;
  proposer: string;
  stakeAmount: number;
  version: number;
  parentId?: string;
  commits: number;
  reveals: number;
  votesFor?: number;
  votesAgainst?: number;
  outcome?: Outcome;
  poolGnot: number; // Always set, default 0
  commitEnd?: number;
  revealEnd?: number;
}

export interface WalletState {
  connected: boolean;
  address: string | null;
  chainId: string | null;
}

export interface CommitData {
  eventId: string;
  vote: boolean;
  secret: string;
  hash: string;
}
