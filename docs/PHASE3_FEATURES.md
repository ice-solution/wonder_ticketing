# Phase 3 功能說明（W9–12）

> 對應 `wonder.pdf` Section 14 第三階段。狀態：**已開工（MVP）**

## Phase 3 將包含什麼？

| 功能 | 說明 | 方案 | 狀態 |
|------|------|------|------|
| **Pro 訂閱計費** | Free / Pro 升級（HK$460/月）、取消訂閱 | 全用戶 | ✅ MVP（dev mock 付款） |
| **Email / WhatsApp 通知** | 購票確認、活動提醒；每週額度 Free 500 / Pro 5000 | 全用戶 | ✅ Email（AWS SES）/ WhatsApp（Meta Cloud） |
| **API Key** | REST API 查活動／訂單 | Pro | ✅ |
| **Webhook** | `order.paid` 等事件 POST 至主辦方 URL | Pro | ✅ |
| **AI 活動文案** | 一鍵生成中英活動描述 | Pro | ✅ MVP（模板；可接 OpenAI） |
| **嵌入式 Widget** | `/embed/:slug` 精簡購票頁，可 iframe 嵌入官網 | Pro | ✅ |
| **Meta Pixel / GA** | 活動頁追蹤埋點 | Pro | ✅ |
| **Google / Facebook 登入** | 社交帳號登入 | 全用戶 | ✅ |
| **WhatsApp Bot** | 查活動、購票引導 | Pro | ✅ Meta Cloud API |
| **活動後問卷 UI** | 付款成功頁提交問卷 | 全用戶 | ✅ |

---

## API 路徑（Phase 3 新增）

### tRPC

```
trpc.subscription.*   — 訂閱狀態、升級、取消
trpc.integration.*    — API Key、Webhook（Pro）
trpc.ai.*             — AI 文案（Pro）
trpc.notification.*   — 通知額度、排程提醒
```

### REST（API Key 認證）

```
GET  /api/v1/events
GET  /api/v1/events/:slug
GET  /api/v1/orders/:orderNumber
Authorization: Bearer wtk_live_...
```

### 公開

```
GET  /api/embed/:slug          — Widget 資料 JSON
GET  /api/auth/oauth/login       — OAuth 登入導向
GET  /api/whatsapp/webhook       — WhatsApp 驗證
POST /api/whatsapp/webhook       — WhatsApp 訊息（Meta Cloud API）
```

---

## Webhook 事件

- `order.paid` — 訂單付款成功（已於 `fulfillPaidOrder` 後觸發）
- `order.refunded` — 退款（預留）
- `ticket.checked_in` — 驗票入場（預留）
- `event.published` — 活動發布（預留）

簽名標頭：`X-Wonder-Signature`（HMAC-SHA256）

---

## 前端頁面

| 路徑 | 說明 |
|------|------|
| `/dashboard/subscription` | 訂閱管理、升級 Pro |
| `/dashboard/integrations` | API Key + Webhook |
| `/embed/:slug` | 嵌入式購票 Widget |
| 活動編輯頁 | AI 文案、Pixel/GA、Widget 開關 |
| 訂單確認頁 | 活動後問卷 |

---

## 本地測試

```bash
npm run dev

# 升級 Pro（mock）
# 1. POST /api/dev/login {"email":"pro@wonder.hk","plan":"pro"}
# 2. 或 /dashboard/subscription → 升級

# API Key
# /dashboard/integrations → 建立金鑰
curl -H "Authorization: Bearer wtk_live_..." http://localhost:3000/api/v1/events

# Widget
open http://localhost:5173/embed/wonder-demo-concert
```

---

## Phase 3 與 Phase 4 邊界

| Phase 3 深化（後續） | Phase 4 |
|---------------------|---------|
| 真實 SendGrid / WhatsApp API | SSO 企業登入 |
| Wonder Payment 訂閱扣款 | 白標品牌 |
| OpenAI 真實文案 | 上線 QA |
| Webhook 重試佇列 | Admin 後台 |
| Zapier 官方整合 | |

完整產品決策見 [PRODUCT_DECISIONS.md](./PRODUCT_DECISIONS.md)。
