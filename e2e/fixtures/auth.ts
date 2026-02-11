import { test as base, Page } from '@playwright/test';

/**
 * Authentication fixture for Playwright tests
 *
 * This sets up a mock authenticated session by injecting Supabase auth tokens
 * into localStorage, allowing tests to bypass the login flow.
 */

async function setupMockAuth(page: Page) {
  // Navigate to the app first to set the correct origin
  await page.goto('/');

  // Create a mock auth session
  const mockSession = {
    access_token: 'mock-access-token-for-testing',
    refresh_token: 'mock-refresh-token-for-testing',
    expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: 'mock-user-id',
      email: 'test@playwright.dev',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    },
  };

  // Inject mock auth into localStorage (Supabase auth format)
  await page.evaluate((session) => {
    const authKey = Object.keys(localStorage).find(key => key.includes('supabase.auth.token'));
    const storageKey = authKey || 'sb-localhost-auth-token';

    localStorage.setItem(storageKey, JSON.stringify(session));
  }, mockSession);

  // Reload to apply the auth session
  await page.reload();

  // Wait for the page to be ready
  await page.waitForLoadState('networkidle');
}

// Extend the base test with authentication
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await setupMockAuth(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
