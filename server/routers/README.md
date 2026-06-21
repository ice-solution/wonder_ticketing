# tRPC Routers（規劃）

實作順序建議 Phase 1 → 3。`question` 為獨立 router（已確認）。

| 檔案 | Namespace | Auth |
|------|-----------|------|
| `event.ts` | `trpc.event.*` | public / protected / admin |
| `ticketType.ts` | `trpc.ticketType.*` | protected |
| `order.ts` | `trpc.order.*` | public + protected；含 `walkInCheckout` |
| `ticket.ts` | `trpc.ticket.*` | public / protected |
| **`question.ts`** | **`trpc.question.*`** | protected |
| `referral.ts` | `trpc.referral.*` | protected |
| `donation.ts` | `trpc.donation.*` | public / protected |
| `discount.ts` | `trpc.discount.*` | public / protected |
| `waitlist.ts` | `trpc.waitlist.*` | public / protected |
| `seat.ts` | `trpc.seat.*` | proProcedure |
| `analytics.ts` | `trpc.analytics.*` | proProcedure |
| `crm.ts` | `trpc.crm.*` | proProcedure；per-event 標籤 |
| `subscription.ts` | `trpc.subscription.*` | protected |
| `team.ts` | `trpc.team.*` | protected；Calendar admins |
| `integration.ts` | `trpc.integration.*` | proProcedure；Phase 3 |

詳見 [docs/PRODUCT_DECISIONS.md](../docs/PRODUCT_DECISIONS.md)。
