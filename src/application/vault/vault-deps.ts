import type { VaultRepository } from '../ports/vault-repository';

export interface VaultDeps {
  readonly repository: VaultRepository;
}
