# 產品／技術決策紀錄（已確認）

> 對應先前規格缺口清單的 8 項決策。實作以本文件為準；`wonder.pdf` 若衝突，以本文件覆蓋。

## 1. 自訂報名問題 API — 獨立 Router

- **決策**：`server/routers/question.ts`（tRPC `trpc.question.*`）
- **職責**：`custom_questions` CRUD、`question_responses` 查詢（結帳寫入仍由 `order.checkout` 一併處理或呼叫共用 service）

## 2. CRM 標籤 — Per Event

- **決策**：標籤定義與貼標皆綁定 `eventId`
- **集合**：`crm_tags`、`crm_attendee_tags`（見 `server/models/CrmTag.ts`）

## 3. `members_only` 活動可見／購票資格

- **決策**：不要求獨立「活動會員名單」表
- **規則**：已登入且為 **有效 Pro 訂閱** 的用戶，即可瀏覽／購買 `visibility: members_only` 的活動
- **實作**：`shared/access.ts` → `canAccessMembersOnlyEvent(user)`
- **注意**：此處 Pro 指 **平台訂閱方案**（`users.plan` + `planExpiresAt`），不是單一活動的付費會員

## 4. 每週 Email／WhatsApp 發送額度 — 計在 Organizer

- **決策**：額度掛在 **主辦方帳戶**（`users` 上 `organizerNotificationQuota`）
- **上限**：Free 500／週、Pro 5000／週（見 `shared/features.ts` + `shared/const.ts`）
- **重置**：以週一 00:00 HKT（或 UTC 週起算，實作時固定一種）滾動重置 `weekStart` + `sentCount`

## 5. Cohost 可登入人數上限（已確認）

- 主辦方（含外部公司助理）**自己建立活動**並管理。
- 可邀請 **cohost** 登入協助；人數上限依主辦方方案：
  - **Free：3 人**（可登入的 distinct cohost）
  - **Pro：5 人**
  - 需更多：由主辦方向 Wonder 申請，後台設定 `users.cohostLimitOverride`
- 實作：`event_cohosts`（每活動邀請，但名額在 **organizer 帳戶** 層級以 distinct `userId` 計數）
- API：`event.addCohost`、`event.listCohosts`；超限回傳 FORBIDDEN 並提示聯絡 Wonder

## 6. Pro Webhooks / API Key — 說明與建議

### 這是什麼？

| 功能 | 用途 | 誰用 |
|------|------|------|
| **API Key** | 用程式呼叫 Wonder Ticketing（查訂單、建活動等） | Pro 主辦方／整合商 |
| **Webhook** | 平台主動 POST 到你的 URL（例如 `order.paid`） | Pro 主辦方接 Zapier、自建 ERP |

### 建議決策（Phase 3，schema 先預留）

- **`api_keys`**：雜湊後儲存 key、`organizerId`、scopes、過期時間
- **`webhook_endpoints`**：`organizerId`、URL、訂閱事件列表、secret
- **`webhook_deliveries`**（可選）：投遞紀錄、重試

僅 **Pro** 可建立；透過 `proProcedure` + `requireFeature('API_ACCESS')` / `WEBHOOKS`。

## 7. 現場 Walk-in 售票

- **決策**：**不走 Wonder Payment**
- **流程**：主辦方在後台／驗票頁呼叫 `order.walkInCheckout`，系統 **只記錄名額與出票**；款項由主辦方現場自行收取
- **訂單**：`paymentMethod: 'walk_in'`、`status: 'paid'`（或 `recorded`）、無 `wonderPaymentId`
- **平台費**：walk-in 是否計費需產品另定（預設 `platformFee: 0`，實作時可調）

## 8. 資料庫 — MongoDB 為正式方案

- **決策**：生產與開發均以 **MongoDB + Mongoose** 為準
- `wonder.pdf` 內 MySQL/TiDB/Drizzle 僅作歷史參考

---

## Router 清單（更新後）

| Router | 說明 |
|--------|------|
| `event` | 活動 CRUD |
| `ticketType` | 票種 |
| `order` | 結帳、退款、**walkInCheckout** |
| `ticket` | 票券、驗票、轉讓 |
| **`question`** | 自訂問題 CRUD |
| `referral` | 推薦碼 |
| `donation` | 捐款 |
| `discount` | 折扣碼 |
| `waitlist` | 候補 |
| `seat` | 座位（Pro） |
| `analytics` | 報表（Pro） |
| `crm` | 標籤／參加者（Pro，per-event） |
| `subscription` | Free/Pro 訂閱 |
| `event.addCohost` | Cohost 邀請（見 §5，在 event router） |
| `integration` | API Key + Webhook（Phase 3，Pro） |
