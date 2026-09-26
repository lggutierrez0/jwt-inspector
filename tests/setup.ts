import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { fakeBrowser } from 'wxt/testing/fake-browser';

import { installLocale } from './support/i18n';

// Every test starts in English with real locale files; tests switch with installLocale('es').
beforeEach(async () => {
  await installLocale('en');
});

afterEach(() => {
  cleanup();
  fakeBrowser.reset();
});
