import path from 'node:path';

import { type BrowserContext, test as base, chromium } from '@playwright/test';

const extensionPath = path.resolve(import.meta.dirname, '../.output/chrome-mv3');

interface ExtensionFixtures {
  readonly context: BrowserContext;
  readonly extensionId: string;
}

/** Launches Chromium with the built extension loaded and exposes its runtime id. */
export const test = base.extend<ExtensionFixtures>({
  // oxlint-disable-next-line no-empty-pattern -- Playwright requires the destructuring signature
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
    const id = new URL(worker.url()).host;
    await use(id);
  },
});

export const { expect } = test;
