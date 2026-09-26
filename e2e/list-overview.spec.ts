import { makeJws, seconds } from '../tests/fixtures/tokens';
import { expect, seedVault as seed, test } from './fixtures';

const H = 3_600_000;

function record(index: number, raw: string, label = `Token ${index}`) {
  return {
    id: `seed-${index}`,
    raw,
    kind: 'jws',
    label,
    source: { kind: 'manual' },
    addedAt: index,
  };
}

test.describe('US2 see all my tokens and their remaining life', () => {
  test.beforeEach(async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  });

  test('shows the empty state first, then the index most recent first (FR-007, FR-012)', async ({
    page,
  }) => {
    await expect(page.getByText('No tokens yet')).toBeVisible();

    const now = Date.now();
    await seed(page, [
      record(2, makeJws({ payload: { sub: 'newest', exp: seconds(now + H) } }), 'Newest'),
      record(1, makeJws({ payload: { sub: 'oldest', exp: seconds(now - H) } }), 'Oldest'),
    ]);

    const lines = page.getByRole('region', { name: 'Saved tokens' }).getByRole('button');
    await expect(lines).toHaveCount(2);
    await expect(lines.nth(0)).toContainText('Newest');
    await expect(lines.nth(1)).toContainText('Expired');
    await expect(page.getByText('2 tokens')).toBeVisible();
  });

  test('flips to Expired within a second of exp while visible (SC-007)', async ({ page }) => {
    const exp = Date.now() + 3000;
    await seed(page, [record(1, makeJws({ payload: { sub: 'soon', exp: seconds(exp) } }), 'Soon')]);

    await expect(page.getByRole('button', { name: /Soon/u })).toContainText('Expired', {
      timeout: 6000,
    });
    expect(Date.now() - exp).toBeLessThan(1500);
  });

  test('opens a token and comes back to the list', async ({ page }) => {
    await seed(page, [record(1, makeJws({ payload: { sub: 'x' } }), 'Session')]);

    await page.getByRole('button', { name: /Session/u }).click();
    await expect(page.getByRole('region', { name: 'Token summary' })).toBeVisible();
    await page.getByRole('button', { name: 'back' }).click();

    await expect(page.getByRole('button', { name: /Session/u })).toBeVisible();
  });

  test('with 200 tokens the first line is clickable within 1 second (SC-004)', async ({ page }) => {
    const now = Date.now();
    const tokens = Array.from({ length: 200 }, (_, index) =>
      record(
        index,
        makeJws({ payload: { sub: `user-${index}`, iat: seconds(now), exp: seconds(now + H) } }),
      ),
    );
    await seed(page, tokens);

    const first = page.getByRole('region', { name: 'Saved tokens' }).getByRole('button').first();
    await first.waitFor();
    const elapsed = await page.evaluate(() => performance.now());
    await first.click({ trial: true });

    expect(elapsed).toBeLessThan(1000);
  });
});
