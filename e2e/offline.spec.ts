import { test, expect, type Page } from "@playwright/test";

// The app shell has to survive a reload with no network: local decks live in
// IndexedDB, so an instructor who opens Presio on a room's dead wifi should
// still get a working, styled page rather than the browser's offline error.

async function waitForServiceWorkerControl(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller) return;
    await new Promise<void>((resolve) => {
      navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true });
    });
  });
}

test("the home page still loads and keeps its styles after an offline reload", async ({ page, context }) => {
  await page.goto("/");
  await waitForServiceWorkerControl(page);

  await context.setOffline(true);
  await page.reload();

  // React mounted: the static crawler fallback is a bare <main>, so the real
  // home heading only exists once the bundle has run.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // The stylesheet actually applied. Tailwind's preflight zeroes the body
  // margin, which the browser default (8px) never does.
  const bodyMargin = await page.evaluate(() => getComputedStyle(document.body).marginTop);
  expect(bodyMargin).toBe("0px");
});

test("an offline deep link falls back to the cached shell", async ({ page, context }) => {
  await page.goto("/");
  await waitForServiceWorkerControl(page);

  // /about was never visited, so only the shell fallback can serve it.
  await context.setOffline(true);
  await page.goto("/about");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
