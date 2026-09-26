import { makeJws } from '../tests/fixtures/tokens';
import { expect, test } from './fixtures';

const token = makeJws({
  payload: { sub: 'u-17', email: 'maria@example.test', roles: ['admin'] },
  signature: 'c2lnbmF0dXJl',
});

test.describe('US3 protect sensitive values and copy what I need', () => {
  test.beforeEach(async ({ context, page, extensionId }) => {
    // Extension origins are opaque to the permission API, so grant for the whole context.
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
    await page.getByRole('button', { name: 'add token' }).click();
    await page.getByRole('textbox', { name: 'Token' }).fill(token);
    await page.keyboard.press('Enter');
  });

  test('reveals one value at a time and hides it again (US3 AS1, AS2)', async ({ page }) => {
    await expect(page.getByText('maria@example.test')).toHaveCount(0);

    await page.getByRole('button', { name: 'reveal email' }).click();
    await expect(page.getByText('maria@example.test')).toBeVisible();
    await expect(page.getByText('c2lnbmF0dXJl')).toHaveCount(0);

    await page.getByRole('button', { name: 'hide email' }).click();
    await expect(page.getByText('maria@example.test')).toHaveCount(0);
  });

  test('copies the exact unmasked values (US3 AS3)', async ({ page }) => {
    const clipboard = () => page.evaluate(() => navigator.clipboard.readText());

    await page.getByRole('button', { name: 'copy token' }).click();
    expect(await clipboard()).toBe(token);

    await page.getByRole('button', { name: 'copy email' }).click();
    expect(await clipboard()).toBe('maria@example.test');
    await expect(page.getByRole('button', { name: 'copy email' })).toContainText('copied');
  });

  test('masks everything again after leaving and reopening (US3 AS4)', async ({ page }) => {
    await page.getByRole('button', { name: 'reveal email' }).click();
    await page.getByRole('button', { name: 'back' }).click();
    await page.getByRole('button', { name: /u-17/u }).click();

    await expect(page.getByText('maria@example.test')).toHaveCount(0);
  });
});
