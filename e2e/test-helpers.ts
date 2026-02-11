import { Page } from '@playwright/test';

/**
 * Test helpers for setting up authenticated state
 */

export async function setupAuth(page: Page) {
  // Set up mock authentication by setting localStorage
  await page.addInitScript(() => {
    // Mock Supabase session
    const mockSession = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    // Store session in localStorage (Supabase SSR uses this)
    localStorage.setItem(
      'sb-localhost-auth-token',
      JSON.stringify(mockSession)
    );
  });
}

export async function skipIfUnauthenticated(page: Page): Promise<boolean> {
  // Check if redirected to login
  const url = page.url();
  if (url.includes('/auth/login')) {
    console.log('⚠️ Skipping test - requires authentication');
    return true;
  }
  return false;
}
