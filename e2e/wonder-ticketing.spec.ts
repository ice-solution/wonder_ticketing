import { test, expect } from "@playwright/test";
import { loginViaApi, loginPageSession, ORGANIZER_EMAIL } from "./helpers/auth.js";
import {
  createE2EFixture,
  createPaidOrder,
  ensureProOrganizer,
  registerWebhook,
  waitForTickets,
  type E2EFixture,
} from "./helpers/fixtures.js";
import { trpcMutate, trpcQuery } from "./helpers/trpc.js";
import { startWebhookCaptureServer, type WebhookCaptureServer } from "./helpers/webhook-server.js";

/**
 * Wonder Ticketing 完整 E2E（單一 spec、serial 執行）
 * 涵蓋：公開購票、後台訂單/回覆/CSV、驗票、退款、Webhook、訂閱降級
 */
test.describe.serial("Wonder Ticketing 完整 E2E", () => {
  let fixture: E2EFixture;
  let webhook: WebhookCaptureServer;
  let refundOrderNumber: string;

  test.beforeAll(async ({ request }) => {
    webhook = await startWebhookCaptureServer();
    await ensureProOrganizer(request);
    await registerWebhook(request, webhook.url, [
      "order.paid",
      "order.refunded",
      "ticket.checked_in",
      "event.published",
    ]);
    fixture = await createE2EFixture(request);
  });

  test.afterAll(async () => {
    await webhook.stop();
  });

  test.beforeEach(async ({ page }, testInfo) => {
    if (testInfo.title.startsWith("1.")) return;
    await loginPageSession(page);
  });

  // ── 1. 公開購票 UI 流程 ──────────────────────────────────────
  test("1. 活動頁 → 結帳頁 → 訂單確認", async ({ page }) => {
    await page.context().clearCookies();

    await page.goto(`/order/${fixture.orderNumber}`);
    await expect(page.getByText("付款成功")).toBeVisible();

    await page.goto(`/event/${fixture.eventSlug}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.locator('input[inputmode="decimal"]').first().fill("1");
    await page.getByRole("link", { name: /立即購票/ }).click();
    await expect(page.getByRole("heading", { name: "結帳" })).toBeVisible();
    await expect(page.getByLabel("姓名")).toBeVisible();
    await expect(page.locator("fieldset").filter({ hasText: "報名資料" })).toBeVisible();
  });

  // ── 2. 後台訂單詳情 ──────────────────────────────────────────
  test("2. 後台訂單詳情顯示報名資料", async ({ page }) => {
    await page.goto(`/dashboard/orders/${fixture.orderNumber}`);
    await expect(page.getByRole("heading", { name: "訂單詳情" })).toBeVisible();
    await expect(page.getByText(fixture.regAnswer)).toBeVisible();
    await expect(page.getByRole("heading", { name: "報名資料" })).toBeVisible();
  });

  // ── 3. 活動編輯：報名與問卷回覆 ──────────────────────────────
  test("3. 活動編輯頁顯示報名與問卷回覆", async ({ page }) => {
    await page.goto(`/dashboard/events/${fixture.eventId}/edit`);
    await expect(page.getByRole("heading", { name: "報名與問卷回覆" })).toBeVisible();
    await expect(page.getByText(fixture.regAnswer)).toBeVisible();
    await expect(page.getByText(fixture.surveyAnswer)).toBeVisible();
  });

  // ── 4. 訂單列表 → 詳情連結 ───────────────────────────────────
  test("4. 後台訂單列表連結至詳情頁", async ({ page }) => {
    await page.goto("/dashboard/orders");
    await page.getByLabel("依活動篩選").selectOption(fixture.eventId);
    const row = page.locator("li").filter({ hasText: fixture.orderNumber });
    await row.getByRole("link", { name: "查看訂單" }).click();
    await expect(page).toHaveURL(new RegExp(`/dashboard/orders/${fixture.orderNumber}`));
  });

  // ── 5. CSV 匯出（API + UI） ──────────────────────────────────
  test("5. 訂單 CSV 與問卷 CSV 含自訂欄位", async ({ page, request }) => {
    await loginViaApi(request);
    const ordersCsv = await trpcQuery<{ csv: string }>(request, "order.exportCSV", {
      eventId: fixture.eventId,
    });
    expect(ordersCsv.csv).toContain(fixture.regQuestion);
    expect(ordersCsv.csv).toContain(fixture.regAnswer);

    const surveyCsv = await trpcQuery<{ csv: string }>(request, "survey.exportCSV", {
      eventId: fixture.eventId,
    });
    expect(surveyCsv.csv).toContain(fixture.surveyQuestion);
    expect(surveyCsv.csv).toContain(fixture.surveyAnswer);

    await page.goto("/dashboard/orders");
    await page.getByLabel("依活動篩選").selectOption(fixture.eventId);
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "匯出 CSV" }).click();
    const download = await downloadPromise;
    const fs = await import("node:fs/promises");
    const content = await fs.readFile((await download.path())!, "utf8");
    expect(content).toContain(fixture.regAnswer);
  });

  // ── 6. 驗票 + ticket.checked_in Webhook ───────────────────────
  test("6. 驗票成功並觸發 ticket.checked_in Webhook", async ({ page, request }) => {
    await loginViaApi(request);
    const paid = await createPaidOrder(request, { eventId: fixture.eventId });
    const detail = await waitForTickets(request, paid.orderNumber);
    const ticketCode = detail.tickets[0].ticketCode;

    const ticket = await trpcQuery<{ ticket: { ticketCode: string } } | null>(
      request,
      "ticket.getByCode",
      { ticketCode }
    );
    expect(ticket?.ticket?.ticketCode).toBe(ticketCode);

    webhook.reset();
    await trpcMutate(request, "ticket.checkIn", { ticketCode, eventId: fixture.eventId });

    const payload = await webhook.waitFor("ticket.checked_in");
    expect(payload.data.ticketCode).toBe(ticketCode);

    await page.goto("/dashboard/check-in");
    await expect(page.getByRole("heading", { name: "驗票" })).toBeVisible();
    await page.locator("select").first().selectOption({ value: fixture.eventId });
    await expect(page.locator("select").first()).toHaveValue(fixture.eventId);
  });

  // ── 7. 退款 + order.refunded Webhook ──────────────────────────
  test("7. 後台退款並觸發 order.refunded Webhook", async ({ page, request }) => {
    await loginViaApi(request);
    const paid = await createPaidOrder(request, { eventId: fixture.eventId });
    refundOrderNumber = paid.orderNumber;

    webhook.reset();
    page.on("dialog", (d) => d.accept());

    await page.goto(`/dashboard/orders/${refundOrderNumber}`);
    await page.getByRole("button", { name: "退款" }).click();
    await expect(page.locator("span.bg-red-100")).toHaveText("已退款");

    const payload = await webhook.waitFor("order.refunded");
    expect(payload.data.orderNumber).toBe(refundOrderNumber);
  });

  // ── 8. 訂閱到期自動降級 ──────────────────────────────────────
  test("8. 訂閱到期後自動降級為 Free", async ({ request }) => {
    const subEmail = `e2e-sub-${Date.now()}@test.local`;
    await loginViaApi(request, subEmail, {
      plan: "pro",
      planExpiresAt: "2020-01-01T00:00:00.000Z",
    });

    let status = await trpcQuery<{ isPro: boolean; plan: string }>(
      request,
      "subscription.status",
      null
    );
    expect(status.isPro).toBe(false);
    expect(status.plan).toBe("pro");

    await request.post("/api/dev/process-subscriptions");
    status = await trpcQuery(request, "subscription.status", null);
    expect(status.plan).toBe("free");

    await loginViaApi(request, ORGANIZER_EMAIL, { plan: "pro" });
  });
});
