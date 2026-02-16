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
      await page.getByRole('button', { name: '退出登录' }).click();
      return;
    }
  }
  await page.getByRole('button', { name: '退出登录' }).click();
}

test('Register -> Login -> Create record -> List -> Analytics -> Export -> Logout', async ({ page }) => {
  const { username, password } = uniqueUser();
  const note = `e2e-note-${Date.now()}`;

  await page.goto('/register');
  await page.getByLabel('用户名').fill(username);
  await page.getByLabel('密码', { exact: true }).fill(password);
  await page.getByLabel('确认密码').fill(password);
  await page.getByRole('button', { name: '注册' }).click();

  await expect(page).toHaveURL(/\/records/);

  await page.getByLabel('添加第一条记录').click();
  await expect(page.getByText('新增记录')).toBeVisible();
  await page.getByLabel('备注').fill(note);
  await page.getByRole('button', { name: '保存记录' }).click();

  await expect(page).toHaveURL(/\/records/);
  await expect(page.getByText(note)).toBeVisible();

  await clickNav(page, '分析');
  await expect(page.getByRole('heading', { name: '分析仪表盘' })).toBeVisible();

  await clickNav(page, '导出');
  await expect(page.getByRole('heading', { name: '数据导出' })).toBeVisible();

  const download = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: '导出 CSV' }).click(),
  ]).then(([d]) => d);
  await expect(download.suggestedFilename()).toContain('fart_records');

  await clickLogout(page);
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: '登录你的账号' })).toBeVisible();
});

test('Mobile responsive navigation works', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'mobile-only');
  const { username, password } = uniqueUser();

  await page.goto('/register');
  await page.getByLabel('用户名').fill(username);
  await page.getByLabel('密码', { exact: true }).fill(password);
  await page.getByLabel('确认密码').fill(password);
  await page.getByRole('button', { name: '注册' }).click();
  await expect(page).toHaveURL(/\/records/);

  await clickNav(page, '分析');
  await expect(page.getByRole('heading', { name: '分析仪表盘' })).toBeVisible();

  await clickLogout(page);
  await expect(page).toHaveURL(/\/login/);
});

