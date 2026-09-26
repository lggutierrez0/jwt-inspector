import { decodeToken } from '../jwt/decode';
import { evaluateStatus } from '../time/status';
import { readTimeClaims, validAt } from '../time/time-claims';
import type { TokenRecord } from './token-record';

/** Expiry instant (epoch ms) of a saved token, or null when it has none or cannot be read. */
export function recordExpiry(record: Pick<TokenRecord, 'raw'>): number | null {
  const decoded = decodeToken(record.raw);
  if (!decoded.ok || decoded.token.kind !== 'jws') return null;
  return validAt(readTimeClaims(decoded.token.payload).exp);
}

/** Whether a saved token is expired at `now`; encrypted or undecodable tokens never are. */
export function isRecordExpired(record: Pick<TokenRecord, 'raw'>, now: number): boolean {
  const decoded = decodeToken(record.raw);
  if (!decoded.ok || decoded.token.kind !== 'jws') return false;
  return evaluateStatus(readTimeClaims(decoded.token.payload), now).status === 'expired';
}
