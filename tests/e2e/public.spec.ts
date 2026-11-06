import { expect, test } from "@playwright/test";

test("homepage explains the purchase path", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Buy crypto simply and securely" })).toBeVisible();
  await expect(page.getByLabel("External wallet address")).toBeVisible();
  await page.locator("a:visible", { hasText: "Buy Crypto" }).first().click();
  await expect(page).toHaveURL(/\/buy-crypto/);
});

test("markets page shows a timestamped table", async ({ page }) => {
  await page.goto("/markets");
  await expect(page.getByRole("heading", { name: "Markets" })).toBeVisible();
  await expect(page.getByText(/CoinGecko|temporarily unavailable/)).toBeVisible();
});

test("protected dashboard redirects anonymous visitors", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("registration form validates an empty submit", async ({ page }) => {
  await page.goto("/register");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
});

test("mobile navigation can be opened", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile" })).toBeVisible();
});

test("theme toggle switches light and dark", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: /Switch to (dark|light) mode/ }).first();
  await expect(toggle).toBeVisible();
  const before = await page.locator("html").getAttribute("class");
  await toggle.click();
  const after = await page.locator("html").getAttribute("class");
  expect(Boolean(before?.includes("dark"))).not.toBe(Boolean(after?.includes("dark")));
});
