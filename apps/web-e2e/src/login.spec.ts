import { test, expect, Page } from '@playwright/test';

/**
 * Full-stack login E2E tests.
 *
 * Prerequisites:
 *   docker compose up       — nginx, all 5 NestJS services, Postgres, Kafka
 *   npx nx serve web        — Vite dev server on localhost:3001
 *
 * Credentials are loaded from apps/web-e2e/.env via playwright.config.ts.
 */

const EMAIL    = process.env.E2E_ADMIN_EMAIL    ?? '';
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? '';
const ORG      = process.env.E2E_ADMIN_ORG      ?? '';
const UNKNOWN_EMAIL  = process.env.E2E_UNKNOWN_EMAIL  ?? '';
const WRONG_PASSWORD = process.env.E2E_WRONG_PASSWORD ?? '';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function goToLogin(page: Page) {
  await page.goto('/auth/login');
  await expect(page.getByText('Welcome back !')).toBeVisible();
}

/** Step 0 → Step 1: enter email and wait for org list to load from the API. */
async function submitEmail(page: Page, email: string) {
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Login' }).click();
}

/** Step 1: fill password + select org + submit. */
async function submitCredentials(page: Page, password: string, org: string) {
  await expect(page.getByLabel('Password')).toBeVisible({ timeout: 15_000 });
  await page.getByLabel('Password').fill(password);
  await page.getByPlaceholder('Select your organization').click();
  await page.getByRole('option', { name: org }).first().click();
  await page.getByRole('button', { name: 'Login' }).click();
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

test.describe('Login flow — full stack', () => {
  test.beforeEach(async ({ page }) => {
    await goToLogin(page);
  });

  // ── Happy path ────────────────────────────────────────────────────────────

  test('admin logs in successfully and is redirected to the dashboard', async ({ page }) => {
    await submitEmail(page, EMAIL);

    // The org dropdown is populated from the real DB — Synlian must appear
    await expect(page.getByLabel('Password')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByPlaceholder('Select your organization')).toBeVisible();

    await submitCredentials(page, PASSWORD, ORG);

    // App navigates to /client/* after a successful login
    await expect(page).toHaveURL(/\/client\//, { timeout: 20_000 });

    // Sidebar nav is visible — confirms the authenticated layout loaded
    await expect(page.getByText('Logout')).toBeVisible({ timeout: 10_000 });
  });

  // ── Step 0 validation ─────────────────────────────────────────────────────

  test('shows validation error when email is empty', async ({ page }) => {
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByText('Invalid email')).toBeVisible();
    // Must remain on step 0 — no password field yet
    await expect(page.getByLabel('Password')).not.toBeVisible();
  });

  test('shows error notification for an email not in the system', async ({ page }) => {
    await submitEmail(page, UNKNOWN_EMAIL);

    // Mantine notification appears at top-center
    await expect(page.getByText('Error').first()).toBeVisible({ timeout: 15_000 });

    // Stepper stays on step 0
    await expect(page.getByLabel('Password')).not.toBeVisible();
  });

  // ── Step 1 validation ─────────────────────────────────────────────────────

  test('shows validation errors when step 1 submitted with empty password and no org', async ({ page }) => {
    await submitEmail(page, EMAIL);
    await expect(page.getByLabel('Password')).toBeVisible({ timeout: 15_000 });

    // Submit without filling anything
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByText('Invalid password')).toBeVisible();
    await expect(page.getByText('Please select an organization')).toBeVisible();
  });

  test('shows error notification for a wrong password', async ({ page }) => {
    await submitEmail(page, EMAIL);
    await expect(page.getByLabel('Password')).toBeVisible({ timeout: 15_000 });

    await page.getByLabel('Password').fill(WRONG_PASSWORD);
    await page.getByPlaceholder('Select your organization').click();
    await page.getByRole('option', { name: ORG }).first().click();
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByText('Error').first()).toBeVisible({ timeout: 15_000 });

    // Must stay on login page
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  // ── Remember me ───────────────────────────────────────────────────────────

  test('remember me checkbox pre-fills email on next visit', async ({ page }) => {
    // Check "Remember me" before submitting email
    await page.getByLabel('Remember me').check();
    await submitEmail(page, EMAIL);
    await expect(page.getByLabel('Password')).toBeVisible({ timeout: 15_000 });

    // Navigate away then back
    await page.goto('/auth/login');
    await expect(page.getByLabel('Email')).toHaveValue(EMAIL);
    await expect(page.getByLabel('Remember me')).toBeChecked();
  });

  // ── Back button ───────────────────────────────────────────────────────────

  test('back button on step 1 returns to step 0 and clears password', async ({ page }) => {
    await submitEmail(page, EMAIL);
    await expect(page.getByLabel('Password')).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'Back' }).click();

    // Password field gone, email field editable again
    await expect(page.getByLabel('Password')).not.toBeVisible();
    await expect(page.getByLabel('Email')).not.toBeDisabled();
  });
});
