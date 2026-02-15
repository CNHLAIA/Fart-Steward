const { test, expect } = require('@playwright/test');

function uniqueUser() {
  const stamp = Date.now();
  return {
    username: `user_${stamp}`,
    password: `pw_${stamp}_A!`,
  };
}

async function clickNav(page, name) {
  const menuButton = page.getByRole('button', { name: 'Open main menu' });
  if (await menuButton.count()) {
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.getByRole('link', { name }).click();
      return;
    }
  }
  await page.getByRole('link', { name }).click();
}

async function clickLogout(page) {
  const menuButton = page.getByRole('button', { name: 'Open main menu' });
  if (await menuButton.count()) {
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.getByRole('button', { name: 'Logout' }).click();
      return;
    }
  }
  await page.getByRole('button', { name: 'Logout' }).click();
}

test('Register -> Login -> Create record -> List -> Analytics -> Export -> Logout', async ({ page }) => {
  const { username, password } = uniqueUser();
  const note = `e2e-note-${Date.now()}`;

  await page.goto('/register');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm Password').fill(password);
  await page.getByRole('button', { name: 'Sign up' }).click();

  await expect(page).toHaveURL(/\/records/);

  await page.getByLabel('Add new record').click();
  await expect(page.getByText('New Fart')).toBeVisible();
  await page.getByLabel('Notes').fill(note);
  await page.getByRole('button', { name: 'Save Record' }).click();

  await expect(page).toHaveURL(/\/records/);
  await expect(page.getByText(note)).toBeVisible();

  await clickNav(page, 'Analytics');
  await expect(page.getByRole('heading', { name: 'Analytics Dashboard' })).toBeVisible();

  await clickNav(page, 'Export');
  await expect(page.getByRole('heading', { name: '数据导出' })).toBeVisible();

  const download = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: '导出 CSV' }).click(),
  ]).then(([d]) => d);
  await expect(download.suggestedFilename()).toContain('fart_records');

  await clickLogout(page);
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: 'Sign in to your account' })).toBeVisible();
});

test('Mobile responsive navigation works', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'mobile-only');
  const { username, password } = uniqueUser();

  await page.goto('/register');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm Password').fill(password);
  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(page).toHaveURL(/\/records/);

  await clickNav(page, 'Analytics');
  await expect(page.getByRole('heading', { name: 'Analytics Dashboard' })).toBeVisible();

  await clickLogout(page);
  await expect(page).toHaveURL(/\/login/);
});
