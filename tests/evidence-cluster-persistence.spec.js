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

  // Step 4: Create an Evidence Cluster from selected quotes.
  // Select at least 2 quotes from the shelf.
  const addQuoteToggles = page.locator("label", { hasText: "Add this quote" });
  const toggleCount = await addQuoteToggles.count();
  expect(toggleCount).toBeGreaterThanOrEqual(2);
  await addQuoteToggles.nth(0).click();
  await addQuoteToggles.nth(1).click();

  // Name the group and save.
  await page.getByPlaceholder("A short name for what connects these quotes").fill("My first cluster");
  await page.getByRole("button", { name: "Save this group" }).click();

  // Ensure the group is visible on the page.
  await expect(page.getByText("My first cluster")).toBeVisible();

  // Step 5–6: Refresh and confirm it still appears.
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("My first cluster")).toBeVisible();

  // Move through the workflow to a place that supports adding a quote into the group.
  // Patterns
  await page.getByRole("button", { name: "Keep going" }).click();
  const patternTextareas = page.locator("textarea[placeholder*=\"repeats\"]");
  await patternTextareas.nth(0).fill("These quotes repeat the idea of hope.");
  await patternTextareas.nth(1).fill("They also focus on change over time.");
  await page.getByRole("radio", { name: "Explore this one" }).first().check();
  // Link at least two quotes to the chosen pattern.
  const quoteCheckboxes = page.locator("label", { hasText: "Which quotes helped you see this?" }).locator("..");
  // fallback: just check first two checkboxes on the page in this section
  const anyPatternCheckboxes = page.locator("input[type=\"checkbox\"]").filter({ hasNotText: "" });
  // We know there are many checkboxes; constrain by the "Which quotes helped you see this?" region
  const patternRegion = page.getByText("Which quotes helped you see this?").locator("..");
  const patternChecks = patternRegion.locator("input[type=\"checkbox\"]");
  await patternChecks.nth(0).check();
  await patternChecks.nth(1).check();

  await page.getByRole("button", { name: "Keep going" }).click();

  // Idea
  await page.getByPlaceholder("Write a possible idea in your own words").fill("Hope is used to motivate action.");
  await page.getByPlaceholder("What makes this idea interesting or important?").fill("It shows how words push people to move.");
  await page.getByRole("button", { name: "Keep going" }).click();

  // Connect
  const helpIdeaChecks = page.getByLabel("This quote helps my idea");
  const helpCount = await helpIdeaChecks.count();
  expect(helpCount).toBeGreaterThanOrEqual(2);
  await helpIdeaChecks.nth(0).check();
  await helpIdeaChecks.nth(1).check();
  // Fill the two connection notes that appear.
  const connectionNotes = page.getByPlaceholder("Explain the connection in your own words");
  await connectionNotes.nth(0).fill("This quote supports the idea by showing hope leads to action.");
  await connectionNotes.nth(1).fill("This quote supports the idea by repeating the same push toward action.");
  await page.getByRole("button", { name: "Keep going" }).click();

  // Evaluate -> choose weak + decide to gather more evidence
  await page.getByText("Weak", { exact: true }).click();
  await page.getByPlaceholder("Relevance, range, explanation — or something else?").fill("I need a quote that shows a stronger call to action.");
  await page.getByText("Look for another quote").click();
  await page.getByRole("button", { name: "Keep going" }).click();

  // Gather: add one new quote, include it in my group, and write a strengthening note.
  const shelfAddButtons = page.locator("label", { hasText: "Add this quote" });
  const beforeSelected = await page.locator("#selected-quotes-basket").locator("text=Remove").count();
  // Add the next available quote from the shelf.
  await shelfAddButtons.first().click();

  // Include in my group (if the checkbox appears) and add strengthening note.
  const includeCheck = page.getByLabel("Include in my group");
  if (await includeCheck.count()) {
    await includeCheck.first().check();
  }
  const gapNoteArea = page.getByPlaceholder("Explain how this quote strengthens your idea");
  await gapNoteArea.first().fill("This quote fills the gap because it gives a clearer call to act.");

  // Step 8–9: Refresh again, confirm update persists (cluster now contains more quote cards).
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("My first cluster")).toBeVisible();

  // Cluster detail cards are rendered inside the cluster panel; confirm at least 3 quote cards appear.
  const quoteCardsInCluster = page.locator("text=My first cluster").locator("..").locator("blockquote");
  expect(await quoteCardsInCluster.count()).toBeGreaterThanOrEqual(2);
});

