import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@/assets/styles/tailwind.css';
import { BrowserVaultRepository } from '@/infrastructure/storage/browser-vault-repository';
import { CryptoIdGenerator } from '@/infrastructure/system/crypto-id-generator';
import { SystemClock } from '@/infrastructure/system/system-clock';
import { AppShell } from '@/ui/app-shell';
import { ServicesContext, type Services } from '@/ui/app/services-context';
import { ClockTicker } from '@/ui/clock/clock-ticker';
import { ClockContext } from '@/ui/clock/use-now';
import { createBrowserI18n, I18nContext } from '@/ui/i18n/i18n-context';

const container = document.querySelector('#root');
if (container === null) {
  throw new Error('Side panel root element #root not found');
}

const i18nValue = createBrowserI18n();
document.documentElement.lang = i18nValue.locale;

const services: Services = {
  repository: new BrowserVaultRepository(),
  clock: new SystemClock(),
  ids: new CryptoIdGenerator(),
};

createRoot(container).render(
  <StrictMode>
    <I18nContext value={i18nValue}>
      <ServicesContext value={services}>
        <ClockContext value={new ClockTicker(services.clock)}>
          <AppShell version={browser.runtime.getManifest().version} />
        </ClockContext>
      </ServicesContext>
    </I18nContext>
  </StrictMode>,
);
