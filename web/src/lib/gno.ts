import { HistoriaEvent, EventStatus, Outcome } from './types';

const REALM_PATH = process.env.NEXT_PUBLIC_REALM_PATH || 'gno.land/r/historia';
const RPC_URL = process.env.NEXT_PUBLIC_GNO_RPC || 'http://127.0.0.1:26657';

/**
 * Decode base64 response from Gno RPC
 */
function decodeBase64(encoded: string): string {
  if (typeof window !== 'undefined') {
    return atob(encoded);
  }
  return Buffer.from(encoded, 'base64').toString('utf-8');
}

/**
 * Query the realm's Render function
 */
export async function render(path: string): Promise<string> {
  const data = `${REALM_PATH}:${path}`;
  const encodedData = typeof window !== 'undefined'
    ? btoa(data)
    : Buffer.from(data).toString('base64');

  const url = `${RPC_URL}/abci_query?path=%22vm/qrender%22&data=%22${encodedData}%22`;

  const response = await fetch(url);
  const json = await response.json();

  if (json.result?.response?.ResponseBase?.Data) {
    return decodeBase64(json.result.response.ResponseBase.Data);
  }

  throw new Error('Failed to query realm');
}

/**
 * Parse event status string to enum
 */
function parseStatus(status: string): EventStatus {
  switch (status.toUpperCase()) {
    case 'COMMIT': return 'COMMIT';
    case 'REVEAL': return 'REVEAL';
    case 'RESOLVED': return 'RESOLVED';
    case 'VOIDED': return 'VOIDED';
    default: return 'COMMIT';
  }
}

/**
 * Parse outcome string to enum
 */
function parseOutcome(outcome: string): Outcome {
  switch (outcome.toUpperCase()) {
    case 'ACCEPTED': return 'ACCEPTED';
    case 'REJECTED': return 'REJECTED';
    case 'TIED': return 'TIED';
    default: return 'PENDING';
  }
}

/**
 * Global statistics from blockchain
 */
export interface GlobalStats {
  uniqueVoters: number;
}

/**
 * Parse global stats from home page markdown
 */
export function parseGlobalStats(markdown: string): GlobalStats {
  const votersMatch = markdown.match(/\*\*Unique Voters:\*\* (\d+)/);
  const uniqueVoters = votersMatch ? parseInt(votersMatch[1]) : 0;

  return {
    uniqueVoters,
  };
}

/**
 * Parse the home page markdown into event list
 */
export function parseEventList(markdown: string): HistoriaEvent[] {
  const events: HistoriaEvent[] = [];

  // Match pattern: - **#ID** [STATUS] Description | Pool: X GNOT (vVERSION)
  const regex = /- \*\*#(\d+)\*\* \[([A-Z]+)\] (.+?) \| Pool: (\d+) GNOT \(v(\d+)\)/g;
  let match;

  while ((match = regex.exec(markdown)) !== null) {
    events.push({
      id: match[1],
      status: parseStatus(match[2]),
      description: match[3], // Description sans le "| Pool: X GNOT"
      version: parseInt(match[5]),
      poolGnot: parseInt(match[4]), // Pool extrait
      proposer: '',
      stakeAmount: 0,
      commits: 0,
      reveals: 0,
    });
  }

  return events;
}

/**
 * Parse event detail markdown into full event
 */
export function parseEventDetail(markdown: string): HistoriaEvent | null {
  // Extract ID
  const idMatch = markdown.match(/# Event #(\d+)/);
  if (!idMatch) return null;

  const id = idMatch[1];

  // Extract description
  const descMatch = markdown.match(/\*\*Description:\*\* (.+)/);
  const description = descMatch ? descMatch[1] : '';

  // Extract status
  const statusMatch = markdown.match(/\*\*Status:\*\* ([A-Z]+)/);
  const status = statusMatch ? parseStatus(statusMatch[1]) : 'COMMIT';

  // Extract proposer
  const proposerMatch = markdown.match(/\*\*Proposer:\*\* ([a-z0-9]+)/);
  const proposer = proposerMatch ? proposerMatch[1] : '';

  // Extract stake
  const stakeMatch = markdown.match(/\*\*Stake:\*\* (\d+) ugnot/);
  const stakeAmount = stakeMatch ? parseInt(stakeMatch[1]) : 0;

  // Extract version and parent
  const versionMatch = markdown.match(/\*\*Version:\*\* (\d+)/);
  const version = versionMatch ? parseInt(versionMatch[1]) : 1;

  const parentMatch = markdown.match(/\(contests #(\d+)\)/);
  const parentId = parentMatch ? parentMatch[1] : undefined;

  // Extract commits and reveals
  const commitsMatch = markdown.match(/\*\*Commits:\*\* (\d+)/);
  const commits = commitsMatch ? parseInt(commitsMatch[1]) : 0;

  const revealsMatch = markdown.match(/\*\*Reveals:\*\* (\d+)/);
  const reveals = revealsMatch ? parseInt(revealsMatch[1]) : 0;

  // Extract timestamps
  const timestampsMatch = markdown.match(/\*\*Commit End:\*\* (\d+) \| \*\*Reveal End:\*\* (\d+)/);
  const commitEnd = timestampsMatch ? parseInt(timestampsMatch[1]) : undefined;
  const revealEnd = timestampsMatch ? parseInt(timestampsMatch[2]) : undefined;

  // Extract votes if resolved
  const votesForMatch = markdown.match(/\*\*Votes For:\*\* (\d+)/);
  const votesFor = votesForMatch ? parseInt(votesForMatch[1]) : undefined;

  const votesAgainstMatch = markdown.match(/\*\*Against:\*\* (\d+)/);
  const votesAgainst = votesAgainstMatch ? parseInt(votesAgainstMatch[1]) : undefined;

  // Extract outcome
  const outcomeMatch = markdown.match(/\*\*Outcome:\*\* ([A-Z]+)/);
  const outcome = outcomeMatch ? parseOutcome(outcomeMatch[1]) : undefined;

  // Calculate poolGnot from commits * stake
  const poolGnot = Math.floor((stakeAmount * commits) / 1000000);

  return {
    id,
    description,
    status,
    proposer,
    stakeAmount,
    version,
    parentId,
    commits,
    reveals,
    votesFor,
    votesAgainst,
    outcome,
    poolGnot,
    commitEnd,
    revealEnd,
  };
}

/**
 * Build transaction message for Submit
 */
export function buildSubmitTx(
  caller: string,
  description: string,
  stakeAmount: number,
  commitHours: number,
  revealHours: number,
  commitHash: string
) {
  return {
    caller,
    send: `${stakeAmount}ugnot`,
    pkg_path: REALM_PATH,
    func: 'Submit',
    args: [description, String(stakeAmount), String(commitHours), String(revealHours), commitHash],
  };
}

/**
 * Build transaction message for CommitVote
 */
export function buildCommitVoteTx(
  caller: string,
  eventId: string,
  stakeAmount: number,
  commitHash: string
) {
  return {
    caller,
    send: `${stakeAmount}ugnot`,
    pkg_path: REALM_PATH,
    func: 'CommitVote',
    args: [eventId, commitHash],
  };
}

/**
 * Build transaction message for RevealVote
 */
export function buildRevealVoteTx(
  caller: string,
  eventId: string,
  vote: boolean,
  secret: string
) {
  return {
    caller,
    send: '',
    pkg_path: REALM_PATH,
    func: 'RevealVote',
    args: [eventId, vote ? 'true' : 'false', secret],
  };
}

/**
 * Build transaction message for Resolve
 */
export function buildResolveTx(caller: string, eventId: string) {
  return {
    caller,
    send: '',
    pkg_path: REALM_PATH,
    func: 'Resolve',
    args: [eventId],
  };
}

/**
 * User statistics from blockchain
 */
export interface UserStats {
  totalVotes: number;
  wonVotes: number;
  totalReveals: number;
  totalStaked: number; // in ugnot
  proposedEvents: number;
  winRate: number; // percentage
}

/**
 * Parse user stats from realm response
 * Format: STATS|totalVotes|wonVotes|totalReveals|totalStaked|proposedEvents|winRate
 */
export function parseUserStats(response: string): UserStats | null {
  const match = response.match(/STATS\|(\d+)\|(\d+)\|(\d+)\|(\d+)\|(\d+)\|(\d+)/);
  if (!match) return null;

  return {
    totalVotes: parseInt(match[1]),
    wonVotes: parseInt(match[2]),
    totalReveals: parseInt(match[3]),
    totalStaked: parseInt(match[4]),
    proposedEvents: parseInt(match[5]),
    winRate: parseInt(match[6]),
  };
}

/**
 * Get user statistics from blockchain
 */
export async function getUserStats(address: string): Promise<UserStats | null> {
  try {
    const response = await render(`stats:${address}`);
    return parseUserStats(response);
  } catch {
    return null;
  }
}
