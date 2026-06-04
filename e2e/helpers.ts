import type { Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const STATE_FILE = path.join(process.cwd(), ".smoke-state.json");

export type SmokeState = {
  SMOKE_EMAIL: string;
  SMOKE_PASSWORD: string;
  SMOKE_UID: string;
  SMOKE_AGENCY_SLUG: string;
  SMOKE_EN_PKG_ID: string;
  SMOKE_AR_PKG_ID: string;
  SMOKE_SECTIONS_PKG_EN: string;
  SMOKE_SECTIONS_PKG_AR: string;
  SMOKE_TEMPLATE_PKGS_EN: Record<string, string>;
  SMOKE_TEMPLATE_PKGS_AR: Record<string, string>;
};

/**
 * Returns the test credentials written by globalSetup.
 * Reads from .smoke-state.json so it works in worker processes.
 */
export function smokeState(): SmokeState {
  if (!fs.existsSync(STATE_FILE)) {
    throw new Error(
      "[smoke] .smoke-state.json not found — did globalSetup run?\n" +
      "Run: npm run smoke"
    );
  }
  return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) as SmokeState;
}

/**
 * Logs in via the login page UI and waits for the builder to load.
 * Uses the pre-verified test account created in globalSetup.
 */
export async function loginAs(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto("/login");
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
  await page.waitForURL("**/builder**", { timeout: 20_000 });
}
