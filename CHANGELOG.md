# Changelog

## [1.0.0] — 2026-06-01

Wonder Ticketing 首個正式版本：完整活動售票 SaaS MVP。

### 核心流程
- 主辦方登入（Dev / Google / Facebook / Enterprise SSO OIDC）
- 活動建立、票種、發布、公開列表與購票
- 結帳 + Mock / Wonder Payment
- 訂單確認、QR 票券、驗票、Walk-in
- 我的票券、票券轉讓

### Phase 2–3 功能
- 座位視覺編輯器、結帳選座
- Peer Referral、折扣碼、候補、捐款
- CRM、問卷、活動聊天、銷售報表
- Pro 訂閱、API Key、Webhook、AI 文案、Widget
- Email（SES）、WhatsApp Bot（Meta Cloud API）
- 平台 Admin（精選活動、用戶管理）

### 測試
- Playwright E2E：`e2e/v1-full-site.spec.ts` + `e2e/wonder-ticketing.spec.ts`
- 資料庫：`npm run db:bootstrap`（清空 + v1 seed）
