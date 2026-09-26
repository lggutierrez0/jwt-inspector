import { StrictMode, useContext, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import '@/assets/styles/tailwind.css';
import { NavigatorClipboard } from '@/infrastructure/clipboard/navigator-clipboard';
import { BrowserLocalePreferenceRepository } from '@/infrastructure/i18n/browser-locale-preference-repository';
import { loadLocaleMessages } from '@/infrastructure/i18n/fetch-locale-messages';
import { BrowserVaultRepository } from '@/infrastructure/storage/browser-vault-repository';
import { CryptoIdGenerator } from '@/infrastructure/system/crypto-id-generator';
import { SystemClock } from '@/infrastructure/system/system-clock';
import { AppShell } from '@/ui/app-shell';
import { ServicesContext, type Services } from '@/ui/app/services-context';
import { ClockTicker } from '@/ui/clock/clock-ticker';
import { ClockContext } from '@/ui/clock/use-now';
import { detectSupportedLocale } from '@/ui/i18n/detect-locale';
import { detectBrowserLocaleTag, I18nContext } from '@/ui/i18n/i18n-context';
import { SwitchableI18nProvider } from '@/ui/i18n/switchable-i18n';

const container = document.querySelector('#root');
if (container === null) {
  throw new Error('Side panel root element #root not found');
}

const services: Services = {
  repository: new BrowserVaultRepository(),
  clock: new SystemClock(),
  ids: new CryptoIdGenerator(),
  clipboard: new NavigatorClipboard(),
};

/** Keeps `<html lang>` in sync with the effective locale, including after a manual switch. */
function SyncDocumentLang() {
  const value = useContext(I18nContext);
  useEffect(() => {
    if (value !== null) document.documentElement.lang = value.locale;
  }, [value]);
  return null;
}

createRoot(container).render(
  <StrictMode>
    <SwitchableI18nProvider
      detectedLocale={detectSupportedLocale(detectBrowserLocaleTag())}
      loadMessages={loadLocaleMessages}
      repository={new BrowserLocalePreferenceRepository()}
    >
      <SyncDocumentLang />
      <ServicesContext value={services}>
        <ClockContext value={new ClockTicker(services.clock)}>
          <AppShell version={browser.runtime.getManifest().version} />
        </ClockContext>
      </ServicesContext>
    </SwitchableI18nProvider>
  </StrictMode>,
);
