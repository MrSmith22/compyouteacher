const { test, expect } = require("playwright/test");

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const DEV_EMAIL = process.env.DEV_STUDENT_EMAIL || "dev-student@localhost";
const DEV_SECRET = process.env.DEV_AUTH_SECRET || "";

async function devSignIn(page) {
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await expect(page.getByText("Development only")).toBeVisible();
  await page.getByLabel("Email").fill(DEV_EMAIL);
  await page.getByLabel("Dev secret").fill(DEV_SECRET);
  await page.getByRole("button", { name: "Dev sign in" }).click();
  await page.waitForURL("**/modules/3", { timeout: 30000 });
}

test("Evidence clusters persist across refresh", async ({ page }) => {
  test.skip(!DEV_SECRET, "DEV_AUTH_SECRET missing in env");

  await devSignIn(page);

  await expect(
    page.getByRole("heading", { name: "Put related quotations into groups." })
  ).toBeVisible();
  await expect(page.getByText("Short model")).toBeVisible();

  // Naming should not be primary before enough quotations are selected.
  await expect(page.getByRole("heading", { name: "Name this group." })).toHaveCount(
    0
  );

  const addQuoteToggles = page.locator("label", { hasText: "Add to group" });
  const toggleCount = await addQuoteToggles.count();
  expect(toggleCount).toBeGreaterThanOrEqual(2);
  await addQuoteToggles.nth(0).click();
  await addQuoteToggles.nth(1).click();

  await expect(
    page.getByRole("heading", { name: "Name this group." })
  ).toBeVisible();

  await page
    .getByPlaceholder("A short name for the shared idea")
    .fill("My first cluster");
  await page.getByRole("button", { name: "Save this group" }).click();

  await expect(page.getByText("My first cluster")).toBeVisible();
  // Selection clears after save.
  await expect(page.getByText("Selected: 0 of 2 needed")).toBeVisible();

  // Duplicate identical set is blocked with visible feedback near Save.
  await addQuoteToggles.nth(0).click();
  await addQuoteToggles.nth(1).click();
  await page
    .getByPlaceholder("A short name for the shared idea")
    .fill("Duplicate attempt");
  await page.getByRole("button", { name: "Save this group" }).click();
  await expect(page.getByText("This group was not saved.")).toBeVisible();
  await expect(
    page.getByText("You already saved a group with these quotations")
  ).toBeVisible();

  // Changing selection clears the duplicate warning.
  await addQuoteToggles.nth(0).click();
  await expect(page.getByText("This group was not saved.")).toHaveCount(0);

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("My first cluster")).toBeVisible();
  await expect(page.getByText("Group 1")).toBeVisible();

  await page.getByRole("button", { name: "Choose this group" }).first().click();
  await page.getByRole("button", { name: "Keep going" }).click();

  await expect(
    page.getByRole("heading", {
      name: "What do these quotations seem to have in common?",
    })
  ).toBeVisible();
  await expect(page.getByText("Selected quotations")).toBeVisible();
  await expect(
    page.getByText("Look closely at the quotations you placed in this group.")
  ).toBeVisible();
});
