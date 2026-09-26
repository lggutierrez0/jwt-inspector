import type { IdGenerator } from '../../application/ports/id-generator';

export class CryptoIdGenerator implements IdGenerator {
  next(): string {
    return crypto.randomUUID();
  }
}
