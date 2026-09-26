import path from 'node:path';

import { type BrowserContext, type Page, test as base, chromium } from '@playwright/test';

const extensionPath = path.resolve(import.meta.dirname, '../.output/chrome-mv3');

interface ExtensionFixtures {
  readonly context: BrowserContext;
  readonly extensionId: string;
}

/** Launches Chromium with the built extension loaded and exposes its runtime id. */
export const test = base.extend<ExtensionFixtures>({
  // oxlint-disable-next-line no-empty-pattern -- Playwright requires the destructuring signature
  context: async ({}, use) => {
    // Pin the browser language: extension messages follow the OS locale, not the page locale.
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      locale: 'en-US',
      env: { ...process.env, LANGUAGE: 'en_US', LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8' },
      args: [
        '--lang=en-US',
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
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

/** The extension-page `chrome` API used by the helpers below (runs inside the page). */
declare const chrome: {
  storage: {
    local: {
      set(items: Record<string, unknown>): Promise<void>;
      get(keys: string | null): Promise<Record<string, unknown>>;
    };
    sync: { get(keys: string | null): Promise<Record<string, unknown>> };
  };
};

/** Replaces the persisted vault (contracts/storage-vault-v1.md) and reloads the panel. */
export async function seedVault(page: Page, tokens: readonly unknown[]): Promise<void> {
  await page.evaluate((value) => chrome.storage.local.set({ vault: { tokens: value } }), tokens);
  await page.reload();
}

/** Reads raw storage areas from inside an extension page. */
export function readStorage(page: Page): Promise<{ local: unknown; sync: unknown }> {
  return page.evaluate(async () => ({
    local: await chrome.storage.local.get(null),
    sync: await chrome.storage.sync.get(null),
  }));
}
