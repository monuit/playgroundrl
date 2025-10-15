import { test, expect } from '@playwright/test';

test.describe('GymRL Landing Page', () => {
  test('should load without hydration errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: Error[] = [];

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      pageErrors.push(error);
    });

    await page.goto('/');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Check for hydration errors
    const hydrationErrors = consoleErrors.filter(
      (err) =>
        err.includes('hydration') ||
        err.includes('Hydration') ||
        err.includes('server rendered HTML')
    );

    expect(hydrationErrors).toHaveLength(0);
    expect(pageErrors).toHaveLength(0);
  });

  test('should display hero section correctly', async ({ page }) => {
    await page.goto('/');

    // Check for hero title
    const title = page.getByRole('heading', { name: /GymRL/i });
    await expect(title).toBeVisible();

    // Check for tagline
    const tagline = page.getByText(/Reinforcement learning in your browser/i);
    await expect(tagline).toBeVisible();

    // Check for description
    const description = page.getByText(
      /Train PPO and DQN agents on classic RL environments/i
    );
    await expect(description).toBeVisible();

    // Check for CTA buttons
    const playButton = page.getByRole('link', { name: /Launch Playground/i });
    await expect(playButton).toBeVisible();

    const githubButton = page.getByRole('link', { name: /View on GitHub/i });
    await expect(githubButton).toBeVisible();
  });

  test('should have playground section', async ({ page }) => {
    await page.goto('/');

    // Scroll to playground
    await page.evaluate(() => {
      document.querySelector('#playground')?.scrollIntoView();
    });

    // Wait for playground to be visible
    await page.waitForSelector('#playground', { state: 'visible' });

    // Check that training dashboard is rendered
    const dashboard = page.locator('#playground');
    await expect(dashboard).toBeVisible();
  });

  test('should have dark theme styling', async ({ page }) => {
    await page.goto('/');

    // Check background color is dark (slate-950)
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });

    // Slate-950 is very dark (close to black) - can be rgb or oklch format
    expect(bgColor).toMatch(/(?:rgb\(2,\s*6,\s*23\)|oklch\(0\.1\d+\s+0\.0\d+\s+\d+(?:\.\d+)?\))/);
  });

  test('should not have reward editor section', async ({ page }) => {
    await page.goto('/');

    // Check that reward function section is not present
    const rewardSection = page.getByText(/Reward function/i);
    await expect(rewardSection).toHaveCount(0);
  });

  test('should have control panel with settings', async ({ page }) => {
    await page.goto('/');
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Check for environment selector - use more specific selector to avoid strict mode violation
    const envLabel = page.locator('label[for="env"]');
    await expect(envLabel).toBeVisible();

    // Check for algorithm selector
    const algoLabel = page.locator('label[for="algo"]');
    await expect(algoLabel).toBeVisible();

    // Check for seed input
    const seedLabel = page.locator('label[for="seed"]');
    await expect(seedLabel).toBeVisible();
  });
});
