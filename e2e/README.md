# Splitwiser E2E Tests

This directory contains end-to-end (E2E) tests for the Splitwiser application using Playwright.

## Test Files

### `navigation-icons.spec.ts`
Comprehensive automated usability testing for navigation and icons:
- Bottom navigation component (BottomNav.tsx)
- Icon rendering verification (Lucide icons, NO emojis)
- Tab switching animations
- Page transitions
- Accessibility features (ARIA labels, keyboard navigation)
- Performance metrics

## Running Tests

### Install Dependencies
```bash
npm install
npx playwright install chromium
```

### Run All E2E Tests
```bash
npm run test:e2e
```

### Run Navigation Tests Only
```bash
npm run test:e2e:nav
```

### Run Tests with UI Mode (Interactive)
```bash
npm run test:e2e:ui
```

### Run Tests in Headed Mode (See Browser)
```bash
npm run test:e2e:headed
```

### View Test Report
```bash
npm run test:e2e:report
```

## Test Results

Latest test results are available in:
- **Full Report:** `/test-results/NAVIGATION-ICONS-TEST-REPORT.md`
- **Screenshots:** `/test-results/*/test-failed-*.png`
- **HTML Report:** Run `npm run test:e2e:report`

## Test Page

A special test page is available at `/test-navigation` for testing navigation components without authentication requirements.

## Current Test Status

**Last Run:** 2026-02-11
**Pass Rate:** 72.7% (32/44 tests passing)
**Critical Issues:** 0
**Emoji Count:** 0 (All icons are Lucide SVG)

### Passing Tests
- Icon rendering (Lucide SVG verification)
- Emoji detection (none found)
- Tab switching
- Icon color changes
- Keyboard navigation
- Page transitions
- Performance metrics
- Visual consistency

### Known Issues
- Some tests fail due to authentication redirects
- Animation tests need selector updates
- ARIA current attribute tests affected by navigation

## Writing New Tests

### Example Test Structure
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-navigation');
    await page.waitForSelector('nav', { state: 'visible' });
  });

  test('should do something', async ({ page }) => {
    // Your test code
  });
});
```

### Best Practices
1. Use `/test-navigation` page for component testing
2. Always wait for elements to be visible
3. Use specific selectors (aria-label, role, etc.)
4. Add descriptive test names
5. Include timeouts for animations
6. Capture screenshots on failure (automatic)

## Fixtures

### Auth Fixture
Located at `/e2e/fixtures/auth.ts` - provides mock authentication for tests.

Usage:
```typescript
import { test } from '../fixtures/auth';

test('authenticated test', async ({ authenticatedPage }) => {
  // authenticatedPage has mock auth
});
```

## Configuration

Main config: `/playwright.config.ts`

Key settings:
- Base URL: `http://localhost:3000`
- Test directory: `./e2e`
- Browsers: Chromium
- Timeout: 30s per test
- Screenshots: On failure only
- Retries: 2 (in CI mode)

## Debugging Tests

### Run Specific Test
```bash
npx playwright test -g "test name pattern"
```

### Debug Mode
```bash
npx playwright test --debug
```

### Trace Viewer
```bash
npx playwright show-trace test-results/trace.zip
```

## CI/CD Integration

Tests are configured to run in CI environments with:
- Headless mode
- 2 retries
- HTML report generation
- Screenshot capture on failure

## Support

For issues or questions about E2E tests, refer to:
- Playwright docs: https://playwright.dev
- Test report: `/test-results/NAVIGATION-ICONS-TEST-REPORT.md`
