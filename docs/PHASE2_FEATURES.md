# Phase 2 可用功能說明

> 版本：2026-06-01  
> 對應規格：`wonder.pdf` Phase 2（W5–W8）  
> 狀態：**已開工** — 後端 API + 主辦後台基礎頁面；部分 UI 為 MVP，Phase 3 再深化。

---

## 誰可以用？

| 功能類別 | Free 主辦方 | Pro 主辦方 | 買家／公眾 |
|----------|-------------|------------|------------|
| 推薦碼（主辦方） | ✅ | ✅ | — |
| 活動聊天 | ✅ | ✅ | ✅（已登入） |
| 活動後問卷 | ✅ | ✅ | ✅ 提交 |
| 座位圖（瀏覽／選座） | ✅ 買家可選* | ✅ | ✅ |
| 座位圖編輯／產生格仔 | ❌ | ✅ | — |
| CRM 標籤 | ❌ | ✅ | — |
| 銷售分析報表 | ❌ | ✅ | — |
| Peer Referral（買家推薦買家） | ❌ | ✅ | — |

\* 若活動 `enableSeating: true` 且已建立座位資料。

---

## W5 — 座位圖系統（`trpc.seat.*`）

### 你可以做什麼

| API | 說明 | 權限 |
|-----|------|------|
| `seat.getMap` | 取得活動全部座位與可用數量 | 公開 |
| `seat.getAvailable` | 依區域篩選可選座位 | 公開 |
| `seat.reserve` | 預留座位 5 分鐘（結帳前） | 公開 |
| `seat.release` | 釋放預留 | 公開 |
| `seat.seedRows` | 快速產生示範座位格（列×欄） | **Pro** |
| `seat.updateMap` | 儲存自訂座位圖 JSON 至活動 | **Pro** |

### 後台頁面

- `/dashboard/seats` — 選擇活動、一鍵產生 5×8 示範格、檢視座位狀態

### 座位狀態

`available` → `reserved`（5 分鐘）→ `sold` / `blocked`

### 結帳選座（✅ 已整合）

1. 活動 `enableSeating: true` 時，結帳頁顯示座位圖
2. 選足與票數相同座位 →「確認預留」→ 5 分鐘內完成付款
3. 付款成功後座位標記為 `sold`，票券帶 `seatNumber`

### 尚未包含（後續迭代）

- 可視化拖拉編輯器（SeatMapEditor 完整 UI）

---

## W6 — 推薦碼系統（`trpc.referral.*`）

### 你可以做什麼

| API | 說明 | 權限 |
|-----|------|------|
| `referral.getMyCode` | 取得／自動建立主辦方推薦碼 | 已登入 |
| `referral.getStats` | 推薦人數、已獲免費 Pro 月數 | 已登入 |
| `referral.applyCode` | 輸入推薦碼 → 被推薦人獲 **1 個月 Pro** | 已登入 |
| `referral.createPeerReferral` | 為單一活動建立買家推薦碼 | **Pro** |

### 後台頁面

- `/dashboard/referrals` — 顯示自己的推薦碼與統計

### 規則摘要

- 主辦方推薦碼預設最多使用 **12 次**（可於資料庫調整）
- 每位用戶僅能 **套用一次** 他人推薦碼

---

## W7 — CRM、問卷、聊天室

### CRM（`trpc.crm.*`）— **Pro only**

| API | 說明 |
|-----|------|
| `crm.listTags` | 列出活動標籤（per-event） |
| `crm.createTag` | 新增標籤 |
| `crm.deleteTag` | 刪除標籤 |
| `crm.assignTag` | 依買家 email 貼標 |
| `crm.listAttendees` | 已付款訂單買家 + 標籤 |

後台：`/dashboard/crm`

### 活動後問卷（`trpc.survey.*`）

| API | 說明 |
|-----|------|
| `survey.listQuestions` | 公開讀取問題 |
| `survey.createQuestion` | 主辦方建立問題 |
| `survey.submit` | 買家／參加者提交答案 |
| `survey.listResponses` | 主辦方查看回覆 |

資料表：`survey_questions`、`survey_responses`

### 活動聊天室（`trpc.chat.*`）

| API | 說明 |
|-----|------|
| `chat.list` | 讀取訊息（最新 50 則） |
| `chat.send` | 發送訊息（需登入，Free/Pro 皆可） |

資料表：`event_messages`  
註：目前為 **輪詢式** API，尚未接 WebSocket。

---

## W8 — 銷售報表（`trpc.analytics.*`）— **Pro only**

| API | 說明 |
|-----|------|
| `analytics.summary` | 訂單數、總收入、售出票數 |
| `analytics.salesTrend` | 按日銷售趨勢（7d / 30d） |
| `analytics.revenueByTicketType` | 各票種收入 breakdown |

後台：`/dashboard/analytics`

### 圖表 Dashboard（✅ 已整合）

- `/dashboard/analytics` — Recharts 銷售趨勢折線圖、票種收入長條圖

### 尚未包含

- Meta Pixel / Google Analytics 埋點（Phase 3）

---

## Phase 1 收尾（本次一併交付）

| 項目 | 說明 |
|------|------|
| React 前端 | Vite + React 19 + wouter + tRPC + Tailwind |
| 雙語 | `zh-TW` / `en`（react-i18next） |
| 公開頁 | 首頁、活動詳情、結帳、訂單確認 |
| 買家 | `/my-tickets` 票夾 |
| 主辦後台 | 活動列表、建立活動、訂單、驗票（選活動）、CSV 匯出 |
| 開發指令 | 根目錄 `npm run dev` 同時啟動 API `:3000` + Web `:5173` |

---

## 本地測試 Phase 2 Pro 功能

```bash
npm run seed
npm run dev
```

1. 登入並升 Pro：`POST /api/dev/login`  
   `{"email":"pro@wonder.hk","plan":"pro"}`
2. 開啟 http://localhost:5173/dashboard/analytics
3. 座位：http://localhost:5173/dashboard/seats → Generate grid

---

## Phase 2 與 Phase 3 邊界

| 留在 Phase 2 深化 | 留待 Phase 3 |
|-------------------|--------------|
| 座位圖視覺編輯器、結帳選座 | AI 活動文案 |
| 圖表 Dashboard | 嵌入式購票 Widget |
| WebSocket 聊天 | WhatsApp Bot |
| Pixel / GA 設定頁 | 對外 API / Webhook 管理 |

---

## API 路徑總覽（Phase 1 + 2）

```
/api/trpc/event.*
/api/trpc/order.*
/api/trpc/ticket.*
/api/trpc/discount.*
/api/trpc.waitlist.*
/api/trpc.question.*
/api/trpc.donation.*
/api/trpc/seat.*        ← Phase 2
/api/trpc/referral.*    ← Phase 2
/api/trpc/crm.*         ← Phase 2 Pro
/api/trpc/analytics.*   ← Phase 2 Pro
/api/trpc/survey.*      ← Phase 2
/api/trpc/chat.*        ← Phase 2
```

完整產品決策見 [PRODUCT_DECISIONS.md](./PRODUCT_DECISIONS.md)。
