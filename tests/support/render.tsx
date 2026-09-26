import { render, renderHook, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import { ServicesContext, type Services } from '@/ui/app/services-context';
import { ClockTicker } from '@/ui/clock/clock-ticker';
import { ClockContext } from '@/ui/clock/use-now';
import { createBrowserI18n, I18nContext } from '@/ui/i18n/i18n-context';

import { NOW } from '../fixtures/tokens';
import {
  FixedClock,
  InMemoryVaultRepository,
  RecordingClipboard,
  SequentialIdGenerator,
} from './in-memory-ports';

export interface TestServices {
  readonly repository: InMemoryVaultRepository;
  readonly clock: FixedClock;
  readonly ids: SequentialIdGenerator;
  readonly clipboard: RecordingClipboard;
}

export function createTestServices(overrides: Partial<TestServices> = {}): TestServices {
  return {
    repository: overrides.repository ?? new InMemoryVaultRepository(),
    clock: overrides.clock ?? new FixedClock(NOW),
    ids: overrides.ids ?? new SequentialIdGenerator(),
    clipboard: overrides.clipboard ?? new RecordingClipboard(),
  };
}

function Providers({ services, children }: { services: Services; children: ReactNode }) {
  return (
    <I18nContext value={createBrowserI18n()}>
      <ServicesContext value={services}>
        <ClockContext value={new ClockTicker(services.clock)}>{children}</ClockContext>
      </ServicesContext>
    </I18nContext>
  );
}

/** Renders with real i18n (installed locale), the given fakes and a ticker on the fake clock. */
export function renderWithProviders(
  ui: ReactElement,
  overrides: Partial<TestServices> = {},
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  const services = createTestServices(overrides);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Providers services={services}>{children}</Providers>
  );
  return { ...render(ui, { wrapper, ...options }), services };
}

export function renderHookWithProviders<T>(hook: () => T, overrides: Partial<TestServices> = {}) {
  const services = createTestServices(overrides);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Providers services={services}>{children}</Providers>
  );
  return { ...renderHook(hook, { wrapper }), services };
}
