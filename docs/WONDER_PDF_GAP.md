# wonder.pdf 功能對照與缺口

> 規格來源：`wonder.pdf`（README 精簡版 + `docs/PHASES.md`）。PDF 本體不在 repo 內，以本文件追蹤實作狀態。  
> 產品決策衝突時以 [PRODUCT_DECISIONS.md](./PRODUCT_DECISIONS.md) 為準。

## 基本運作流程（本次優先）

| 步驟 | 規格 | 狀態 |
|------|------|------|
| 登入（Dev / OAuth） | Phase 1 | ✅ |
| 建立活動 + 票種 + 發布 | Phase 1 | ✅ |
| 公開列表 `/events` | Phase 1 | ✅ |
| 活動詳情 + 選票購買 | Phase 1 | ✅（已修 cart bug） |
| 結帳 + Mock/Wonder 付款 | Phase 1 | ✅ |
| 訂單確認 + 票碼 | Phase 1 | ✅ |
| 我的票券 | Phase 1 | ✅ |
| 驗票（手動輸入碼） | Phase 1 | ✅ |
| Walk-in 現場售票 | Phase 1 | ✅ |

---

## Phase 1（W1–4）— 規格 vs 實作

| 功能 | wonder.pdf | 狀態 | 備註 |
|------|------------|------|------|
| Wonder Payment 整合 | ✅ | ✅ | `WONDER_APP_ID` + `WONDER_PRIVATE_KEY_PATH`；未設 → mock |
| Webhook 付款回調 | ✅ | ⚠️ | 路由 ✅；簽名驗證 stub；本地需 ngrok |
| 折扣碼 | ✅ | ✅ | 結帳可套用 |
| 候補名單 | ✅ | ✅ | 售罄時加入 |
| CSV 匯出 | ✅ | ✅ | 含自訂報名問題欄位 |
| 雙語 i18n | ✅ | ✅ | zh-TW / en |
| 團體購票（多位參加者） | ✅ | ✅ | 結帳表單 |
| 捐款 | ✅ | ✅ | 活動頁 Widget |
| 票券轉讓 | ✅ | ✅ | `/my-tickets` |
| Walk-in | ✅ | ✅ | 驗票頁 |
| 自訂報名問題 | ✅ | ✅ | 後台管理 + 結帳表單 |
| QR 驗票掃描 | ✅ | ✅ | 相機掃描 + 手動輸入 |
| QR 票券顯示 | ✅ | ✅ | 訂單確認 + 我的票券 |
| Email / WhatsApp 通知 | ✅ | ✅ Email（AWS SES）/ WhatsApp（Meta Cloud API 或 console） |
| Admin 後台 | ✅ | ✅ | `/dashboard/admin` 精選活動 + 用戶管理 |

---

## Phase 2（W5–8）

| 功能 | 狀態 | 備註 |
|------|------|------|
| 座位圖 API + 結帳選座 | ✅ | |
| 座位視覺編輯器 | ✅ | `SeatMapEditor` + `/dashboard/seats` + 活動編輯頁嵌入 |
| 推薦碼 | ✅ | 後台 Referrals + i18n |
| Peer Referral | ✅ | 活動編輯 + 結帳 `?ref=` + 折扣計算 |
| CRM 標籤 | ✅ Pro | |
| 問卷 | ✅ | 付款後填寫；主辦後台可檢視回覆 + CSV |
| 活動聊天 | ✅ | 輪詢，無 WebSocket |
| 銷售報表 | ✅ Pro | Recharts |
| Private 活動邀請連結 | ✅ | invite token + PrivateInvitePanel |
| 活動 Email 提醒 | ✅ | reminderScheduler（每 5 分鐘） |
| 訂閱到期降級 | ✅ | subscriptionScheduler（每小時） |

---

## Phase 3（W9–12）

| 功能 | 狀態 | 備註 |
|------|------|------|
| Pro 訂閱 | ✅ | Mock 即時升級；Wonder 走 `SUB-*` 訂單 + webhook |
| API Key / Webhook | ✅ Pro | order.paid / refunded / checked_in / published |
| AI 文案 | ✅ MVP | 模板 / OpenAI 可接 |
| 嵌入式 Widget | ✅ | `/embed/:slug` |
| Meta Pixel / GA | ✅ | |
| Google / Facebook OAuth | ✅ | 需 env |
| WhatsApp Bot | ✅ | Meta Cloud API；查活動、搜尋、購票連結 |
| 真實 SendGrid / WhatsApp | ✅ WhatsApp | SES ✅ / WhatsApp Meta Cloud |
| Wonder 訂閱扣款 | ⚠️ | API + 訂閱頁 pending 狀態 ✅；需 webhook 完成激活 |
| UI 設計系統 | ✅ | Landing + 後台／登入：`design-systems/ai-designer-portfolio` |

---

## Phase 4（W13–14）— 進行中

| 功能 | 狀態 | 備註 |
|------|------|------|
| 平台 Admin | ✅ | 精選活動、用戶角色/方案 |
| SSO 企業登入 | ✅ | OIDC（Azure AD / Okta）；Email 網域白名單 |
| 白標品牌 | ❌ | |
| 上線 QA | 🚧 | Playwright v1 全站 + 整合 E2E |

---

## 本輪實作（2026-06）

1. Banner 上傳（活動編輯頁）
2. 票券 QR 碼顯示（訂單確認、我的票券）
3. QR 相機驗票（驗票頁）
4. 自訂報名問題（後台 + 結帳）
5. 票種 inline 編輯
6. 活動列表搜尋 + Banner 佔位圖
7. 後台活動列表 Banner 縮圖
8. Private 邀請連結 + Email 活動提醒
9. 後台訂單詳情、報名/問卷回覆、CSV 強化
10. 訂單退款 + Webhook 事件補齊 + 訂閱到期降級
11. Playwright E2E：`e2e/wonder-ticketing.spec.ts`
12. Wonder Payment staging 連線（`WONDER_PRIVATE_KEY_PATH` + `npm run wonder:test`）
13. Landing 重設：`example-ai-designer-portfolio` 白底藍字 + GIF marquee + Bento
14. 後台／登入 design shell（`client/src/styles/dashboard.css`）
15. 訂閱頁：付款模式顯示 + pending 狀態；Referrals i18n
16. **Peer Referral UI**：後台建立推薦碼、結帳驗證折扣、付款後計次
17. **座位視覺編輯器**：格線編輯、儲存同步 `EventSeat`、Pro gate
18. **WhatsApp Bot**：Meta Cloud API 發送、Webhook 驗簽、活動查詢／搜尋 Bot
19. **平台 Admin**：`/dashboard/admin/events|users` 精選活動、用戶管理 + 分頁載入
20. **Enterprise SSO**：OIDC 企業登入 + Email 網域白名單
21. **v1.0 發布**：`VERSION=1.0.0`、`db:bootstrap`、全站 Playwright E2E

---

## 建議下一輪優先

1. **Webhook 簽名驗證** — Wonder payment 正式化
2. **白標品牌** — 自訂 logo / 色彩
3. **上線 QA** — E2E 擴充 + staging 驗收
