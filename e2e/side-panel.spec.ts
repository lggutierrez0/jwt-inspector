import { expect, test } from './fixtures';

test('side panel loads with product name and manifest version', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);

  await expect(page.getByRole('heading', { level: 1, name: 'JWT Inspector' })).toBeVisible();
  await expect(page.getByText(/^v\d+\.\d+\.\d+$/u)).toBeVisible();
});
