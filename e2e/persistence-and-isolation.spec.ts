import type { Page } from '@playwright/test';

import { makeJws } from '../tests/fixtures/tokens';
import { expect, launchExtension, readStorage, test } from './fixtures';

async function addToken(page: Page, token: string) {
  await page.getByRole('button', { name: 'add token' }).click();
  await page.getByRole('textbox', { name: 'Token' }).fill(token);
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'back' }).click();
}

/** Runs inside a web page: can it reach extension storage, and is anything in its own storage? */
function whatAPageCanSee() {
  const chromeApi: unknown = Reflect.get(globalThis, 'chrome');
  return {
    extensionStorage: typeof chromeApi === 'object' && chromeApi !== null && 'storage' in chromeApi,
    pageStorage: localStorage.length + sessionStorage.length,
  };
}

test.describe('US4 persistence and isolation (FR-020, FR-022, SC-005)', () => {
  // oxlint-disable-next-line no-empty-pattern -- Playwright requires the destructuring signature
  test('keeps tokens, labels and order across a browser restart', async ({}, testInfo) => {
    const profile = testInfo.outputPath('profile');
    const first = await launchExtension(profile);
    const page = await first.context.newPage();
    await page.goto(`chrome-extension://${first.extensionId}/sidepanel.html`);
    await addToken(page, makeJws({ payload: { sub: 'older' } }));
    await addToken(page, makeJws({ payload: { sub: 'newer' } }));
    await first.context.close();

    const second = await launchExtension(profile);
    const reopened = await second.context.newPage();
    await reopened.goto(`chrome-extension://${second.extensionId}/sidepanel.html`);

    const lines = reopened
      .getByRole('region', { name: 'Saved tokens' })
      .getByRole('list')
      .getByRole('button');
    await expect(lines).toHaveCount(2);
    await expect(lines.nth(0)).toContainText('newer');
    await expect(lines.nth(1)).toContainText('older');
    await second.context.close();
  });

  test('shows changes from another open panel without reloading', async ({
    context,
    extensionId,
  }) => {
    const url = `chrome-extension://${extensionId}/sidepanel.html`;
    const panelA = await context.newPage();
    const panelB = await context.newPage();
    await panelA.goto(url);
    await panelB.goto(url);

    await addToken(panelA, makeJws({ payload: { sub: 'shared' } }));

    await expect(panelB.getByRole('button', { name: /shared/u })).toBeVisible();
  });

  test('never syncs and is unreachable from web pages', async ({ context, page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
    await addToken(page, makeJws({ payload: { sub: 'private' } }));

    const storage = await readStorage(page);
    expect(storage.sync).toEqual({});
    expect(JSON.stringify(storage.local)).toContain('private');

    const site = await context.newPage();
    await site.route('https://site.example.test/**', (route) =>
      route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>site</title>' }),
    );
    await site.goto('https://site.example.test/');
    const reachable = await site.evaluate(whatAPageCanSee);
    expect(reachable).toEqual({ extensionStorage: false, pageStorage: 0 });
  });
});
