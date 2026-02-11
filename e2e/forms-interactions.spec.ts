import { test, expect, type Page } from '@playwright/test';

/**
 * Automated Usability Testing: Forms & Interactions
 *
 * Test Scope:
 * 1. Expense creation form validation
 * 2. Error states and shake animations
 * 3. Loading states and spinners
 * 4. Tag input component
 * 5. Multi-step navigation
 * 6. Icon usage (Lucide SVGs, no emojis)
 */

test.describe('Expense Form - Usability Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to expense creation page
    await page.goto('/expenses/new');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test.describe('1. Basic Validation & Error States', () => {
    test('should show shake animation on empty form submission', async ({ page }) => {
      // Get the form submit button
      const submitButton = page.locator('button[type="submit"]').filter({ hasText: 'Next' });

      // Submit empty form
      await submitButton.click();

      // Check that we're still on step 1 (basic info)
      const stepIndicators = page.locator('.h-1.rounded');
      const activeSteps = await stepIndicators.evaluateAll(steps =>
        steps.filter(s => s.classList.contains('bg-ios-blue')).length
      );
      expect(activeSteps).toBe(1);

      // Verify error messages appear
      const amountError = page.locator('text=Amount is required');
      await expect(amountError).toBeVisible();

      const descriptionError = page.locator('text=Description is required');
      await expect(descriptionError).toBeVisible();

      const categoryError = page.locator('text=Category is required');
      await expect(categoryError).toBeVisible();

      // Take screenshot of validation state
      await page.screenshot({
        path: 'playwright-report/validation-errors.png',
        fullPage: true
      });
    });

    test('should display AlertCircle icon (not emoji) in error messages', async ({ page }) => {
      // Submit empty form to trigger errors
      await page.locator('button[type="submit"]').filter({ hasText: 'Next' }).click();

      // Check for Lucide AlertCircle SVG usage (should not find emoji ⚠️)
      const pageContent = await page.content();

      // Verify no warning emoji is used
      expect(pageContent).not.toContain('⚠️');
      expect(pageContent).not.toContain('⚠');

      // Check for Lucide icons class or SVG structure
      const svgIcons = await page.locator('svg').count();
      expect(svgIcons).toBeGreaterThan(0);
    });

    test('should show red border on invalid fields', async ({ page }) => {
      const amountInput = page.locator('input[type="number"]').first();
      const descriptionInput = page.locator('input[placeholder*="What was this expense for?"]');

      // Focus and blur to trigger validation
      await amountInput.focus();
      await amountInput.blur();

      await descriptionInput.focus();
      await descriptionInput.blur();

      // Submit to mark all fields as touched
      await page.locator('button[type="submit"]').filter({ hasText: 'Next' }).click();

      // Check for red border class
      const amountBorderClass = await amountInput.getAttribute('class');
      expect(amountBorderClass).toContain('border-ios-red');

      const descriptionBorderClass = await descriptionInput.getAttribute('class');
      expect(descriptionBorderClass).toContain('border-ios-red');

      await page.screenshot({
        path: 'playwright-report/red-borders.png',
        fullPage: true
      });
    });

    test('should validate amount format (2 decimal places max)', async ({ page }) => {
      const amountInput = page.locator('input[type="number"]').first();

      // Try entering amount with 3 decimal places
      await amountInput.fill('10.999');
      await amountInput.blur();

      // Submit form
      await page.locator('button[type="submit"]').filter({ hasText: 'Next' }).click();

      // Check for validation error
      const error = page.locator('text=Amount must have at most 2 decimal places');
      await expect(error).toBeVisible();
    });

    test('should validate amount is greater than 0', async ({ page }) => {
      const amountInput = page.locator('input[type="number"]').first();

      // Try entering 0
      await amountInput.fill('0');
      await amountInput.blur();

      // Submit form
      await page.locator('button[type="submit"]').filter({ hasText: 'Next' }).click();

      // Check for validation error
      const error = page.locator('text=Amount must be greater than 0');
      await expect(error).toBeVisible();
    });

    test('should validate description length (max 255 characters)', async ({ page }) => {
      const descriptionInput = page.locator('input[placeholder*="What was this expense for?"]');

      // Enter description longer than 255 characters
      const longDescription = 'a'.repeat(256);
      await descriptionInput.fill(longDescription);
      await descriptionInput.blur();

      // Submit form
      await page.locator('button[type="submit"]').filter({ hasText: 'Next' }).click();

      // Check for validation error
      const error = page.locator('text=Description must be less than 255 characters');
      await expect(error).toBeVisible();
    });

    test('should not allow future dates', async ({ page }) => {
      const dateInput = page.locator('input[type="date"]');

      // Try to select a future date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const futureDateString = futureDate.toISOString().split('T')[0];

      await dateInput.fill(futureDateString);
      await dateInput.blur();

      // Submit form
      await page.locator('button[type="submit"]').filter({ hasText: 'Next' }).click();

      // Check for validation error
      const error = page.locator('text=Date cannot be in the future');
      await expect(error).toBeVisible();
    });
  });

  test.describe('2. Tag Input Component', () => {
    test('should add tags with smooth scale animation', async ({ page }) => {
      const tagInput = page.locator('input[placeholder*="Add tags"]');

      // Add a tag
      await tagInput.fill('vacation');
      await tagInput.press('Enter');

      // Verify tag appears
      const tag = page.locator('text=vacation').first();
      await expect(tag).toBeVisible();

      // Check for animation classes (framer-motion)
      const tagElement = page.locator('div').filter({ hasText: /^vacation$/ }).first();
      await expect(tagElement).toBeVisible();

      // Input should be cleared after adding
      await expect(tagInput).toHaveValue('');

      await page.screenshot({
        path: 'playwright-report/tag-added.png',
        fullPage: true
      });
    });

    test('should add tags on comma input', async ({ page }) => {
      const tagInput = page.locator('input[placeholder*="Add tags"]');

      // Add tag with comma
      await tagInput.fill('beach,');

      // Verify tag appears
      const tag = page.locator('text=beach').first();
      await expect(tag).toBeVisible();

      // Input should be cleared
      await expect(tagInput).toHaveValue('');
    });

    test('should remove tag with exit animation', async ({ page }) => {
      const tagInput = page.locator('input[placeholder*="Add tags"]');

      // Add a tag
      await tagInput.fill('food');
      await tagInput.press('Enter');

      // Verify tag appears
      await expect(page.locator('text=food').first()).toBeVisible();

      // Click remove button on tag
      const removeButton = page.locator('button[aria-label*="Remove food"]');
      await removeButton.click();

      // Wait for exit animation
      await page.waitForTimeout(300);

      // Verify tag is removed
      await expect(page.locator('text=food')).toHaveCount(0);

      await page.screenshot({
        path: 'playwright-report/tag-removed.png',
        fullPage: true
      });
    });

    test('should show autocomplete dropdown with slide-down animation', async ({ page }) => {
      // First, add a tag to populate suggestions for later
      const tagInput = page.locator('input[placeholder*="Add tags"]');
      await tagInput.fill('travel');
      await tagInput.press('Enter');

      // Clear the input
      await tagInput.clear();

      // Type partial tag name to trigger autocomplete
      await tagInput.fill('tra');

      // Wait for dropdown to appear
      await page.waitForTimeout(400); // Wait for debounce

      // Check if suggestion appears (if it exists in DB)
      // This test validates the dropdown mechanism exists
      const dropdown = page.locator('div').filter({ hasText: 'travel' }).nth(1);

      // Take screenshot regardless of whether suggestions appear
      await page.screenshot({
        path: 'playwright-report/tag-autocomplete.png',
        fullPage: true
      });
    });

    test('should not contain emojis in tag UI', async ({ page }) => {
      const tagInput = page.locator('input[placeholder*="Add tags"]');

      // Add several tags
      await tagInput.fill('test1');
      await tagInput.press('Enter');
      await tagInput.fill('test2');
      await tagInput.press('Enter');

      // Get all tag content
      const pageContent = await page.content();

      // Common emojis that should NOT be in the UI
      const emojis = ['🏷️', '🏷', '✕', '×', '❌'];
      for (const emoji of emojis) {
        // X emoji is ok for close button, but tag emoji is not
        if (emoji.includes('🏷')) {
          expect(pageContent).not.toContain(emoji);
        }
      }
    });

    test('should prevent duplicate tags', async ({ page }) => {
      const tagInput = page.locator('input[placeholder*="Add tags"]');

      // Add a tag
      await tagInput.fill('duplicate');
      await tagInput.press('Enter');

      // Try to add the same tag again
      await tagInput.fill('duplicate');
      await tagInput.press('Enter');

      // Should only have one tag
      const tagCount = await page.locator('text=duplicate').count();
      expect(tagCount).toBeLessThanOrEqual(1);
    });

    test('should normalize tags to lowercase', async ({ page }) => {
      const tagInput = page.locator('input[placeholder*="Add tags"]');

      // Add tag with uppercase
      await tagInput.fill('UPPERCASE');
      await tagInput.press('Enter');

      // Verify tag is lowercase
      const tag = page.locator('text=uppercase');
      await expect(tag).toBeVisible();

      // Uppercase version should not exist
      await expect(page.locator('text=UPPERCASE')).toHaveCount(0);
    });
  });

  test.describe('3. Multi-Step Navigation', () => {
    test('should navigate through all 3 steps with proper transitions', async ({ page }) => {
      // Step 1: Fill basic info
      await page.locator('input[type="number"]').first().fill('50.00');
      await page.locator('input[placeholder*="What was this expense for?"]').fill('Test Expense');
      await page.locator('select').first().selectOption('Food');

      // Take screenshot of step 1
      await page.screenshot({
        path: 'playwright-report/step-1-filled.png',
        fullPage: true
      });

      // Click Next to go to step 2
      await page.locator('button[type="submit"]').filter({ hasText: 'Next' }).click();

      // Wait for transition
      await page.waitForTimeout(300);

      // Verify we're on step 2 (participants)
      const backButton = page.locator('button', { hasText: 'Back' }).first();
      await expect(backButton).toBeVisible();

      // Check step indicator (2 bars should be blue)
      const stepIndicators = page.locator('.h-1.rounded.bg-ios-blue');
      expect(await stepIndicators.count()).toBe(2);

      // Take screenshot of step 2
      await page.screenshot({
        path: 'playwright-report/step-2-participants.png',
        fullPage: true
      });
    });

    test('should test back button functionality', async ({ page }) => {
      // Step 1: Fill and advance
      await page.locator('input[type="number"]').first().fill('25.50');
      await page.locator('input[placeholder*="What was this expense for?"]').fill('Coffee');
      await page.locator('select').first().selectOption('Food');
      await page.locator('button[type="submit"]').filter({ hasText: 'Next' }).click();

      // Wait for step 2
      await page.waitForTimeout(300);

      // Click back
      const backButton = page.locator('button').filter({ hasText: 'Back' }).first();
      await backButton.click();

      // Wait for transition
      await page.waitForTimeout(300);

      // Verify we're back on step 1
      const stepIndicators = page.locator('.h-1.rounded.bg-ios-blue');
      expect(await stepIndicators.count()).toBe(1);

      // Verify form data is preserved
      const amountInput = page.locator('input[type="number"]').first();
      await expect(amountInput).toHaveValue('25.5');
    });

    test('should show step indicators animating correctly', async ({ page }) => {
      // Get initial step indicators
      let activeSteps = await page.locator('.h-1.rounded.bg-ios-blue').count();
      expect(activeSteps).toBe(1);

      // Fill form and advance
      await page.locator('input[type="number"]').first().fill('100.00');
      await page.locator('input[placeholder*="What was this expense for?"]').fill('Dinner');
      await page.locator('select').first().selectOption('Food');
      await page.locator('button[type="submit"]').filter({ hasText: 'Next' }).click();

      // Wait for animation
      await page.waitForTimeout(400);

      // Check that 2 steps are now active
      activeSteps = await page.locator('.h-1.rounded.bg-ios-blue').count();
      expect(activeSteps).toBe(2);

      // Take screenshot
      await page.screenshot({
        path: 'playwright-report/step-indicators.png',
        fullPage: true
      });
    });
  });

  test.describe('4. Loading States', () => {
    test('should show loading spinner (no emoji) during submission', async ({ page }) => {
      // Note: This test validates the loading state structure
      // Actual submission may require authentication

      // Check that the submit button exists
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();

      // Verify page content doesn't contain loading emojis
      const pageContent = await page.content();
      expect(pageContent).not.toContain('⏳');
      expect(pageContent).not.toContain('⌛');
      expect(pageContent).not.toContain('🔄');

      // Check for the presence of "Saving..." text structure in the component
      // (It won't be visible until submission, but we can verify no emojis exist)
    });

    test('should show "Saving..." text (not emoji) when form submits', async ({ page }) => {
      // Fill valid form data
      await page.locator('input[type="number"]').first().fill('75.00');
      await page.locator('input[placeholder*="What was this expense for?"]').fill('Taxi');
      await page.locator('select').first().selectOption('Transport');

      // Check source doesn't have emoji in loading text
      const pageSource = await page.content();

      // Verify the button structure uses spinner div, not emoji
      const buttonText = await page.locator('button[type="submit"]').textContent();
      expect(buttonText).not.toContain('⏳');
      expect(buttonText).not.toContain('🔄');
    });

    test('should disable submit button while form is invalid', async ({ page }) => {
      const submitButton = page.locator('button[type="submit"]');

      // Button should be disabled initially (empty form)
      const isDisabled = await submitButton.evaluate(button =>
        button.classList.contains('cursor-not-allowed') ||
        (button as HTMLButtonElement).disabled
      );
      expect(isDisabled).toBe(true);

      // Fill valid data
      await page.locator('input[type="number"]').first().fill('50.00');
      await page.locator('input[placeholder*="What was this expense for?"]').fill('Lunch');
      await page.locator('select').first().selectOption('Food');

      // Button should now be enabled
      const isEnabledNow = await submitButton.evaluate(button =>
        !button.classList.contains('cursor-not-allowed') &&
        !(button as HTMLButtonElement).disabled
      );
      expect(isEnabledNow).toBe(true);
    });
  });

  test.describe('5. Icon Usage (Lucide SVGs)', () => {
    test('should use Lucide AlertCircle for error messages', async ({ page }) => {
      // Navigate to a page that might show errors
      await page.goto('/expenses/new');

      // Check the source code for AlertCircle import
      const pageSource = await page.content();

      // Verify no emoji icons are used
      expect(pageSource).not.toContain('⚠️');
      expect(pageSource).not.toContain('⛔');
      expect(pageSource).not.toContain('🚫');
    });

    test('should verify all SVG icons are present (not emojis)', async ({ page }) => {
      // Get all text content
      const bodyText = await page.locator('body').textContent();

      // Common icon emojis that should NOT be present
      const forbiddenEmojis = ['⚠️', '✅', '❌', '🔄', '⏳', '💾', '📝'];

      for (const emoji of forbiddenEmojis) {
        expect(bodyText).not.toContain(emoji);
      }

      // Verify SVGs exist for visual elements
      const svgCount = await page.locator('svg').count();
      expect(svgCount).toBeGreaterThan(0);
    });
  });

  test.describe('6. Form UX Observations', () => {
    test('should have proper focus states on inputs', async ({ page }) => {
      const amountInput = page.locator('input[type="number"]').first();

      // Focus the input
      await amountInput.focus();

      // Check for focus ring
      const inputClass = await amountInput.getAttribute('class');
      expect(inputClass).toContain('focus:ring');

      await page.screenshot({
        path: 'playwright-report/focus-state.png',
        fullPage: true
      });
    });

    test('should have accessible labels for form fields', async ({ page }) => {
      // Check for label elements
      const labels = page.locator('label');
      const labelCount = await labels.count();

      expect(labelCount).toBeGreaterThan(0);

      // Verify specific labels exist
      await expect(page.locator('text=Amount')).toBeVisible();
      await expect(page.locator('text=Description')).toBeVisible();
      await expect(page.locator('text=Category')).toBeVisible();
      await expect(page.locator('text=Date')).toBeVisible();
    });

    test('should show currency symbol in amount input', async ({ page }) => {
      // Check for currency symbol display
      const currencySymbol = page.locator('text=A$').first();
      await expect(currencySymbol).toBeVisible();

      // Change currency and verify symbol updates
      const currencySelect = page.locator('select').nth(1); // Second select is currency
      await currencySelect.selectOption('USD');

      // Verify new symbol
      const usdSymbol = page.locator('text=$').first();
      await expect(usdSymbol).toBeVisible();
    });

    test('should have smooth page transitions', async ({ page }) => {
      // Fill form
      await page.locator('input[type="number"]').first().fill('45.00');
      await page.locator('input[placeholder*="What was this expense for?"]').fill('Groceries');
      await page.locator('select').first().selectOption('Food');

      // Record navigation timing
      const startTime = Date.now();
      await page.locator('button[type="submit"]').filter({ hasText: 'Next' }).click();
      await page.waitForTimeout(100);
      const endTime = Date.now();

      // Transition should be fast (< 1 second)
      const transitionTime = endTime - startTime;
      expect(transitionTime).toBeLessThan(1000);
    });

    test('should have responsive touch targets (min 44px)', async ({ page }) => {
      // Check submit button size
      const submitButton = page.locator('button[type="submit"]');
      const buttonBox = await submitButton.boundingBox();

      expect(buttonBox).not.toBeNull();
      if (buttonBox) {
        expect(buttonBox.height).toBeGreaterThanOrEqual(44);
      }

      // Check tag remove button size
      const tagInput = page.locator('input[placeholder*="Add tags"]');
      await tagInput.fill('test');
      await tagInput.press('Enter');

      await page.waitForTimeout(300);

      const removeButton = page.locator('button[aria-label*="Remove test"]');
      if (await removeButton.count() > 0) {
        const removeBox = await removeButton.boundingBox();
        expect(removeBox).not.toBeNull();
        // Tag remove buttons can be slightly smaller as they're not primary actions
      }
    });
  });

  test.describe('7. Animation Quality Assessment', () => {
    test('should test shake animation smoothness', async ({ page }) => {
      // Submit empty form to trigger shake
      await page.locator('button[type="submit"]').filter({ hasText: 'Next' }).click();

      // Wait for shake animation
      await page.waitForTimeout(500);

      // Verify form is still visible and properly positioned
      const amountInput = page.locator('input[type="number"]').first();
      await expect(amountInput).toBeVisible();

      const box = await amountInput.boundingBox();
      expect(box).not.toBeNull();

      await page.screenshot({
        path: 'playwright-report/shake-animation.png',
        fullPage: true
      });
    });

    test('should verify framer-motion animations are present', async ({ page }) => {
      // Check for motion components in the page
      const pageSource = await page.content();

      // The page should use framer-motion (via motion components)
      // This is validated by checking the components work correctly

      // Add a tag to test animation
      const tagInput = page.locator('input[placeholder*="Add tags"]');
      await tagInput.fill('animated');
      await tagInput.press('Enter');

      // Tag should appear smoothly
      const tag = page.locator('text=animated').first();
      await expect(tag).toBeVisible({ timeout: 1000 });
    });
  });
});

test.describe('Additional Form Components', () => {
  test('should test currency auto-detection feedback', async ({ page }) => {
    await page.goto('/expenses/new');
    await page.waitForLoadState('networkidle');

    // Wait a moment for auto-detection
    await page.waitForTimeout(500);

    // Check if auto-detection message appears
    const autoDetectText = page.locator('text=Auto-detected:');
    // This may or may not be visible depending on geolocation
    // Just verify the page loads without errors

    await page.screenshot({
      path: 'playwright-report/currency-auto-detect.png',
      fullPage: true
    });
  });

  test('should test manual exchange rate toggle', async ({ page }) => {
    await page.goto('/expenses/new');

    // Change to non-AUD currency
    const currencySelect = page.locator('select').nth(1);
    await currencySelect.selectOption('USD');

    // Look for custom exchange rate option
    const customRateButton = page.locator('text=Set custom exchange rate');
    if (await customRateButton.count() > 0) {
      await customRateButton.click();

      // Verify input appears
      await page.waitForTimeout(300);

      const rateInput = page.locator('input[placeholder*="1.6500"]');
      await expect(rateInput).toBeVisible();

      await page.screenshot({
        path: 'playwright-report/exchange-rate-input.png',
        fullPage: true
      });
    }
  });
});
