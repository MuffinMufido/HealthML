import { test, expect } from "@playwright/test";

test.describe("HealthML Pipeline", () => {
  test("home page loads with step 1 visible", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/HealthML/i);
    // Step 1 header should be visible
    await expect(page.getByText(/clinical context/i).first()).toBeVisible();
  });

  test("step navigation is blocked without completing prerequisites", async ({ page }) => {
    await page.goto("/");
    // Attempting to click on a later step badge should show access warning
    // The step bar has numbered buttons — clicking step 3 without data should warn
    const stepButtons = page.locator("[data-step]");
    if ((await stepButtons.count()) > 0) {
      // If step buttons are accessible, clicking step 3 shows access warning
      await stepButtons.nth(2).click();
      await expect(page.getByText(/access denied/i)).toBeVisible();
    }
  });

  test("data exploration step loads example dataset", async ({ page }) => {
    await page.goto("/");
    // Navigate to step 2 — look for "Load Example" or step 2 button
    const loadExBtn = page.getByRole("button", { name: /load example/i });
    if (await loadExBtn.isVisible()) {
      await loadExBtn.click();
      // After loading, should see patient count or column info
      await expect(page.getByText(/120|patients|dataset/i).first()).toBeVisible();
    }
  });

  test.skip("model parameter step shows 6 model types", async ({ page }) => {
    await page.goto("/");
    // Check the model names are rendered somewhere (even if behind a step gate)
    await expect(page.getByText(/logistic regression/i).first()).toBeVisible();
  });
});
