# MySQL (Drizzle) → MongoDB (Mongoose) 遷移說明

原技術規格書（`wonder.pdf`）採用 **MySQL/TiDB + Drizzle ORM**。本專案改為 **MongoDB + Mongoose**，業務邏輯與 API 契約不變，僅持久層不同。

## 環境變數

| 原規格 | 本專案 |
|--------|--------|
| `DATABASE_URL` (MySQL) | `MONGODB_URI` |

範例：`mongodb://localhost:27017/wonder_ticketing`  
生產可用 MongoDB Atlas 或自建 Replica Set。

## 表 → 集合對照

| MySQL 表 | MongoDB 集合 | Model |
|----------|--------------|-------|
| users | users | User |
| subscriptions | subscriptions | Subscription |
| events | events | Event |
| ticket_types | ticket_types | TicketType |
| orders | orders | Order |
| order_items | order_items | OrderItem |
| tickets | tickets | Ticket |
| donations | donations | Donation |
| discount_codes | discount_codes | DiscountCode |
| waitlist_entries | waitlist_entries | WaitlistEntry |
| event_seats | event_seats | EventSeat |
| referral_codes | referral_codes | ReferralCode |
| referral_uses | referral_uses | ReferralUse |
| custom_questions | custom_questions | CustomQuestion |
| question_responses | question_responses | QuestionResponse |
| event_reminders | event_reminders | EventReminder |
| event_series | event_series | EventSeries |
| event_cohosts | event_cohosts | EventCohost |
| event_checkers | event_checkers | EventChecker |
| crm_tags | crm_tags | CrmTag |
| crm_attendee_tags | crm_attendee_tags | CrmAttendeeTag |
| organizer_team_members | organizer_team_members | OrganizerTeamMember |
| api_keys | api_keys | ApiKey |
| webhook_endpoints | webhook_endpoints | WebhookEndpoint |
| webhook_deliveries | webhook_deliveries | WebhookDelivery |

產品決策（members_only、walk-in、額度等）見 [PRODUCT_DECISIONS.md](./PRODUCT_DECISIONS.md)。

## 型別對照

| MySQL | MongoDB |
|-------|---------|
| `INT AUTO_INCREMENT` PK | `ObjectId` `_id` |
| `INT` FK | `ObjectId` + `ref` |
| `ENUM(...)` | `String` + `enum` in schema |
| `DECIMAL(10,2)` | `Number`（moneyField 四捨五入至分） |
| `JSON` | `Schema.Types.Mixed` 或子文件陣列 |
| `TIMESTAMP` | `Date` |

## 索引

原規格 Section 4.3 的 SQL 索引已改寫為 Mongoose `schema.index()`，例如：

- `events`: `createdBy`, `(status, eventDate)`, `slug`, `category`
- `orders`: `eventId`, `userId`, `status`, `orderNumber`（unique）
- `tickets`: `ticketCode`（unique）, `eventId`

## 交易與一致性

高風險流程（checkout、扣庫存、座位預留）應使用 **MongoDB 多文件交易**（Replica Set / Atlas）：

```typescript
const session = await mongoose.startSession();
session.startTransaction();
try {
  // Order.create, TicketType.update sold, EventSeat.update...
  await session.commitTransaction();
} catch (e) {
  await session.abortTransaction();
  throw e;
} finally {
  session.endSession();
}
```

## 目錄變更

| 原規格 | 本專案 |
|--------|--------|
| `drizzle/schema.ts` | `server/models/*.ts` |
| `drizzle/migrations/` | 無 SQL migration；schema 隨 deploy 由 Mongoose 建立 |
| `pnpm drizzle-kit generate` | 模型變更直接改 TypeScript + 手動資料遷移腳本 |

若需從既有 MySQL 匯入資料，請另寫一次性 ETL：讀取 MySQL 列 → 轉 `ObjectId` 對照表 → `insertMany`。

## 仍使用規格書的部份

- tRPC routers、Wonder Payment、OAuth、前端架構 — 待 Phase 1 實作時接上 `server/db.ts` 與 models
- `shared/features.ts` — 與規格 Section 8 一致
