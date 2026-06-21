# Wonder Ticketing

**版本：1.0.0** — 見 [CHANGELOG.md](./CHANGELOG.md)

Wonder Payment 推出的自助活動售票 SaaS（多租戶）。技術規格見 `wonder.pdf`.

**資料庫：MongoDB + Mongoose**（正式方案，見 [docs/MONGODB_MIGRATION.md](./docs/MONGODB_MIGRATION.md)）。

**已確認產品決策**：[docs/PRODUCT_DECISIONS.md](./docs/PRODUCT_DECISIONS.md)

## 快速開始

```bash
cp .env.example .env
# 啟動 MongoDB 後（預設 mongodb://127.0.0.1:27017/wonder_ticketing）

npm install
npm run db:bootstrap   # v1.0：清空 MongoDB + 寫入 baseline（推薦）
# 或僅追加 seed：npm run seed
npm run dev            # API + 前端（PORT 見 .env）
```

| 指令 | 說明 |
|------|------|
| `npm run db:reset` | 僅清空 MongoDB（刪除整個 database） |
| `npm run db:bootstrap` | 清空 + v1 seed（organizer、admin、demo 活動） |
| `npm run test:e2e` | Playwright 全站 E2E（31 項，自動 bootstrap） |
| `npm run test:e2e:fresh` | 手動 bootstrap 後跑 E2E |

**v1 baseline 帳號（dev login）：**

| Email | 角色 |
|-------|------|
| `organizer@wonder.hk` | 主辦方（Pro） |
| `admin@wonder.hk` | 平台 Admin |

示範活動 slug：`wonder-demo-concert`

| 端點 | 說明 |
|------|------|
| `GET /api/health` | 健康檢查 |
| `POST /api/dev/login` | 開發登入 `{ "email": "you@test.com" }` |
| `POST /api/trpc/...` | tRPC（見下方） |
| `GET /api/dev/mock-pay?orderNumber=WDR-...` | Mock 付款完成 |

tRPC 範例（需先 login 拿 cookie）：

```bash
# 登入
curl -c /tmp/wt.txt -X POST http://localhost:3000/api/dev/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"organizer@wonder.hk"}'

# 公開活動列表
curl -b /tmp/wt.txt 'http://localhost:3000/api/trpc/event.listPublished?input=%7B%22json%22%3A%7B%7D%7D'
```

Phase 進度見 [docs/PHASES.md](./docs/PHASES.md)。  
**Phase 2 功能說明**：[docs/PHASE2_FEATURES.md](./docs/PHASE2_FEATURES.md)

```bash
npm run dev    # API :3000 + 前端 :5173
```

## 專案結構（資料層已就緒）

```
server/
  models/          # Mongoose schemas（對應原 16+ SQL 表）
  db.ts            # 查詢 helpers（多租戶隔離）
  db/connect.ts
shared/
  features.ts      # Free/Pro 功能旗標
  const.ts
docs/
  MONGODB_MIGRATION.md
```

前端、tRPC routers、Wonder Payment 整合依 `wonder.pdf` Phase 1–4 陸續加入。

## 系統需求摘要

完整內容請閱 `wonder.pdf`；以下為精簡版。

### 產品定位

- 香港中小型活動主辦方自助建活動、賣票
- SaaS 多租戶：登入即可建活動，無需平台審批
- 支付閉環：Wonder Payment（FPS / PayMe / WeChat / Alipay / 信用卡）
- 雙語：繁中 / English

### 核心商業規則

| 規則 | 說明 |
|------|------|
| 多租戶 | 主辦方僅能管理自己的活動/訂單/票券 |
| Free / Pro | Free：5% 全包；Pro：HK$460/月 + 3% 全包 |
| 規模 | 每場活動預設最多 300 人 |
| 結算 | T+1 至主辦方 Wonder Payment 帳戶 |

### 角色

- **Attendee**：瀏覽、購票、票夾、推薦
- **Organizer**：活動 CRUD、票種、訂單、驗票、報表（Pro）
- **Admin**：全平台、精選活動、用戶管理

### 技術棧（規格 vs 本 repo）

| 層 | 規格書 | 目前 repo |
|----|--------|-----------|
| 前端 | React 19, Tailwind 4, wouter, tRPC | 待建 |
| API | Express + tRPC 11 | Express 骨架 |
| ORM | Drizzle → MySQL | **Mongoose → MongoDB** |
| 驗證 | Zod | 待接 routers |

### 主要功能模組

1. **活動**：建立/編輯/複製/取消、雙語、Banner、可見性、捐款、座位圖（Pro）
2. **票務**：多票種、候補、折扣碼、團體購票、自訂問題、票券轉讓
3. **訂單與支付**：checkout → Wonder Payment → Webhook → 出票 + Email/WhatsApp
4. **驗票**：QR 掃描入場
5. **推薦**：主辦方推薦碼、Peer Referral（Pro）
6. **訂閱**：Free/Pro 升級、功能閘道（`shared/features.ts`）
7. **分析（Pro）**：銷售趨勢、收入報表、CRM

### 開發階段（規格 Section 14）

- **Phase 1 (W1–4)**：Wonder Payment、折扣/候補/CSV、i18n、團體/捐款/轉讓
- **Phase 2 (W5–8)**：座位圖、推薦、CRM/問卷/聊天、分析
- **Phase 3 (W9–12)**：AI 文案、Widget、WhatsApp Bot、API/Webhooks、訂閱計費
- **Phase 4 (W13–14)**：企業功能、QA 上線

## License

Internal — Wonder Payment Confidential
