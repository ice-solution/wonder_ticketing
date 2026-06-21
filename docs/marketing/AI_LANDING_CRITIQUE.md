# Flowmind 落地頁 · 五維設計評審報告

> **評審對象**：`marketing/flowmind/index.html`  
> **設計系統**：Stripe（`design-systems/stripe/DESIGN.md`）  
> **技能**：Open Design `saas-landing` + `critique` 五維  
> **評審日期**：2026-06-01  
> **總評**：已修正初稿 Anti-patterns，符合 Stripe 規範；與 Vercel 視覺語言刻意區隔（Stripe ≠ Geist 極簡黑白）。

**預覽**：`http://localhost:3000/marketing/flowmind/`（`npm run dev` 後開啟）

---

## 雷達圖（修正後分數）

```
哲學一致性    ████████░░  8/10
視覺層級      ████████░░  8/10
細節執行      ███████░░░  7/10
功能性        ████████░░  8/10
創新性        ███████░░░  7/10
```

---

## 五維評分（烏托邦 Critique）

### 1. 哲學一致性 · 8/10

**證據**：全頁統一採 Stripe 語彙——深海军標題 `#061b31`、weight 300 標題、4–6px 圓角、藍紫雙層陰影。漸層僅作背景裝飾（ruby / magenta radial），未用於 CTA 或正文。Accent `#533afd` 僅出現在：導覽主按鈕、Hero 主 CTA、定價 Pro 按鈕、Footer CTA、連結——符合 DESIGN.md「≤2 次主視覺 accent」精神（互動元素除外）。

**Keep**：Stripe token 變數命名與 `tokens.css` 對齊。  
**Fix**：初稿曾混用 Vercel Geist 風格（見下方 Anti-patterns）——已移除。

---

### 2. 視覺層級 · 8/10

**證據**：Hero `h1` 為 56px clamp、唯一最大字級；kicker mono 12px 為 meta 層；lede 18px `#64748d` 為次要；右側流程面板以 `shadow-elevated` 抬升為視覺錨點。區塊標題 32px，卡片標題 22px，層級清晰。

**Keep**：Hero 雙欄——左文案右產品預覽，掃視路徑明確。  
**Quick win**：Pricing 區塊標題可再加大與卡片價格之間的間距 8px。

---

### 3. 細節執行 · 7/10

**證據**：按鈕使用 Stripe 規範雙層陰影 `rgba(50,50,93,0.11)` + `rgba(50,50,93,0.08)`；卡片 hover 升級至 `--shadow-elevated`（DESIGN.md Level 3）。`font-feature-settings: "ss01"` 全域啟用。定價數字使用 `tnum`。

**Fix（已做）**：初稿 12px+ pill 圓角、Inter 700 標題——已改為 4px 按鈕圓角與 weight 300。  
**剩餘**：`sohne-var` 未載入時 fallback 為 SF Pro，與 Stripe 官網仍有差距（需授權字體）。

---

### 4. 功能性 · 8/10

**證據**：具備 saas-landing 必要區塊（Hero / Features / Proof / Pricing / Footer CTA / Footer）。CTA 連至 `/login` 與站內錨點。`data-od-id` 已標註主要區塊。響應式 1024 / 640 斷點；行動版隱藏次要 nav 連結保留 CTA。

**Keep**：語意化 `<header>`, `<main>`, `<section>`, `<article>`。  
**Fix（已做）**：初稿無定價區、CTA 無實際 href——已補齊。

---

### 5. 創新性 · 7/10

**證據**：右側「workflow 執行面板」以 monospace 步驟編號呈現 AI 自動化，呼應活動主辦場景（訂單→文案→WhatsApp），非泛用「三個圖示卡片」。漸層為雙 radial 疊加而非全屏紫漸 AI-slop。

**Keep**：與 Wonder Ticketing 生態整合作為差異化賣點。  
**勿做**：不要再加 WebGL 粒子或 3D 地球——會破壞 Stripe 克制美學。

---

## Vercel 視覺標準對照 · Anti-patterns 清單

以下為初稿／常見錯誤相對 **Vercel DESIGN.md** 與 **Stripe DESIGN.md** 的衝突。本頁目標是 **Stripe**，故以 Stripe 為準；但若誤用 Vercel 模式會造成「四不像」。

| # | Anti-pattern | 問題 | 修正方式 | 狀態 |
|---|--------------|------|----------|------|
| 1 | **Geist 式 -2.4px 超緊字距 + weight 600 標題** | Vercel 壓縮美學，與 Stripe weight 300 衝突 | 標題改 weight 300，`letter-spacing: -0.025em`（Stripe 尺度） | ✅ 已修正 |
| 2 | **Shadow-as-border `0 0 0 1px` 取代真邊框** | Vercel 招牌技法；Stripe 用 `#e5edf5` 實線邊框 + 藍調陰影 | 卡片 `border: 1px solid var(--border)` + `--shadow-ambient` | ✅ 已修正 |
| 3 | **全屏紫粉漸層 + 白字 Hero（AI-slop）** | /generic SaaS 模板感，破壞 Stripe 白底精品感 | 改為固定 `page-bg` 雙 radial 裝飾，內容區保持白底 | ✅ 已修正 |
| 4 | **Pill 按鈕 `border-radius: 9999px`** | Vercel badge 風格；Stripe 禁止大圓角 | 按鈕統一 `4px` radius | ✅ 已修正 |
| 5 | **中性灰 `box-shadow`（無藍調）** | 不符合 Stripe `rgba(50,50,93,0.25)` 品牌陰影 | 按鈕／卡片使用 `--shadow-btn` / `--shadow-elevated` | ✅ 已修正 |
| 6 | **Accent 氾濫（標題、圖示、背景同為紫色）** | 違反 Stripe accent 節制 | 紫色僅 CTA／連結；裝飾用 ruby/magenta 漸層 | ✅ 已修正 |
| 7 | **Lorem /「超級充電你的工作流」空話** | AI-slop 文案 | 改為活動主辦具體場景（候補、WhatsApp、Wonder webhook） | ✅ 已修正 |
| 8 | **缺少 `data-od-id`（Open Design 協定）** | 無法接入 comment mode | 主要 section 已標註 | ✅ 已修正 |
| 9 | **Inter 700 + 14px 大圓角卡片** | 偏 Vercel/Tailwind UI 預設，非 Stripe | 改用 Stripe type scale + 6px 卡片圓角 | ✅ 已修正 |
| 10 | **Pricing「Recommended」pill 標籤** | saas-landing 範例反模式（999px pill） | Pro 方案僅用邊框 `#b9b9f9` + elevated shadow 區分 | ✅ 已修正 |

---

## 綜合行動清單

### Keep（勿改壞）

- Stripe 藍調雙層陰影公式於 `.btn-primary` 與 `.card:hover`
- Hero 右側 workflow 面板（產品具象化）
- 深海军 `#061b31` 標題 + slate `#64748d` 內文對比
- 漸層僅在 `.page-bg` 裝飾層，不污染可讀區

### Fix（若下一輪迭代）

- 載入 licensed `sohne-var` webfont（或確認 SF Pro 在 Apple 裝置 fallback）
- Pricing Pro 卡加 4px 左側 `#533afd` 邊條（Stripe 常用 featured 暗示，非 pill 標籤）

### Quick wins（5–15 分鐘）

- 為 `.nav` 加 `aria-label="主要導覽"`
- Footer 法律連結改真實路由
- 加入 `prefers-reduced-motion` 關閉 hover transform

---

## 檔案位置

| 檔案 | 說明 |
|------|------|
| `marketing/flowmind/index.html` | 落地頁（單檔 HTML + inline CSS） |
| `docs/marketing/AI_LANDING_CRITIQUE.md` | 本評審報告 |
| `design-systems/stripe/DESIGN.md`（open-design） | Stripe 設計規範來源 |

---

## 參考

- Open Design `design-templates/saas-landing/SKILL.md`
- Open Design `design-templates/critique/SKILL.md`（五維：哲學 / 層級 / 細節 / 功能 / 創新）
- Stripe `DESIGN.md` §4 Buttons、§6 Depth & Elevation
- Vercel `DESIGN.md`（對照用，本頁**不**採 Geist 極簡黑白）
