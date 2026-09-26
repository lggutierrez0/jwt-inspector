import { makeJws, seconds } from '../tests/fixtures/tokens';
import { expect, seedVault, test } from './fixtures';

const H = 3_600_000;

function record(id: string, raw: string, label: string) {
  return { id, raw, kind: 'jws', label, source: { kind: 'manual' }, addedAt: 0 };
}

test.describe('US4 keep my vault tidy', () => {
  test.beforeEach(async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
    const now = Date.now();
    await seedVault(page, [
      record('live', makeJws({ payload: { sub: 'live', exp: seconds(now + H) } }), 'Live'),
      record('old', makeJws({ payload: { sub: 'old', exp: seconds(now - H) } }), 'Old'),
    ]);
  });

  test('renames a token (US4 AS1)', async ({ page }) => {
    await page.getByRole('button', { name: /Live/u }).click();
    await page.getByRole('button', { name: 'rename' }).click();
    await page.getByRole('textbox', { name: 'Label' }).fill('Production');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'back' }).click();

    await expect(page.getByRole('button', { name: /Production/u })).toBeVisible();
  });

  test('deletes a token and undoes it within 5 seconds (US4 AS2)', async ({ page }) => {
    await page.getByRole('button', { name: /Live/u }).click();
    await page.getByRole('button', { name: 'delete' }).click();
    await expect(page.getByRole('status')).toHaveText('Token deleted.');
    await expect(page.getByRole('button', { name: /Live/u })).toHaveCount(0);

    await page.getByRole('button', { name: 'undo' }).click();

    const lines = page
      .getByRole('region', { name: 'Saved tokens' })
      .getByRole('list')
      .getByRole('button');
    await expect(lines.nth(0)).toContainText('Live');
    await expect(page.getByRole('button', { name: 'undo' })).toBeHidden({ timeout: 6000 });
  });

  test('clears only expired tokens after confirming (US4 AS7)', async ({ page }) => {
    await page.getByRole('button', { name: 'clear expired' }).click();
    await expect(page.getByRole('dialog', { name: 'Remove 1 expired token?' })).toBeVisible();
    await page.getByRole('button', { name: 'remove' }).click();

    await expect(page.getByRole('button', { name: /Old/u })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Live/u })).toBeVisible();
  });

  test('clears all tokens only after confirming the count (US4 AS3)', async ({ page }) => {
    await page.getByRole('button', { name: 'clear all' }).click();
    await expect(page.getByRole('dialog', { name: 'Remove 2 tokens?' })).toBeVisible();
    await page.getByRole('button', { name: 'cancel' }).click();
    await expect(page.getByText('2 tokens')).toBeVisible();

    await page.getByRole('button', { name: 'clear all' }).click();
    await page.getByRole('button', { name: 'remove' }).click();

    await expect(page.getByText('No tokens yet')).toBeVisible();
  });
});
