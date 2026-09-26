import { createContext, useContext } from 'react';

import type { Clock } from '@/application/ports/clock';
import type { IdGenerator } from '@/application/ports/id-generator';
import type { VaultRepository } from '@/application/ports/vault-repository';

/** Ports the UI depends on; production and tests provide different implementations. */
export interface Services {
  readonly repository: VaultRepository;
  readonly clock: Clock;
  readonly ids: IdGenerator;
}

export const ServicesContext = createContext<Services | null>(null);

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (services === null)
    throw new Error('useServices must be used inside a ServicesContext provider');
  return services;
}
