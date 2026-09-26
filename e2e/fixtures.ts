import path from 'node:path';

import { type BrowserContext, type Page, test as base, chromium } from '@playwright/test';

const extensionPath = path.resolve(import.meta.dirname, '../.output/chrome-mv3');

/**
 * Launches Chromium with the built extension. An empty `userDataDir` is a throwaway profile; a
 * fixed one survives close and relaunch, like a real browser restart.
 */
export async function launchExtension(userDataDir = '', language: 'en' | 'es' = 'en') {
  // Pin the browser language: extension messages follow the OS locale, not the page locale.
  const posix = language === 'es' ? 'es_ES' : 'en_US';
  const tag = language === 'es' ? 'es-ES' : 'en-US';
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    locale: tag,
    env: { ...process.env, LANGUAGE: posix, LANG: `${posix}.UTF-8`, LC_ALL: `${posix}.UTF-8` },
    args: [
      `--lang=${tag}`,
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
  return { context, extensionId: new URL(worker.url()).host };
}

interface ExtensionFixtures {
  readonly context: BrowserContext;
  readonly extensionId: string;
}

/** Test with a fresh profile and the extension's runtime id. */
export const test = base.extend<
  ExtensionFixtures & { launched: Awaited<ReturnType<typeof launchExtension>> }
>({
  // oxlint-disable-next-line no-empty-pattern -- Playwright requires the destructuring signature
  launched: async ({}, use) => {
    const launched = await launchExtension();
    await use(launched);
    await launched.context.close();
  },
  context: async ({ launched }, use) => {
    await use(launched.context);
  },
  extensionId: async ({ launched }, use) => {
    await use(launched.extensionId);
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
