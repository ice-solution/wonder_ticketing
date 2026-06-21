# 環境變數設定指南

> 複製範本：`cp .env.example .env`，再依下表填入。  
> **切勿**將含密鑰的 `.env` commit 到 git。

---

## 快速判斷：我現在需要填什麼？

| 使用情境 | 最少要填 |
|----------|----------|
| 本地開發（mock 付款 + Email 登入） | `MONGODB_URI`、`JWT_SECRET` |
| 本地 + Google / Facebook 登入 | 上述 + OAuth 四項 |
| 本地 + 真實 Wonder staging 付款 | 上述 + Wonder 區塊 + `WEBHOOK_BASE_URL` |
| 正式上線 | **全部必填項** + production URL + 強隨機 `JWT_SECRET` |

---

## 一、基礎（幾乎必設）

### `MONGODB_URI`

| 項目 | 說明 |
|------|------|
| **用途** | MongoDB 連線字串 |
| **本地範例** | `mongodb://127.0.0.1:27017/wonder_ticketing` |
| **Atlas 範例** | `mongodb+srv://<user>:<password>@cluster.mongodb.net/wonder_ticketing` |
| **如何取得** | 本地安裝 MongoDB，或 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 建立免費叢集 |
| **必填** | ✅ 是 |

### `JWT_SECRET`

| 項目 | 說明 |
|------|------|
| **用途** | 登入 Session（JWT Cookie）簽名 |
| **範例** | `your-random-secret-at-least-8-chars` |
| **如何取得** | 自行產生隨機字串（production 至少 32 字元） |
| **必填** | ✅ production 必改；本地可用預設 |

### `PORT`

| 項目 | 說明 |
|------|------|
| **用途** | API 伺服器埠 |
| **預設** | `3000` |
| **必填** | 否 |

### `NODE_ENV`

| 項目 | 說明 |
|------|------|
| **用途** | `development` / `production` / `test` |
| **影響** | production 會關閉 `/api/dev/login`、啟用 secure cookie |
| **必填** | 否（預設 `development`） |

---

## 二、網址（上線前必設）

### `CLIENT_URL`

| 項目 | 說明 |
|------|------|
| **用途** | 前端網址；OAuth 登入後導向、mock 付款完成跳轉 |
| **本地** | `http://localhost:5173` |
| **正式** | `https://ticketing.yourdomain.com` |
| **必填** | 建議填；未填時 OAuth 預設 `http://localhost:5173` |

### `WEBHOOK_BASE_URL`

| 項目 | 說明 |
|------|------|
| **用途** | **對外可訪問的 API 根網址**；Wonder 付款 callback、OAuth redirect_uri 的 host |
| **本地** | `http://localhost:3000`（Wonder 遠端 callback **無法**打到本機，需 ngrok 或 staging 伺服器） |
| **正式** | `https://api.yourdomain.com` |
| **必填** | Wonder 真實付款時 ✅；純本地 mock 可略 |

**Wonder callback 完整路徑（需在 Wonder 後台白名單）：**

```
{WEBHOOK_BASE_URL}/api/wonder-payment/webhook
```

---

## 三、Google 登入

| 變數 | 說明 |
|------|------|
| `GOOGLE_CLIENT_ID` | OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret |

### 如何取得

1. 開啟 [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. 建立專案（若尚未有）
3. **OAuth 同意畫面** → 設定應用程式名稱、測試用戶（開發階段）
4. **建立憑證 → OAuth 2.0 Client ID → 網頁應用程式**
5. **授權重新導向 URI** 加入：

| 環境 | URI |
|------|-----|
| 本地 | `http://localhost:3000/api/auth/google/callback` |
| 正式 | `https://<你的API網域>/api/auth/google/callback` |

6. 複製 Client ID、Client Secret 到 `.env`

### 前端入口

- 登入頁：`/login` →「使用 Google 登入」
- API：`GET /api/auth/google?redirect=...`

**未設定時**：不顯示 Google 按鈕；開發環境仍可用 Email dev login。

---

## 四、Facebook 登入

| 變數 | 說明 |
|------|------|
| `FACEBOOK_APP_ID` | Meta App ID |
| `FACEBOOK_APP_SECRET` | Meta App Secret |

### 如何取得

1. 開啟 [Meta for Developers](https://developers.facebook.com/apps) → 建立應用
2. 加入產品：**Facebook Login**
3. **Facebook Login → 設定 → 有效 OAuth 重新導向 URI**：

| 環境 | URI |
|------|-----|
| 本地 | `http://localhost:3000/api/auth/facebook/callback` |
| 正式 | `https://<你的API網域>/api/auth/facebook/callback` |

4. **設定 → 基本** 複製 App ID、App Secret

### 注意

- 開發模式僅限應用程式管理員／測試員登入
- 上線前需完成 App Review（若需公開 `email` 權限）

**未設定時**：不顯示 Facebook 按鈕。

---

## 四-b、Enterprise SSO（OIDC）

適用 **Azure AD**、**Okta**、**Google Workspace** 等標準 OpenID Connect IdP。

| 變數 | 說明 |
|------|------|
| `SSO_OIDC_ISSUER` | IdP Issuer URL（結尾通常 `/v2.0`） |
| `SSO_OIDC_CLIENT_ID` | OAuth Client ID |
| `SSO_OIDC_CLIENT_SECRET` | OAuth Client Secret |
| `SSO_OIDC_DOMAIN_ALLOWLIST` | 選填；允許的 Email 網域，逗號分隔（例：`wonder.hk,company.com`） |
| `SSO_OIDC_LABEL` | 登入按鈕文字，預設 `Enterprise SSO` |
| `SSO_OIDC_SCOPES` | 預設 `openid profile email` |

**Redirect URI（需在 IdP 註冊）：**

| 環境 | URI |
|------|-----|
| 本地 | `http://localhost:3000/api/auth/sso/callback` |
| 正式 | `https://<你的API網域>/api/auth/sso/callback` |

**Azure AD 範例 Issuer：**

```
https://login.microsoftonline.com/{tenant-id}/v2.0
```

**流程：**

1. 用戶點「Enterprise SSO」→ `GET /api/auth/sso?redirect=...`
2. 導向 IdP 登入 → callback 交換 token → 讀取 userinfo / id_token
3. 若設 `DOMAIN_ALLOWLIST`，Email 網域不符則拒絕（`auth_error=sso_domain`）

**未設定時**：登入頁不顯示 SSO 按鈕。

---

## 五、Wonder Payment Gateway

> 實作參考 `eventCheckinSystem`（`checkinSystem/utils/wonderPayment.js`）。  
> 詳見 [WONDER_PAYMENT.md](./WONDER_PAYMENT.md)

| 變數 | 必填 | 說明 |
|------|------|------|
| `PAYMENT_DEV` | 否 | `true` / `1` → **staging** `https://gateway-stg.wonder.today`；否則 production `https://gateway.wonder.today` |
| `WONDER_APP_ID` | 真實付款時 ✅ | Wonder 提供的 `app_id` |
| `WONDER_PRIVATE_KEY` | 真實付款時 ✅ | RSA PEM 私鑰（見下方格式） |
| `WONDER_CUSTOMER_UUID` | 否 | 依 Wonder 文件決定是否填 |
| `WONDER_API_KEY` | 否 | 若 Wonder 要求 Bearer / X-API-Key |

### 向 Wonder 團隊索取

請 Wonder Payment 提供 **staging** 與 **production** 各一套：

- `WONDER_APP_ID`
- `WONDER_PRIVATE_KEY`（RSA 私鑰 PEM）
- （可選）`WONDER_CUSTOMER_UUID`、`WONDER_API_KEY`
- 確認 **callback URL 白名單**：`https://你的API網域/api/wonder-payment/webhook`

### `WONDER_PRIVATE_KEY` 格式

單行寫入 `.env`，換行用 `\n`：

```env
WONDER_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----"
```

### 未設定時的行為

- 自動 **mock 模式**
- 結帳導向 `/api/dev/mock-pay?orderNumber=WDR-...` 模擬付款成功

### 付款流程摘要

```
結帳 → Wonder echo 認證 → 建立訂單 → 買家付款
     → Wonder POST/GET callback → 出票 → 導回 /order/{orderNumber}
```

`reference_number` = 本站訂單號 `WDR-...`

---

## 六、選填功能

### `WHATSAPP_VERIFY_TOKEN`

| 項目 | 說明 |
|------|------|
| **用途** | WhatsApp Webhook 驗證（`GET /api/whatsapp/webhook`） |
| **預設** | `wonder_dev` |
| **如何取得** | 自行設定任意字串，與 Meta WhatsApp 後台 Verify Token 一致 |

### Meta WhatsApp Cloud API

| 變數 | 說明 |
|------|------|
| `WHATSAPP_ACCESS_TOKEN` | Meta 永久存取權杖（System User Token） |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Business 電話號碼 ID |
| `WHATSAPP_APP_SECRET` | Meta App Secret（驗證 `X-Hub-Signature-256`） |
| `WHATSAPP_VERIFY_TOKEN` | Webhook 驗證 token（同上） |

**Webhook URL**：`{WEBHOOK_BASE_URL}/api/whatsapp/webhook`

**Bot 指令**（Pro 功能，公開活動）：
- `活動` / `events` — 列出即將舉行的活動
- 回覆數字 `1–5` — 查看詳情與購票連結
- 關鍵字 — 搜尋活動標題／場地
- `幫助` / `help` — 顯示指令說明

**未設定 `WHATSAPP_ACCESS_TOKEN` 時**：Bot 仍解析訊息並將回覆寫入 server console；WhatsApp 通知走 console log。

**測試**：`/dashboard/subscription` → WhatsApp 通知區 → 輸入 E.164 電話 → 發送測試。

### AWS SES（Email 通知）

| 變數 | 說明 |
|------|------|
| `SENDER_EMAIL` | 已驗證的寄件地址（SES Verified Identity） |
| `AWS_SES_ACCESS_KEY_ID` | IAM 使用者 Access Key |
| `AWS_SES_SECRET_ACCESS_KEY` | IAM Secret |
| `AWS_SES_REGION` | 預設 `ap-southeast-1` |

**觸發時機**：付款成功購票確認、票券轉讓通知、主辦後台「發送測試 Email」。

**未設定時**：Email 仍寫入 server console，不會真正寄出。

**測試**：`/dashboard/subscription` → Email 通知區 → 輸入收件 Email → 發送測試。

### `GEMINI_API_KEY`

| 項目 | 說明 |
|------|------|
| **用途** | AI 活動文案（Pro 功能，活動編輯頁「AI 生成」） |
| **如何取得** | [Google AI Studio](https://aistudio.google.com/apikey) 建立 API Key |
| **未設定時** | 使用內建模板生成文案 |
| **API 失敗時** | 自動回退內建模板，並在 server log 顯示警告 |

### `GEMINI_MODEL`

| 項目 | 說明 |
|------|------|
| **用途** | Gemini 模型名稱 |
| **預設** | `gemini-2.0-flash` |
| **備選** | `gemini-1.5-flash`（若帳戶未開放 2.0） |

### `VITE_APP_TITLE`

| 項目 | 說明 |
|------|------|
| **用途** | 前端標題（預留，目前 UI 主要用 i18n） |
| **必填** | 否 |

### `COOKIE_NAME`

| 項目 | 說明 |
|------|------|
| **用途** | Session cookie 名稱 |
| **預設** | `wonder_session` |
| **必填** | 否 |

---

## 七、完整 `.env` 範例

### 本地開發（最小）

```env
MONGODB_URI=mongodb://127.0.0.1:27017/wonder_ticketing
JWT_SECRET=local-dev-secret-change-me
CLIENT_URL=http://localhost:5173
WEBHOOK_BASE_URL=http://localhost:3000
PORT=3000
```

### 本地 + 社交登入

```env
# ... 上述 ...
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
FACEBOOK_APP_ID=123456789
FACEBOOK_APP_SECRET=xxxx
```

### Staging（Wonder 測試環境）

```env
# ... 上述 ...
PAYMENT_DEV=true
WONDER_APP_ID=向 Wonder 索取
WONDER_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
WONDER_CUSTOMER_UUID=
WONDER_API_KEY=
WEBHOOK_BASE_URL=https://your-staging-api.example.com
```

### Production

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<至少32字元隨機字串>
CLIENT_URL=https://ticketing.example.com
WEBHOOK_BASE_URL=https://api.example.com
PAYMENT_DEV=false
WONDER_APP_ID=...
WONDER_PRIVATE_KEY="..."
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
```

---

## 八、上線前檢查清單

- [ ] `JWT_SECRET` 已改為強隨機字串
- [ ] `MONGODB_URI` 使用 production 資料庫且帳密已輪換
- [ ] `CLIENT_URL`、`WEBHOOK_BASE_URL` 為正式 HTTPS 網址
- [ ] Google / Facebook OAuth 重新導向 URI 已加入正式 API 網域
- [ ] Wonder callback URL 已在 Wonder 後台白名單
- [ ] `PAYMENT_DEV=false`（production 付款）
- [ ] `.env` 未 commit 到 git
- [ ] `POST /api/dev/login` 在 production 已自動關閉

---

## 九、對照：變數 → 程式讀取位置

| 變數 | 讀取於 |
|------|--------|
| 基礎、OAuth、Wonder | `server/_core/env.ts` |
| Wonder 簽名與建單 | `server/payment/wonderGateway.ts` |
| 結帳入口 | `server/payment.ts` |
| Google / Facebook 登入 | `server/_core/socialAuth.ts` |
| Wonder webhook | `server/_core/index.ts` |

---

## 十、常見問題

**Q：本地能否測 Wonder 真實付款？**  
A：Wonder 伺服器需能呼叫你的 `callback_url`。本機 `localhost` 通常不行，需部署到 staging 或使用 ngrok 等隧道，並將 `WEBHOOK_BASE_URL` 設為隧道網址。

**Q：只填 Google，不填 Facebook 可以嗎？**  
A：可以。有設定的 provider 才會在 `/login` 顯示按鈕。

**Q：Wonder 資料還沒拿到能開發嗎？**  
A：可以。留空即 mock 付款 + dev Email 登入。

**Q：`.env.example` 與本文件的關係？**  
A：`.env.example` 是空白範本；本文件說明每項如何取得與何時必填。
