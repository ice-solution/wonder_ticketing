# 進階整合使用指南

> **適用對象**：Pro 主辦方，需要把售票資料接到自己的 CRM、內部系統或自動化流程。  
> **後台入口**：主辦後台 → **進階整合**（`/dashboard/integrations`）

若你只用 Wonder 後台賣票、Email 通知與驗票，**不必設定本頁**。

---

## 功能概覽

進階整合包含兩部分：

| 功能 | 方向 | 用途 |
|------|------|------|
| **連線金鑰** | 你的系統 → Wonder | 主動讀取活動、訂單資料 |
| **事件通知網址** | Wonder → 你的系統 | 有訂單付款等事件時，自動推送通知 |

兩者皆需 **Pro 訂閱**。

---

## 一、連線金鑰

### 1. 建立金鑰

1. 登入主辦後台 → **進階整合**
2. 在「連線金鑰」區塊輸入名稱（例如：`內部報表系統`）
3. 按 **建立金鑰**
4. **立即複製**顯示的金鑰（只會顯示一次）

### 2. 呼叫 API

在 HTTP 請求標頭加入：

```http
Authorization: Bearer <你的金鑰>
```

金鑰格式以 `wtk_` 開頭。請妥善保管，勿寫進前端網頁或公開 repo。

### 3. 可用端點

基底網址為你的 Wonder API 網址（本地開發預設 `http://localhost:3777`）。

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/v1/events` | 列出你建立的所有活動 |
| GET | `/api/v1/events/:slug` | 單一活動詳情 + 票種 |
| GET | `/api/v1/orders/:orderNumber` | 單筆訂單（僅限你主辦的活動） |

### 4. 範例

**列出活動**

```bash
curl -s -H "Authorization: Bearer wtk_live_xxxxxxxx" \
  "https://your-api.example.com/api/v1/events"
```

**查詢訂單**

```bash
curl -s -H "Authorization: Bearer wtk_live_xxxxxxxx" \
  "https://your-api.example.com/api/v1/orders/WDR-ABC123"
```

### 5. 撤銷金鑰

若金鑰外洩或不再使用，在後台按 **撤銷**。撤銷後該金鑰立即失效。

---

## 二、事件通知網址

當平台發生特定事件時，Wonder 會以 **HTTP POST** 將 JSON 送到你設定的網址。

### 1. 新增通知網址

1. 進入 **進階整合** →「事件通知網址」
2. 輸入你的 HTTPS 網址（例如：`https://crm.example.com/wonder/events`）
3. 勾選要接收的事件
4. 按 **新增通知網址**
5. **保存簽章密鑰**（只顯示一次，用於驗證請求來源）

### 2. 可訂閱的事件

| 事件 | 說明 | 目前是否觸發 |
|------|------|----------------|
| 訂單已付款 | 買家完成付款 | ✅ 已實作 |
| 訂單已退款 | 訂單退款 | ⏳ 介面可選，後端待接 |
| 票券已驗票 | 現場掃碼入場 | ⏳ 介面可選，後端待接 |
| 活動已發布 | 活動上線 | ⏳ 介面可選，後端待接 |

### 3. 請求格式

Wonder 會 POST 如下 JSON：

```json
{
  "type": "order.paid",
  "data": {
    "orderId": "...",
    "orderNumber": "WDR-XXXX",
    "eventId": "...",
    "eventSlug": "my-concert",
    "buyerEmail": "buyer@example.com",
    "totalAmount": 100,
    "currency": "HKD",
    "ticketCount": 2,
    "paidAt": "2026-06-20T12:00:00.000Z"
  },
  "createdAt": "2026-06-20T12:00:00.000Z"
}
```

HTTP 標頭：

| 標頭 | 說明 |
|------|------|
| `Content-Type` | `application/json` |
| `X-Wonder-Event` | 事件類型，例如 `order.paid` |
| `X-Wonder-Signature` | HMAC-SHA256 簽章（見下方） |

### 4. 驗證簽章

使用建立通知網址時取得的 **簽章密鑰**，對**原始 JSON 字串**計算 HMAC-SHA256，與 `X-Wonder-Signature` 比對。

Node.js 範例：

```javascript
import crypto from "crypto";

function verifySignature(secret, rawBody, signatureHeader) {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
}
```

你的接收端應：

1. 讀取 raw body（勿先 parse 再 stringify，以免格式不同）
2. 驗證簽章
3. 回傳 `2xx` 表示成功；非 2xx 會記錄為失敗

### 5. 本地測試

可用 [ngrok](https://ngrok.com/) 或類似工具把本機 port 暴露為 HTTPS，暫時填入通知網址進行測試。

---

## 三、常見使用情境

### 同步訂單到 CRM

1. 建立 **事件通知網址**，訂閱「訂單已付款」
2. 收到 `order.paid` 後，在你的伺服器寫入 CRM
3. 需要補充資料時，用 **連線金鑰** 呼叫 `/api/v1/orders/:orderNumber`

### 內部銷售儀表板

1. 建立 **連線金鑰**
2. 定時呼叫 `/api/v1/events` 與各活動訂單 API
3. 彙整到自己的報表系統

### 接自動化工具（Zapier / Make 等）

1. 在自動化平台建立 **Webhook 觸發器**
2. 把產生的 URL 貼到 Wonder「事件通知網址」
3. 選擇「訂單已付款」等事件

---

## 四、錯誤與限制

| HTTP 狀態 | 原因 |
|-----------|------|
| 401 | 金鑰缺失、格式錯誤或已撤銷 |
| 403 | 訂單不屬於該主辦方 |
| 404 | 活動或訂單不存在 |

- 連線金鑰僅能存取**你自己**建立的活動與訂單
- 通知推送逾時為 10 秒
- 免費方案無法使用進階整合

---

## 五、相關文件

- [環境設定](./ENV_SETUP.md) — API 網址（`WEBHOOK_BASE_URL`）設定
- [訂閱方案](./SUBSCRIPTION.md) — Pro 功能與取消訂閱
- [問卷與報名問題](./SURVEY_AND_QUESTIONS.md) — 買家何時看到問卷／報名欄位
