import { makeJws, seconds } from '../tests/fixtures/tokens';
import { expect, launchExtension, seedVault, test } from './fixtures';

const H = 3_600_000;

function record(id: string, raw: string, label: string) {
  return { id, raw, kind: 'jws', label, source: { kind: 'manual' }, addedAt: 0 };
}

test.describe('US5 reach every action from one place, read what the tool does, pick a language', () => {
  test.beforeEach(async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  });

  test('the bar is present on the list, add and detail screens (AS1)', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'add token' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'info' })).toBeVisible();

    await seedVault(page, [
      record('a', makeJws({ payload: { sub: 'a', exp: seconds(Date.now() + H) } }), 'A'),
    ]);
    await expect(page.getByRole('button', { name: 'add token' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'clear all' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'info' })).toBeVisible();

    await page.getByRole('button', { name: /A/u }).click();
    await expect(page.getByRole('button', { name: 'add token' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'info' })).toBeVisible();
  });

  test('omits "add token" on the add screen and "info" on the info screen (AS2)', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'add token' }).click();
    // The bar's own "add token" is gone; only the add form's own submit button (same words, a
    // different control) remains, so the count stays at 1 instead of becoming 2.
    await expect(page.getByRole('button', { name: 'add token' })).toHaveCount(1);

    await page.getByRole('button', { name: 'cancel' }).click();
    await page.getByRole('button', { name: 'info' }).click();
    await expect(page.getByRole('button', { name: 'info' })).toHaveCount(0);
  });

  test('opens info from every screen and back returns to it (AS3)', async ({ page }) => {
    // From the list (empty: back lands on the empty state, not the "Saved tokens" region).
    await page.getByRole('button', { name: 'info' }).click();
    await expect(page.getByRole('heading', { name: 'About JWT Inspector' })).toBeVisible();
    await expect(page.getByText(/^Version /u)).toBeVisible();
    await page.getByRole('button', { name: 'back' }).click();
    await expect(page.getByText('No tokens yet')).toBeVisible();

    // From the add screen.
    await page.getByRole('button', { name: 'add token' }).click();
    await page.getByRole('button', { name: 'info' }).click();
    await page.getByRole('button', { name: 'back' }).click();
    await expect(page.getByRole('textbox', { name: 'Token' })).toBeVisible();

    // From a detail.
    await page.getByRole('button', { name: 'cancel' }).click();
    await seedVault(page, [
      record('a', makeJws({ payload: { sub: 'a', exp: seconds(Date.now() + H) } }), 'A'),
    ]);
    await page.getByRole('button', { name: /A/u }).click();
    await page.getByRole('button', { name: 'info' }).click();
    await page.getByRole('button', { name: 'back' }).click();
    await expect(page.getByRole('region', { name: 'Token summary' })).toBeVisible();
  });

  test('switches the language and remembers the choice across a reload (AS4)', async ({ page }) => {
    const languageCommand = page.getByRole('button', { name: 'Switch to Spanish' });
    await expect(languageCommand).toContainText('EN');

    await languageCommand.click();
    // The whole UI, including the command's own accessible name, is now in Spanish.
    const switchedBack = page.getByRole('button', { name: 'Cambiar a inglés' });
    await expect(switchedBack).toContainText('ES');
    await expect(page.getByRole('button', { name: 'agregar token' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('button', { name: 'Cambiar a inglés' })).toContainText('ES');
    await expect(page.getByRole('button', { name: 'agregar token' })).toBeVisible();
  });

  test('clearing all from an open detail returns to the (now empty) list (AS5)', async ({
    page,
  }) => {
    await seedVault(page, [
      record('a', makeJws({ payload: { sub: 'a', exp: seconds(Date.now() + H) } }), 'A'),
    ]);
    await page.getByRole('button', { name: /A/u }).click();
    await expect(page.getByRole('region', { name: 'Token summary' })).toBeVisible();

    await page.getByRole('button', { name: 'clear all' }).click();
    await page.getByRole('button', { name: 'remove' }).click();

    await expect(page.getByText('No tokens yet')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Token summary' })).toHaveCount(0);
  });
});

test('the language override starts from the browser language, not a fixed default', async () => {
  const { context, extensionId } = await launchExtension('', 'es');
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);

  // The extension launched with a Spanish browser, so the language command's own accessible
  // name is Spanish too ("Cambiar a inglés" - switch to English).
  await expect(page.getByRole('button', { name: 'Cambiar a inglés' })).toContainText('ES');
  await expect(page.getByRole('button', { name: 'agregar token' })).toBeVisible();

  await context.close();
});
