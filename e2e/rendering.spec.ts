import { makeJws } from '../tests/fixtures/tokens';
import { expect, test } from './fixtures';

/** Regressions only visible in a real extension page (Chromium injects its own body styles). */
test.describe('rendering in the extension page', () => {
  test.beforeEach(async ({ page, extensionId }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  });

  test('uses Martian Mono at the body size from DESIGN.md', async ({ page }) => {
    const body = await page.evaluate(async () => {
      await document.fonts.ready;
      const style = getComputedStyle(document.body);
      return {
        family: style.fontFamily,
        size: style.fontSize,
        loaded: document.fonts.check('13px "Martian Mono Variable"'),
      };
    });

    expect(body.family).toContain('Martian Mono');
    expect(body).toMatchObject({ size: '13px', loaded: true });
  });

  test('every command is at least 24px tall (WCAG 2.5.8)', async ({ page }) => {
    await page.getByRole('button', { name: 'add token' }).click();
    await page.getByRole('textbox', { name: 'Token' }).fill(makeJws({ payload: { sub: 'size' } }));
    await page.keyboard.press('Enter');

    const heights = await page
      .getByRole('button')
      .evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().height));
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(24);
  });

  test('never scrolls sideways at 320px, even with long revealed values', async ({ page }) => {
    const long =
      'https://auth.example-identity-provider.test/realms/production/protocol/openid-connect';
    await page.getByRole('button', { name: 'add token' }).click();
    await page.getByRole('textbox', { name: 'Token' }).fill(
      makeJws({
        payload: { iss: long, email: 'someone.with.a.long.address@example-company.test' },
      }),
    );
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'reveal payload JSON' }).click();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('keeps the front matter fields readable next to a long status at 400px', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 400, height: 700 });
    await page.getByRole('button', { name: 'add token' }).click();
    const now = Math.floor(Date.now() / 1000);
    await page
      .getByRole('textbox', { name: 'Token' })
      .fill(makeJws({ payload: { iss: 'https://auth.example.test', iat: now, exp: now + 3599 } }));
    await page.keyboard.press('Enter');

    const width = await page
      .getByRole('region', { name: 'Token summary' })
      .locator('dd')
      .first()
      .evaluate((node) => node.getBoundingClientRect().width);
    expect(width).toBeGreaterThanOrEqual(120);
  });
});
