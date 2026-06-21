# Wonder Payment Gateway 整合

> 實作參考 [checkinSystem/utils/wonderPayment.js](../checkinSystem/utils/wonderPayment.js)

## 環境變數

| 變數 | 必填 | 說明 |
|------|------|------|
| `PAYMENT_DEV` | 否 | `true` → 測試環境 `https://gateway-stg.wonder.today`；否則 production gateway |
| `WONDER_APP_ID` | 是* | Wonder `app_id` |
| `WONDER_PRIVATE_KEY` | 是* | RSA PEM 私鑰（`.env` 內換行用 `\n`） |
| `WONDER_PRIVATE_KEY_PATH` | 是* | 私鑰檔路徑（建議，支援多行 PEM），例如 `.secrets/wonder-private.pem` |
| `WONDER_CUSTOMER_UUID` | 否 | 依 Wonder 文件 |
| `WONDER_API_KEY` | 否 | Bearer / X-API-Key（若 Wonder 要求） |
| `WEBHOOK_BASE_URL` | 建議 | 對外 API base URL，用於 `callback_url` |

\* 未設定時自動進入 **mock 模式**（`/api/dev/mock-pay`）。

## 流程

1. `order.checkout` → `createPaymentSession` → Wonder echo 認證 → 建立訂單  
   `POST /svc/payment/api/v1/openapi/orders?with_payment_link=true`
2. 買家導向 Wonder `payment_url` 付款
3. Wonder 回調 `{WEBHOOK_BASE_URL}/api/wonder-payment/webhook`（GET 或 POST）
4. 依 `reference_number`（= 本站 `orderNumber`）與 `state` / `correspondence_state` 出票
5. 買家被導向 `{CLIENT}/order/{orderNumber}`

## 簽名

Wonder-RSA-SHA256：`server/lib/wonderSignature.ts`

## 向 Wonder 索取資料

請向 Wonder Payment 團隊申請 staging / production：

- `WONDER_APP_ID`
- `WONDER_PRIVATE_KEY`（RSA 私鑰）
- 可選：`WONDER_CUSTOMER_UUID`、`WONDER_API_KEY`
- 確認 callback URL 白名單：`https://你的域名/api/wonder-payment/webhook`

## 本地測試

不填 Wonder 變數 → mock 付款：

```bash
npm run dev
# 結帳後會跳轉 /api/dev/mock-pay?orderNumber=WDR-...
```

填好 staging 變數 + `PAYMENT_DEV=true` → 真實 Wonder staging gateway。
