import { sha256 } from 'js-sha256';

/**
 * Generate a cryptographically secure random secret
 * @returns 64-character hex string
 */
export function generateSecret(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate commit hash for blind voting
 * Hash = SHA256(address + ":" + vote + ":" + secret)
 * @param address - Voter's Gno address
 * @param vote - true for FOR, false for AGAINST
 * @param secret - Random secret string
 * @returns 64-character lowercase hex hash
 */
export function generateCommitHash(
  address: string,
  vote: boolean,
  secret: string
): string {
  const voteStr = vote ? '1' : '0';
  const preimage = `${address}:${voteStr}:${secret}`;
  return sha256(preimage);
}

/**
 * Verify a commit hash matches the expected values
 */
export function verifyCommitHash(
  address: string,
  vote: boolean,
  secret: string,
  expectedHash: string
): boolean {
  return generateCommitHash(address, vote, secret) === expectedHash;
}
