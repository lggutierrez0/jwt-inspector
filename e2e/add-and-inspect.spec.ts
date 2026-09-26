import { encodeSegment, makeJws, seconds } from '../tests/fixtures/tokens';
import { expect, test } from './fixtures';

const H = 3_600_000;

test.use({ viewport: { width: 320, height: 568 } });

test.describe('US1 add a token and understand it at a glance', () => {
  test.beforeEach(async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  });

  test('pasted token opens its detail in 3 interactions with status visible (SC-001, SC-002)', async ({
    page,
  }) => {
    const now = Date.now();
    const token = makeJws({
      payload: {
        sub: 'e2e-user',
        iss: 'auth.example.test',
        iat: seconds(now - H),
        exp: seconds(now + H),
      },
    });

    await page.getByRole('button', { name: 'add token' }).click();
    await page.getByRole('textbox', { name: 'Token' }).fill(`Bearer ${token}`);
    await page.keyboard.press('Enter');

    await expect(page.getByText('Valid', { exact: true })).toBeInViewport();
    await expect(page.getByText(/^(59 min|1 h) left$/u)).toBeInViewport();
    await expect(page.getByRole('region', { name: 'Token summary' })).toContainText('e2e-user');
  });

  test('rejects malformed input with the exact problem', async ({ page }) => {
    await page.getByRole('button', { name: 'add token' }).click();
    await page.getByRole('textbox', { name: 'Token' }).fill('only.two');
    await page.keyboard.press('Enter');

    await expect(page.getByRole('alert')).toHaveText(
      'A JWT has 3 parts separated by dots. This text has 2.',
    );
  });

  test('does not save a duplicate and says so', async ({ page }) => {
    const token = makeJws({ payload: { sub: 'dup' } });
    const addToken = async () => {
      await page.getByRole('button', { name: 'add token' }).click();
      await page.getByRole('textbox', { name: 'Token' }).fill(token);
      await page.keyboard.press('Enter');
      await expect(page.getByText('Never expires', { exact: true })).toBeVisible();
    };

    await addToken();
    await page.getByRole('button', { name: 'back' }).click();
    await addToken();

    await expect(page.getByText(/already saved/u)).toBeVisible();
  });

  test('recognizes an encrypted token without failing', async ({ page }) => {
    const jwe = [encodeSegment({ alg: 'RSA-OAEP', enc: 'A256GCM' }), 'a', 'b', 'c', 'd'].join('.');

    await page.getByRole('button', { name: 'add token' }).click();
    await page.getByRole('textbox', { name: 'Token' }).fill(jwe);
    await page.keyboard.press('Enter');

    await expect(page.getByText(/isn't supported yet/u)).toBeVisible();
  });

  test('keeps the signature masked until revealed', async ({ page }) => {
    const token = makeJws({ payload: { sub: 'x' }, signature: 'c2VjcmV0c2ln' });

    await page.getByRole('button', { name: 'add token' }).click();
    await page.getByRole('textbox', { name: 'Token' }).fill(token);
    await page.keyboard.press('Enter');

    await expect(page.getByText('c2VjcmV0c2ln')).toHaveCount(0);
    await page.getByRole('button', { name: 'reveal signature' }).click();
    await expect(page.getByText('c2VjcmV0c2ln')).toBeVisible();
  });
});
