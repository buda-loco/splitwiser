import { test, expect } from '@playwright/test';

test.describe('Bottom Navigation Bar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should render all 4 navigation tabs', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Main navigation"]');
    await expect(nav).toBeVisible();

    // Check all 4 tabs exist
    const tabs = nav.locator('a[aria-label]');
    await expect(tabs).toHaveCount(4);

    // Verify tab labels
    await expect(nav.locator('a[aria-label="Expenses"]')).toBeVisible();
    await expect(nav.locator('a[aria-label="Balances"]')).toBeVisible();
    await expect(nav.locator('a[aria-label="Settlements"]')).toBeVisible();
    await expect(nav.locator('a[aria-label="Settings"]')).toBeVisible();
  });

  test('should display Lucide icons (not emojis)', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Main navigation"]');

    // Check for SVG icons (Lucide React renders as SVG)
    const icons = nav.locator('svg.lucide');
    await expect(icons).toHaveCount(4);

    // Verify no emoji characters in text content
    const navText = await nav.textContent();
    expect(navText).not.toMatch(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]/u);
  });

  test('should navigate to Balances when clicking Balances tab', async ({ page }) => {
    const balancesTab = page.locator('a[aria-label="Balances"]');

    // Click the Balances tab
    await balancesTab.click();

    // Wait for navigation
    await page.waitForURL('**/balances');

    // Verify URL changed
    expect(page.url()).toContain('/balances');

    // Verify active state
    await expect(balancesTab).toHaveAttribute('aria-current', 'page');
  });

  test('should navigate to Settlements when clicking Settlements tab', async ({ page }) => {
    const settlementsTab = page.locator('a[aria-label="Settlements"]');

    await settlementsTab.click();
    await page.waitForURL('**/settlements');

    expect(page.url()).toContain('/settlements');
    await expect(settlementsTab).toHaveAttribute('aria-current', 'page');
  });

  test('should navigate to Settings when clicking Settings tab', async ({ page }) => {
    const settingsTab = page.locator('a[aria-label="Settings"]');

    await settingsTab.click();
    await page.waitForURL('**/settings');

    expect(page.url()).toContain('/settings');
    await expect(settingsTab).toHaveAttribute('aria-current', 'page');
  });

  test('should navigate back to Expenses from another tab', async ({ page }) => {
    // Go to Balances first
    await page.locator('a[aria-label="Balances"]').click();
    await page.waitForURL('**/balances');

    // Click Expenses tab
    const expensesTab = page.locator('a[aria-label="Expenses"]');
    await expensesTab.click();

    // Wait for navigation
    await page.waitForURL('http://localhost:3000/');

    // Verify we're at root
    expect(page.url()).toBe('http://localhost:3000/');

    // Verify active state
    await expect(expensesTab).toHaveAttribute('aria-current', 'page');
  });

  test('should show correct active state on initial page load', async ({ page }) => {
    // On root page, Expenses should be active
    const expensesTab = page.locator('a[aria-label="Expenses"]');
    await expect(expensesTab).toHaveAttribute('aria-current', 'page');

    // Other tabs should not be active
    await expect(page.locator('a[aria-label="Balances"]')).not.toHaveAttribute('aria-current', 'page');
    await expect(page.locator('a[aria-label="Settlements"]')).not.toHaveAttribute('aria-current', 'page');
    await expect(page.locator('a[aria-label="Settings"]')).not.toHaveAttribute('aria-current', 'page');
  });

  test('should maintain active state when navigating to nested routes', async ({ page }) => {
    // Navigate to new expense page
    await page.goto('http://localhost:3000/expenses/new');
    await page.waitForLoadState('networkidle');

    // Expenses tab should still be active (pathname starts with /expenses)
    const expensesTab = page.locator('a[aria-label="Expenses"]');
    await expect(expensesTab).toHaveAttribute('aria-current', 'page');
  });

  test('should apply correct styling to active tab', async ({ page }) => {
    const expensesTab = page.locator('a[aria-label="Expenses"]');

    // Check icon color (should be iOS blue)
    const activeIcon = expensesTab.locator('svg');
    const iconClasses = await activeIcon.getAttribute('class');
    expect(iconClasses).toContain('text-ios-blue');

    // Navigate to Balances
    await page.locator('a[aria-label="Balances"]').click();
    await page.waitForURL('**/balances');

    // Expenses icon should now be gray
    const inactiveIcon = expensesTab.locator('svg');
    const inactiveClasses = await inactiveIcon.getAttribute('class');
    expect(inactiveClasses).toContain('text-ios-gray');
  });

  test('should be clickable on all tabs', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Main navigation"]');
    const tabs = nav.locator('a[aria-label]');

    // Verify all tabs are enabled and clickable
    for (let i = 0; i < 4; i++) {
      const tab = tabs.nth(i);
      await expect(tab).toBeEnabled();
      await expect(tab).toBeVisible();

      // Check if it has href attribute
      const href = await tab.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });

  test('should complete full navigation cycle', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Main navigation"]');

    // Start at Expenses
    expect(page.url()).toBe('http://localhost:3000/');

    // Cycle through all tabs
    await nav.locator('a[aria-label="Balances"]').click();
    await page.waitForURL('**/balances');
    expect(page.url()).toContain('/balances');

    await nav.locator('a[aria-label="Settlements"]').click();
    await page.waitForURL('**/settlements');
    expect(page.url()).toContain('/settlements');

    await nav.locator('a[aria-label="Settings"]').click();
    await page.waitForURL('**/settings');
    expect(page.url()).toContain('/settings');

    await nav.locator('a[aria-label="Expenses"]').click();
    await page.waitForURL('http://localhost:3000/');
    expect(page.url()).toBe('http://localhost:3000/');
  });
});
