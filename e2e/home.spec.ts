import { expect, test } from "@playwright/test";

test("the home page explains the three steps @smoke", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "LinkedIn Agent Hub" })).toBeVisible();
  for (const step of ["Connect LinkedIn", "Add your agents", "Approve what goes live"]) {
    await expect(page.getByRole("heading", { level: 2, name: step })).toBeVisible();
  }
});

test("the health check reports the database @smoke", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ ok: true, database: "up" });
});
