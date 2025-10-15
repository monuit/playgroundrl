import { test, expect } from "@playwright/test";

test.describe("PlaygroundRL Landing Page", () => {
  test("should load without hydration errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: Error[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    page.on("pageerror", (error) => {
      pageErrors.push(error);
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const hydrationErrors = consoleErrors.filter(
      (err) => err.includes("hydration") || err.includes("Hydration") || err.includes("server rendered HTML"),
    );

    expect(hydrationErrors).toHaveLength(0);
    expect(pageErrors).toHaveLength(0);
  });

  test("should display intro copy correctly", async ({ page }) => {
    await page.goto("/");

    const title = page.getByRole("heading", { name: /PlaygroundRL/i });
    await expect(title).toBeVisible();

    const tagline = page.getByText(/Load ONNX policies straight into your browser/i);
    await expect(tagline).toBeVisible();

    const enterPlayground = page.getByRole("link", { name: /Enter Playground/i });
    await expect(enterPlayground).toBeVisible();

    const githubButton = page.getByRole("link", { name: /GitHub/i });
    await expect(githubButton).toBeVisible();
  });

  test("should expose the live playground section", async ({ page }) => {
    await page.goto("/");

    await page.evaluate(() => {
      document.querySelector("#playground")?.scrollIntoView();
    });

    await page.waitForSelector("#playground", { state: "visible" });

    const telemetryHeading = page.getByRole("heading", { name: /PlaygroundRL telemetry/i });
    await expect(telemetryHeading).toBeVisible();
  });

  test("should have dark theme styling", async ({ page }) => {
    await page.goto("/");

    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });

    expect(bgColor).toMatch(/(?:rgb\(2,\s*6,\s*23\)|oklch\(0\.1\d+\s+0\.0\d+\s+\d+(?:\.\d+)?\))/);
  });

  test("should not have reward editor section", async ({ page }) => {
    await page.goto("/");

    const rewardSection = page.getByText(/Reward function/i);
    await expect(rewardSection).toHaveCount(0);
  });

  test("should surface simulation controls", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.evaluate(() => {
      document.querySelector("#playground")?.scrollIntoView();
    });

    const controlsHeading = page.getByRole("heading", { name: /Simulation controls/i });
    await expect(controlsHeading).toBeVisible();

    const difficultyLabel = page.getByText(/Difficulty/i);
    await expect(difficultyLabel).toBeVisible();

    const renderToggle = page.getByRole("button", { name: /Render/i });
    await expect(renderToggle).toBeVisible();
  });
});
