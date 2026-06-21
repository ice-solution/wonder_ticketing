# Wonder Ticketing Presentation Docs

> 用途：給客戶 / 主管介紹 Wonder Ticketing v1.0 的產品功能、技術亮點與商業價值。  
> 建議格式：12 頁投影片，約 15-20 分鐘簡報。可交由 Open Design `html-ppt` 技能轉成 HTML deck 或後續匯出 PPT。

## Slide Structure

| Slide | 標題 | 核心功能 / 痛點提煉 |
|------:|------|---------------------|
| 1 | Wonder Ticketing：香港活動售票 SaaS | 中小型主辦方缺乏一站式建活動、收款、出票、驗票與 CRM 工具 |
| 2 | 市場痛點：活動營運碎片化 | 表單、付款、入場、通知、報表分散在不同工具，增加人手與出錯率 |
| 3 | 一站式活動建立與票務管理 | 活動 CRUD、雙語內容、票種、折扣、候補、Private 邀請與自訂報名問題 |
| 4 | Wonder Payment 閉環收款 | Checkout 串 Wonder Payment / Mock，付款成功後自動出票、通知與 webhook |
| 5 | QR 票券與現場驗票 | 訂單確認、我的票券、QR 掃描、手動驗票、Walk-in 現場售票 |
| 6 | Pro 座位圖與視覺編輯器 | 座位配置、結帳選座、後台視覺編輯，降低人工座位管理成本 |
| 7 | 增長工具：Referral、CRM、問卷與報表 | 推薦碼、會員標籤、活動後問卷、銷售趨勢，讓主辦方懂得再行銷 |
| 8 | AI 文案與嵌入式 Widget | Gemini AI 活動文案、iframe Widget，縮短上架時間並把售票帶到主辦方官網 |
| 9 | 通知與 WhatsApp Bot | Email / WhatsApp 通知、活動提醒、Meta Cloud API Bot，改善客戶服務效率 |
| 10 | API Key、Webhook 與平台整合 | Pro 主辦方可用 REST API 與 webhook 連接自家 CRM、財務與自動化流程 |
| 11 | 平台 Admin、SSO 與多租戶安全 | Admin 精選與用戶管理、OIDC 企業登入、角色與 event ownership 隔離 |
| 12 | v1.0 成果與下一步路線圖 | 31 項 Playwright E2E、v1 baseline、下一步聚焦 webhook 簽名、白標與上線 QA |

---

## Slide 1 — Wonder Ticketing：香港活動售票 SaaS

### 核心訊息

Wonder Ticketing 是以 Wonder Payment 為核心的自助活動售票 SaaS，讓主辦方從建立活動、售票收款、出票、驗票到後續 CRM，都在同一套平台完成。

### 功能痛點

- 中小型活動主辦方通常沒有技術團隊，難以快速建立完整售票流程。
- 支付、出票、入場與通知分散處理，造成營運成本高。
- 平台需要支援香港常見付款方式與雙語體驗。

### Speaker Notes

今天介紹的是 Wonder Ticketing v1.0。它不是單一售票頁，而是一套完整的活動售票 SaaS，目標客戶是香港中小型活動主辦方。主辦方登入後可以自助建立活動、設定票種、接受付款、產生 QR 票券、管理訂單和入場，並透過報表和 CRM 做後續營運。商業價值在於縮短活動上架時間，減少主辦方需要組合多個工具的成本，同時把收款閉環放在 Wonder Payment 之上，讓平台收入、交易資料與主辦方營運形成同一條產品線。

---

## Slide 2 — 市場痛點：活動營運碎片化

### 核心訊息

活動售票看似只是收錢，但實際包含宣傳、報名、支付、通知、入場、退款、問卷與分析；如果每一步都用不同工具，營運風險會快速累積。

### 功能痛點

- Google Form、轉數快截圖、Excel 名單與人手核對容易出錯。
- 活動當日最怕票券查不到、重複入場、候補與 walk-in 混亂。
- 活動後缺少可用數據，難以提升下一場轉換率。

### Speaker Notes

客戶真正的痛點不是「沒有售票頁」，而是整個活動營運流程太碎片化。報名可能在表單，付款在另一個渠道，入場名單在 Excel，通知又靠人手 WhatsApp。當活動規模一大，錯票、漏通知、候補混亂和現場排隊就會出現。Wonder Ticketing 的切入點，是把這些流程集中到同一個資料模型與操作介面。這樣主辦方可以用更少人手運作活動，管理層也能看到每場活動從曝光、銷售到入場的完整狀態。

---

## Slide 3 — 一站式活動建立與票務管理

### 核心訊息

後台支援活動建立、編輯、發布、票種、折扣碼、候補、自訂報名問題、Private 邀請與 cohost 管理，覆蓋活動上架與售票前期操作。

### 功能痛點

- 活動資料需要雙語、圖片、可見性與票務規則一起管理。
- 不同票種、折扣碼、候補與報名欄位若分散處理，客服成本高。
- Private 活動與 cohost 需要權限控管，避免資料外洩或誤操作。

### Speaker Notes

這一頁展示的是主辦方日常最常用的後台能力。活動建立不是只填標題和日期，而是包含雙語內容、banner、票種、折扣碼、候補名單、自訂報名問題，以及 private 邀請連結。系統也有 cohost 概念，讓主辦方可以授權團隊成員共同管理指定活動，而不是共用帳號。技術上，這些功能都透過 tRPC 與 Mongoose model 管理，並以使用者與活動 ownership 做隔離。商業上，這代表平台可以服務更多活動類型，從公開音樂會到企業內部活動都能覆蓋。

---

## Slide 4 — Wonder Payment 閉環收款

### 核心訊息

Checkout 流程支援 Mock 與 Wonder Payment，付款成功後自動完成訂單、出票、通知與 webhook，形成從售票到交易回調的閉環。

### 功能痛點

- 主辦方不想自行處理支付串接與付款核對。
- 付款成功後若不能即時出票，會造成客服查詢。
- 平台需要同時支援開發測試與正式 Wonder Payment staging / production。

### Speaker Notes

Wonder Ticketing 的核心差異，是售票系統和 Wonder Payment 能形成閉環。使用者選票後進入 checkout，付款可以走 mock 開發流程，也可以串 Wonder Payment。付款成功後，系統會根據訂單編號完成出票，產生 QR ticket，並觸發 Email、WhatsApp 或 webhook。這讓主辦方不需要再用人手對帳，也減少「我已付款但未收到票」的情況。對公司而言，這是把支付能力包裝成 SaaS 場景的重要一步，既提升交易量，也擴大 Wonder Payment 的商戶使用深度。

---

## Slide 5 — QR 票券與現場驗票

### 核心訊息

平台支援 QR 票券顯示、我的票券、票券轉讓、相機掃描驗票、手動輸入碼與 Walk-in 現場售票，覆蓋活動當日營運。

### 功能痛點

- 活動當日需要快速入場，不能依賴紙本名單。
- 主辦方需要處理臨場售票與特殊情況，例如 QR 無法掃描。
- 票券轉讓可減少退票壓力，提升 attendee 體驗。

### Speaker Notes

售票平台的成敗，往往在活動當日才真正被驗證。Wonder Ticketing 已經支援 QR 票券，使用者可在訂單確認頁和我的票券頁查看票碼；入場端可用相機掃描，也可手動輸入票碼，避免設備或環境問題影響入場。Walk-in 功能則支援現場臨時售票，讓主辦方不用另開收款和登記流程。票券轉讓功能也提高彈性，減少 attendee 因臨時不能出席而求助客服。這些功能共同降低現場混亂，提高活動執行可靠性。

---

## Slide 6 — Pro 座位圖與視覺編輯器

### 核心訊息

Pro 功能支援座位 API、結帳選座與視覺化座位編輯器，主辦方可配置區域、座位狀態並同步到售票流程。

### 功能痛點

- 有座位活動若只用普通票種，容易出現超賣或手動分配座位。
- Excel 式座位管理不直觀，難以給非技術營運人員使用。
- 座位圖是 Pro 升級的重要高價值功能。

### Speaker Notes

座位圖功能是 Wonder Ticketing 從一般票務工具升級到專業活動平台的重要能力。主辦方可以在後台透過視覺編輯器建立座位配置，系統會同步到 EventSeat 資料，讓 checkout 階段可以選座。這減少了用 Excel 或紙本座位表分配座位的風險，也讓活動營運人員可以用更直觀的方式管理場地。從商業角度，座位圖非常適合劇場、演唱會、講座和企業活動，是推動 Free 到 Pro 升級的功能槓桿。

---

## Slide 7 — 增長工具：Referral、CRM、問卷與報表

### 核心訊息

平台不只處理交易，也支援 Peer Referral、折扣碼、CRM 標籤、活動後問卷、CSV 匯出與銷售報表，幫助主辦方做再行銷。

### 功能痛點

- 主辦方需要知道票從哪裡來，而不只是賣了多少。
- 活動後資料若不能沉澱，下一場活動仍要從零開始。
- 問卷、CRM 和報表分散會削弱決策效率。

### Speaker Notes

Wonder Ticketing 的價值不止在「完成一筆訂單」，而是讓主辦方能累積可重用的客戶資料。Referral 和折扣碼可以追蹤推廣來源，CRM 標籤讓主辦方分群管理參加者，活動後問卷則收集滿意度與偏好。銷售報表提供收入與趨勢視覺化，CSV 匯出方便交給內部團隊或外部系統。這些功能把售票資料變成下一場活動的增長資產，讓平台從交易工具變成營運工具，也提高客戶續用和付費意願。

---

## Slide 8 — AI 文案與嵌入式 Widget

### 核心訊息

活動編輯頁支援 AI 生成中英文活動文案，並提供 `/embed/:slug` iframe Widget，讓主辦方快速把購票流程放到自家網站。

### 功能痛點

- 主辦方常花時間撰寫雙語活動描述，且文案品質不穩定。
- 品牌官網已有流量時，不希望使用者跳離到外部售票頁。
- Widget 可降低整合成本，AI 可縮短活動上架時間。

### Speaker Notes

AI 文案和嵌入式 Widget 是 Phase 3 的兩個提升效率功能。AI 文案目前已接 Gemini API，會優先使用模型生成繁中與英文描述；若 key 未設定或 quota 失敗，系統會自動回退到內建模板，避免功能中斷。Widget 則提供 `/embed/:slug` 的精簡購票頁，主辦方可用 iframe 嵌入官網。這兩者對商業價值很直接：AI 降低上架門檻，Widget 則把購票流程帶到主辦方既有流量場景，提高轉換並減少客製整合需求。

---

## Slide 9 — 通知與 WhatsApp Bot

### 核心訊息

平台支援 AWS SES Email、Meta WhatsApp Cloud API、活動提醒 scheduler，以及 WhatsApp Bot 查詢活動與導購。

### 功能痛點

- 付款後確認、活動前提醒和客服查詢若靠人手，規模一大就不可控。
- WhatsApp 是香港主辦方和 attendee 常用溝通渠道。
- 自動通知可減少 no-show 和客服成本。

### Speaker Notes

通知能力是活動體驗的重要部分。Wonder Ticketing 已經支援 Email 通知，並接入 Meta WhatsApp Cloud API，可用於付款確認、活動提醒和基本導購。系統也有 scheduler，定期處理活動提醒和訂閱狀態。WhatsApp Bot 能查活動、搜尋活動並提供購票連結，這讓 attendee 可以在熟悉的通訊工具中找到資訊。從主管角度看，這個功能降低客服壓力，也讓平台未來可以延伸更多自動化，例如候補通知、入場提醒和售後問卷追蹤。

---

## Slide 10 — API Key、Webhook 與平台整合

### 核心訊息

Pro 主辦方可建立 API Key，用 REST API 查活動與訂單；Webhook 支援 `order.paid` 等事件，讓外部 CRM、財務或 automation tool 能接入。

### 功能痛點

- 成熟主辦方通常已有 CRM、報表或內部營運工具。
- 若售票平台不能輸出資料，會阻礙企業客戶導入。
- Webhook 讓支付與出票事件可即時同步，不必人手匯出。

### Speaker Notes

API 和 Webhook 是 Wonder Ticketing 走向 B2B SaaS 的關鍵。對小型主辦方，後台 UI 已經足夠；但對企業或大型活動代理，他們需要把活動和訂單資料同步到 CRM、財務系統或自動化流程。平台已提供 API Key 管理和 REST API，例如查活動、查訂單；Webhook 則可在訂單付款成功時推送事件。這代表 Wonder Ticketing 不只是封閉後台，而是一個可被整合的票務基礎設施。未來若加上重試佇列與簽名驗證，可靠性會更接近正式企業級要求。

---

## Slide 11 — 平台 Admin、SSO 與多租戶安全

### 核心訊息

系統支援平台 Admin 精選活動與用戶管理、Enterprise SSO OIDC 登入，以及以 user / event ownership 為核心的多租戶隔離。

### 功能痛點

- 平台方需要基本營運能力，例如精選活動、管理用戶方案與角色。
- 企業客戶需要 SSO、domain allowlist 和集中身份管理。
- 多租戶 SaaS 必須避免主辦方看到或修改其他人的資料。

### Speaker Notes

管理與安全是 SaaS 能否服務企業客戶的重要門檻。Wonder Ticketing 現在已有平台 Admin 頁面，可做精選活動、用戶角色和 Pro 方案管理；企業登入方面，已支援 OIDC，可接 Azure AD、Okta 或 Google Workspace，並可設定 email domain allowlist。資料權限則透過使用者身份、活動建立者與 cohost 權限判斷，確保主辦方只能管理自己的活動。這些能力讓平台可以同時服務自助型主辦方和企業客戶，並為後續白標與更完整 super admin 打基礎。

---

## Slide 12 — v1.0 成果與下一步路線圖

### 核心訊息

v1.0 已完成核心售票 SaaS MVP，包含 v1 seed、健康檢查、版本號、Playwright E2E；下一步聚焦正式上線能力與企業化增強。

### 功能痛點

- MVP 需要可演示、可測試、可重設資料，否則難以持續交付。
- 正式上線仍需補強 webhook 簽名驗證、白標品牌與 QA。
- 清晰 roadmap 有助主管判斷投資優先順序。

### Speaker Notes

最後總結 v1.0 的交付狀態。Wonder Ticketing 已具備從建立活動到購票、付款、出票、驗票、CRM、Pro 功能和 Admin 的完整 MVP。專案已標記 1.0.0，提供 `db:bootstrap` 建立 baseline 帳號與示範活動，也有 Playwright 全站 E2E 測試，覆蓋 31 項流程。這代表它已經不只是概念 demo，而是一個可重複驗證的產品版本。下一步建議優先處理 Wonder Payment webhook 簽名驗證、白標品牌、自動化 QA 與正式 staging 驗收，讓它更接近可對外銷售的 SaaS。

---

## Open Design `html-ppt` Brief

若 Open Design daemon 已啟動，可使用以下 brief 交給 `html-ppt` 技能生成 HTML 簡報：

```text
請使用 html-ppt 技能生成一份 12 頁商務簡報，主題為 Wonder Ticketing v1.0。

簡報語言：繁體中文
目標受眾：客戶、主管、商務決策者
風格：現代 SaaS、白底藍色系、清晰產品截面、適合 15-20 分鐘 pitch
輸出：HTML-rendered presentation deck，可視覺化每頁核心功能、技術亮點與商業價值

內容請根據本文件的 Slide Structure 與每頁 Speaker Notes 製作：
1. Wonder Ticketing：香港活動售票 SaaS
2. 市場痛點：活動營運碎片化
3. 一站式活動建立與票務管理
4. Wonder Payment 閉環收款
5. QR 票券與現場驗票
6. Pro 座位圖與視覺編輯器
7. 增長工具：Referral、CRM、問卷與報表
8. AI 文案與嵌入式 Widget
9. 通知與 WhatsApp Bot
10. API Key、Webhook 與平台整合
11. 平台 Admin、SSO 與多租戶安全
12. v1.0 成果與下一步路線圖

每頁需要：
- 一句大標題
- 3 個短 bullet，聚焦痛點、功能、價值
- Speaker Notes 區塊，保留約 200 字逐字稿
- 視覺上使用 Wonder / SaaS / ticketing / payment / analytics 的圖像語言
```
