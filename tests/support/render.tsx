import { render, renderHook, type RenderOptions } from '@testing-library/react';
import { useState, type ReactElement, type ReactNode } from 'react';

import { i18n } from '#i18n';
import type { SupportedLocale } from '@/application/ports/locale-preference-repository';
import { ServicesContext, type Services } from '@/ui/app/services-context';
import { ClockTicker } from '@/ui/clock/clock-ticker';
import { ClockContext } from '@/ui/clock/use-now';
import { detectBrowserLocaleTag, I18nContext, type I18nValue } from '@/ui/i18n/i18n-context';

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

/** Overridable pieces of the default test i18n value; `setLocale` defaults to working local state. */
export type I18nOverrides = Partial<Pick<I18nValue, 'locale' | 'localeOverride' | 'setLocale'>>;

/**
 * Real translated text through the locale installed with `installLocale()` (tests/support/i18n),
 * plus working `localeOverride`/`setLocale` state for components that read or call them. This
 * state does not re-fetch messages for the new language (that behavior is unit-tested on
 * `SwitchableI18nProvider` itself and end-to-end); it exists so a component like `CommandBar` can
 * be exercised without a separate i18n test double.
 */
function DefaultI18n({ overrides, children }: { overrides: I18nOverrides; children: ReactNode }) {
  const [override, setOverride] = useState<SupportedLocale | null>(null);
  const value: I18nValue = {
    t: i18n.t,
    locale: detectBrowserLocaleTag(),
    localeOverride: override,
    setLocale: setOverride,
    ...overrides,
  };
  return <I18nContext value={value}>{children}</I18nContext>;
}

function Providers({
  services,
  i18nOverrides,
  children,
}: {
  services: Services;
  i18nOverrides: I18nOverrides;
  children: ReactNode;
}) {
  return (
    <DefaultI18n overrides={i18nOverrides}>
      <ServicesContext value={services}>
        <ClockContext value={new ClockTicker(services.clock)}>{children}</ClockContext>
      </ServicesContext>
    </DefaultI18n>
  );
}

/** Renders with real i18n (installed locale), the given fakes and a ticker on the fake clock. */
export function renderWithProviders(
  ui: ReactElement,
  overrides: Partial<TestServices> = {},
  options?: Omit<RenderOptions, 'wrapper'> & { readonly i18n?: I18nOverrides },
) {
  const services = createTestServices(overrides);
  const { i18n: i18nOverrides = {}, ...renderOptions } = options ?? {};
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Providers services={services} i18nOverrides={i18nOverrides}>
      {children}
    </Providers>
  );
  return { ...render(ui, { wrapper, ...renderOptions }), services };
}

export function renderHookWithProviders<T>(hook: () => T, overrides: Partial<TestServices> = {}) {
  const services = createTestServices(overrides);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Providers services={services} i18nOverrides={{}}>
      {children}
    </Providers>
  );
  return { ...renderHook(hook, { wrapper }), services };
}
