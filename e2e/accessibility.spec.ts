import { AxeBuilder } from '@axe-core/playwright';
import type { Page } from '@playwright/test';

import { encodeSegment, makeJws, seconds } from '../tests/fixtures/tokens';
import { expect, launchExtension, seedVault, test } from './fixtures';

const H = 3_600_000;
const WCAG_22_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const COMMANDS = {
  en: { add: 'add token', back: 'back', delete: 'delete', clearAll: 'clear all' },
  es: { add: 'agregar token', back: 'volver', delete: 'borrar', clearAll: 'borrar todo' },
} as const;

const record = (id: string, raw: string, label: string, kind = 'jws') => ({
  id,
  raw,
  kind,
  label,
  source: { kind: 'manual' },
  addedAt: 0,
});

function tokens() {
  const now = Date.now();
  return [
    record(
      'valid',
      makeJws({
        payload: { sub: 'u', email: 'a@b.test', iat: seconds(now - H), exp: seconds(now + H) },
      }),
      'Valid one',
    ),
    record(
      'expired',
      makeJws({ payload: { sub: 'x', iat: seconds(now - 2 * H), exp: seconds(now - H) } }),
      'Expired one',
    ),
    record(
      'jwe',
      [encodeSegment({ alg: 'RSA-OAEP', enc: 'A256GCM' }), 'a', 'b', 'c', 'd'].join('.'),
      'Encrypted one',
      'jwe',
    ),
  ];
}

async function expectNoViolations(page: Page, screen: string) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_22_AA).analyze();
  expect(
    violations.map((violation) => `${screen}: ${violation.id} (${violation.nodes.length})`),
  ).toEqual([]);
}

/** Every screen and floating layer of 001, in one theme and language. */
async function auditAllScreens(page: Page, extensionId: string, language: 'en' | 'es') {
  const names = COMMANDS[language];
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  await expectNoViolations(page, 'empty list');

  await page.getByRole('button', { name: names.add }).click();
  await page.getByRole('textbox').fill('only.two');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('alert')).toBeVisible();
  await expectNoViolations(page, 'add with error');

  await seedVault(page, tokens());
  await expectNoViolations(page, 'seeded list');

  const auditDetail = async (index: number) => {
    await page.getByRole('list').getByRole('button').nth(index).click();
    await expectNoViolations(page, `detail ${index}`);
    await page.getByRole('button', { name: names.back }).click();
  };
  await auditDetail(0);
  await auditDetail(1);
  await auditDetail(2);

  // "delete" is exact: since US5 the persistent bar's "clear expired"/"clear all" are on every
  // screen too, and their names would otherwise also match a fuzzy "delete" ("borrar ...").
  await page.getByRole('list').getByRole('button').first().click();
  await page.getByRole('button', { name: names.delete, exact: true }).click();
  await expectNoViolations(page, 'undo toast');

  await page.getByRole('button', { name: names.clearAll }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expectNoViolations(page, 'confirm dialog');
}

for (const language of ['en', 'es'] as const) {
  for (const colorScheme of ['light', 'dark'] as const) {
    // oxlint-disable-next-line no-empty-pattern -- Playwright requires the destructuring signature
    test(`WCAG 2.2 AA in ${language}, ${colorScheme} theme (SC-006)`, async ({}) => {
      const { context, extensionId } = await launchExtension('', language);
      const page = await context.newPage();
      await page.setViewportSize({ width: 320, height: 568 });
      await page.emulateMedia({ colorScheme });

      await auditAllScreens(page, extensionId, language);
      await context.close();
    });
  }
}

test('US1–US4 work with the keyboard alone at 320px (FR-026)', async ({ page, extensionId }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  // `goto` resolves on load, not on React hydration; wait for the app before the first Tab so a
  // slow start under load never gets mistaken for a wrong tab order.
  const addToken = page.getByRole('button', { name: 'add token' });
  await addToken.waitFor();

  await page.keyboard.press('Tab');
  await expect(addToken).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('textbox', { name: 'Token' })).toBeFocused();
  await page.keyboard.type(makeJws({ payload: { sub: 'keyboard', exp: seconds(Date.now() + H) } }));
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Token summary' })).toBeVisible();

  await page.getByRole('button', { name: 'reveal signature' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'hide signature' })).toBeFocused();

  await page.getByRole('button', { name: 'back' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'clear all' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'cancel' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'clear all' })).toBeFocused();
});
