import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

/**
 * Authentication Setup for E2E Tests
 *
 * This creates a mock authenticated session for testing
 * protected routes without requiring actual Supabase auth.
 */

setup('mock authentication', async ({ page, context }) => {
  // For testing purposes, we'll check if we can access the app
  await page.goto('/');

  // Check if we're redirected to login
  const currentUrl = page.url();

  if (currentUrl.includes('/auth/login')) {
    console.log('Auth required - tests will need to handle login flow');

    // For now, we'll create a minimal mock session
    // In a real scenario, you'd use test credentials here
    await context.addCookies([
      {
        name: 'sb-access-token',
        value: 'mock-token-for-testing',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ]);
  }

  // Save storage state for reuse
  await page.context().storageState({ path: authFile });
});
