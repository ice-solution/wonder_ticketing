import type { APIRequestContext, Page } from "@playwright/test";

export const ORGANIZER_EMAIL = "organizer@wonder.hk";
export const ADMIN_EMAIL = "admin@wonder.hk";
export const V1_DEMO_SLUG = "wonder-demo-concert";

export async function loginViaApi(
  request: APIRequestContext,
  email = ORGANIZER_EMAIL,
  opts?: { plan?: "free" | "pro"; planExpiresAt?: string | null; role?: "user" | "admin" }
) {
  const res = await request.post("/api/dev/login", {
    data: { email, name: "E2E User", ...opts },
  });
  if (!res.ok()) {
    throw new Error(`dev login failed: ${res.status()} ${await res.text()}`);
  }
}

export async function loginOrganizerPro(request: APIRequestContext) {
  await loginViaApi(request, ORGANIZER_EMAIL, { plan: "pro" });
}

export async function loginAdmin(request: APIRequestContext) {
  await loginViaApi(request, ADMIN_EMAIL, { plan: "pro", role: "admin" });
}

/** 與 page 共用 cookie jar，供 UI 測試使用 */
export async function loginPageSession(page: Page, email = ORGANIZER_EMAIL) {
  await loginViaApi(page.request, email, email === ADMIN_EMAIL ? { plan: "pro", role: "admin" } : { plan: "pro" });
  await page.goto("/dashboard");
  await page.getByRole("heading", { name: "我的活動" }).waitFor({ timeout: 15_000 });
}

export async function loginAdminPage(page: Page) {
  await loginPageSession(page, ADMIN_EMAIL);
}
