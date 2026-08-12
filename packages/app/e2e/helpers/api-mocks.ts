import type { Page } from "@playwright/test";

export const MOCK_ALADHAN_RESPONSE = {
  code: 200,
  status: "OK",
  data: {
    timings: {
      Fajr: "05:15",
      Sunrise: "06:30",
      Dhuhr: "12:00",
      Asr: "15:30",
      Maghrib: "18:15",
      Isha: "19:30",
      Midnight: "00:00",
      Firstthird: "22:00",
      Lastthird: "02:00",
    },
    date: {
      readable: "01 Jan 2024",
      timestamp: "1704067200",
    },
    meta: {
      latitude: 21.3891,
      longitude: 39.8579,
      timezone: "Asia/Riyadh",
    },
  },
};

/**
 * Mock the Aladhan prayer times API.
 * Must be called before page.goto() to intercept the initial load.
 * URL pattern: https://api.aladhan.com/v1/timings/{date}?...
 */
export async function mockAladhanAPI(page: Page): Promise<void> {
  await page.route("**/api.aladhan.com/v1/timings/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_ALADHAN_RESPONSE),
    }),
  );
}

/**
 * Mock the Aladhan API to return a 500 error.
 * Call this after mockAladhanAPI to override for error-path tests.
 */
export async function mockAladhanAPIError(page: Page): Promise<void> {
  await page.route("**/api.aladhan.com/v1/timings/**", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ code: 500, status: "Internal Server Error" }),
    }),
  );
}
