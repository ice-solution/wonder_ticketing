import { test, expect } from "@playwright/test";
import {
  ADMIN_EMAIL,
  ORGANIZER_EMAIL,
  V1_DEMO_SLUG,
  loginAdminPage,
  loginPageSession,
  loginViaApi,
} from "./helpers/auth.js";
import { trpcQuery } from "./helpers/trpc.js";

/**
 * Wonder Ticketing v1.0 — 全站功能 E2E
 * global-setup 會執行 npm run db:bootstrap（清空 MongoDB + v1 seed）
 */
test.describe.serial("v1.0 全站功能", () => {
  test("0. API health 回傳 version 1.0.0", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { version: string; ok: boolean };
    expect(body.version).toBe("1.0.0");
    expect(body.ok).toBe(true);
  });

  test.describe("公開頁面", () => {
    test("1. Landing 首頁", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByRole("main").getByRole("link", { name: "探索活動" })).toBeVisible();
    });

    test("2. 活動列表", async ({ page }) => {
      await page.goto("/events");
      await expect(page.getByRole("heading", { name: "發現精彩活動" })).toBeVisible();
      await expect(page.getByRole("link", { name: /Wonder Demo Concert/i })).toBeVisible();
    });

    test("3. 活動詳情", async ({ page }) => {
      await page.goto(`/event/${V1_DEMO_SLUG}`);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(/Wonder Demo Concert/i);
      await page.locator('input[inputmode="decimal"]').first().fill("1");
      await expect(page.getByRole("link", { name: /立即購票/ })).toBeVisible();
    });

    test("4. 嵌入式 Widget", async ({ page }) => {
      await page.goto(`/embed/${V1_DEMO_SLUG}`);
      await expect(page.getByRole("heading", { name: /Wonder Demo Concert/i })).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByText(/一般入場/)).toBeVisible();
    });

    test("5. 登入頁", async ({ page }) => {
      await page.goto("/login");
      await expect(page.getByRole("heading", { name: "登入" })).toBeVisible();
    });

    test("6. 完整購票 UI", async ({ page, request }) => {
      await page.context().clearCookies();
      const buyerEmail = `v1-buyer-${Date.now()}@test.local`;
      let orderNumber = "";

      await page.route("**/api/trpc/order.checkout*", async (route) => {
        const response = await route.fetch();
        const json = (await response.json()) as Array<{
          result?: { data?: { json?: { orderNumber?: string } } };
        }>;
        orderNumber = json[0]?.result?.data?.json?.orderNumber ?? "";
        await route.fulfill({ response, json });
      });

      await page.goto(`/event/${V1_DEMO_SLUG}`);
      await page.locator('input[inputmode="decimal"]').first().fill("1");
      await page.getByRole("link", { name: /立即購票/ }).click();
      await expect(page.getByRole("heading", { name: "結帳" })).toBeVisible();

      await page.getByLabel("姓名").fill("V1 Buyer");
      await page.getByLabel("Email").fill(buyerEmail);
      await page.getByLabel("電話").fill("91234567");
      await page.getByRole("button", { name: "前往付款" }).click();

      await page.waitForTimeout(500);
      expect(orderNumber).toMatch(/^WDR-/);

      await request.post("/api/dev/fulfill-order", { data: { orderNumber } });
      await page.goto(`/order/${orderNumber}`);
      await expect(page.getByText("付款成功")).toBeVisible({ timeout: 20_000 });
    });
  });

  test.describe("主辦後台 Pro", () => {
    test.beforeEach(async ({ page }) => {
      await loginPageSession(page);
    });

    test("7. 我的活動", async ({ page }) => {
      await expect(page.getByRole("heading", { name: "我的活動" })).toBeVisible();
      await expect(page.getByText("Wonder Demo Concert")).toBeVisible();
    });

    test("8. 建立活動表單", async ({ page }) => {
      await page.goto("/dashboard/events/new");
      await expect(page.getByRole("heading", { name: "建立活動" })).toBeVisible();
    });

    test("9. 活動編輯頁", async ({ page }) => {
      await page.goto("/dashboard");
      await page.getByRole("link", { name: "管理" }).first().click();
      await expect(page.getByRole("heading", { name: "編輯活動" })).toBeVisible();
      await expect(page.getByLabel(/標題|Title/i).first()).toHaveValue(/Wonder Demo/i);
    });

    test("10. 訂單列表", async ({ page }) => {
      await page.goto("/dashboard/orders");
      await expect(page.getByRole("heading", { name: "訂單" })).toBeVisible();
    });

    test("11. 驗票", async ({ page }) => {
      await page.goto("/dashboard/check-in");
      await expect(page.getByRole("heading", { name: "驗票" })).toBeVisible();
    });

    test("12. Analytics", async ({ page }) => {
      await page.goto("/dashboard/analytics");
      await expect(page.getByRole("heading", { name: "Analytics (Pro)" })).toBeVisible();
    });

    test("13. CRM", async ({ page }) => {
      await page.goto("/dashboard/crm");
      await expect(page.getByRole("heading", { name: "CRM Tags (Pro)" })).toBeVisible();
    });

    test("14. 推薦計劃", async ({ page }) => {
      await page.goto("/dashboard/referrals");
      await expect(page.getByRole("heading", { name: "推薦計劃" })).toBeVisible();
    });

    test("15. 座位編輯", async ({ page }) => {
      await page.goto("/dashboard/seats");
      await expect(page.getByRole("heading", { name: "座位圖編輯" })).toBeVisible();
    });

    test("16. 訂閱方案", async ({ page }) => {
      await page.goto("/dashboard/subscription");
      await expect(page.getByRole("heading", { name: "訂閱方案" })).toBeVisible();
    });

    test("17. 進階整合", async ({ page }) => {
      await page.goto("/dashboard/integrations");
      await expect(page.getByRole("heading", { name: "進階整合" })).toBeVisible();
    });

    test("18. 我的票券", async ({ page }) => {
      await page.goto("/my-tickets");
      await expect(page.getByText(/我的票券|目前沒有票券/).first()).toBeVisible();
    });
  });

  test.describe("平台 Admin", () => {
    test.beforeEach(async ({ page }) => {
      await page.context().clearCookies();
      await loginAdminPage(page);
    });

    test("19. 精選活動分頁", async ({ page }) => {
      await page.goto("/dashboard/admin/events");
      await expect(page.getByRole("heading", { name: "平台管理" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "活動精選" })).toBeVisible();
      await expect(page.getByText("Wonder Demo Concert")).toBeVisible();
    });

    test("20. 用戶管理分頁", async ({ page }) => {
      await page.goto("/dashboard/admin/users");
      await expect(page.getByRole("heading", { name: "用戶管理" })).toBeVisible();
      await expect(page.getByText(ORGANIZER_EMAIL)).toBeVisible();
      await expect(page.getByText(ADMIN_EMAIL)).toBeVisible();
    });

    test("21. 設為精選後公開列表顯示", async ({ page }) => {
      await page.goto("/dashboard/admin/events");
      const row = page.locator("tr").filter({ hasText: "Wonder Demo Concert" });
      const btn = row.getByRole("button", { name: /設為精選|取消精選/ });
      if ((await btn.textContent())?.includes("設為精選")) {
        await btn.click();
        await expect(row.getByRole("button", { name: "取消精選" })).toBeVisible();
      }
      await page.goto("/events");
      await expect(page.getByText("精選")).toBeVisible();
    });
  });

  test("22. Dev 登入 API", async ({ request }) => {
    await loginViaApi(request, ORGANIZER_EMAIL, { plan: "pro" });
    const me = await trpcQuery<{ email: string; plan: string } | null>(request, "auth.me", null);
    expect(me?.email).toBe(ORGANIZER_EMAIL);
  });
});
