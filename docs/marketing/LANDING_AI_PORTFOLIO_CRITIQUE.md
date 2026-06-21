# Wonder Landing · AI Designer Portfolio 五維設計評審

> **評審對象**：`client/src/pages/Landing.tsx` + `client/src/styles/landing.css`  
> **設計合約**：`design-systems/ai-designer-portfolio/DESIGN.md`  
> **參考模板**：Open Design `example-ai-designer-portfolio`（暗黑變體）  
> **技能**：design-review + critique 五維  
> **評審日期**：2026-06-01  
> **總評**：符合模板 typography / spacing 節奏；Bento + Glow + 漸層打字已落地。

**預覽**：`http://localhost:5173/`（`npm run dev`）

---

## 雷達圖

```
哲學一致性    ████████░░  8/10
視覺層級      █████████░  9/10
細節執行      ████████░░  8/10
功能性        ████████░░  8/10
創新性        ████████░░  8/10
```

---

## 五維評分

### 1. 哲學一致性 · 8/10

**證據**：全頁統一採 ai-designer-portfolio 語彙——`#030812` 背景、1px 低對比邊框、Space Grotesk / PP Neue Montreal sans、DM Serif accent、IBM Plex Mono kicker。與官方白底模板刻意區隔為 **高對比暗黑變體**，但保留 440px hero 欄寬、48/96px section rhythm、rounded-full CTA。

**Keep**：tokens 集中於 `design-systems/ai-designer-portfolio/tokens.css`。  
**Fix**：其餘 app 頁面仍為 Tailwind 淺色——Landing 與 dashboard 視覺斷層明顯（預期，非本輪 scope）。

---

### 2. 視覺層級 · 9/10

**證據**：Hero H1 `clamp(32px, 5vw, 44px)` 為最大字級；Section H2 `clamp(28px, 4vw, 40px)`；Bento 標題 22px；kicker 12px mono。漸層打字詞組為視覺錨點，Bento 8+4+6+6 不對稱網格符合 anti-pattern 規範。

**Keep**：Featured Bento 卡（AI 文案 span-8）高度 280px 抬升層級。  
**Quick win**：Section 標題與 Bento 網格間距已由 40px 對齊 DESIGN.md `section-head margin-bottom`。

---

### 3. 細節執行 · 8/10

**證據**：Glow hover 使用 `--od-shadow-glow` 三層陰影；按鈕 primary 沿用 template multi-layer shadow 邏輯；`prefers-reduced-motion` 停用 gradient / reveal / hover transform；focus-visible ring 已補。

**Keep**：Bento 內嵌 visual placeholder（chart / bot / widget / copy）強化掃視辨識。  
**Fix（可選）**：Pro 定價卡可加 1px 左側 cyan accent 邊條（template featured 暗示）。

---

### 4. 功能性 · 8/10

**證據**：Nav `#ai-projects` / `#pricing` anchor；CTA 依登入狀態路由；bottom-nav 固定 pill 對齊 template；aria-label 於 nav / bottom-nav；GradientTypewriter `aria-live="polite"`。

**Keep**：GlowCard + useInViewAnimation 一次 reveal，效能合理。  
**Quick win**：Enterprise 方案已精簡為 Starter + Pro 雙卡，符合 template 雙卡 pricing 結構。

---

### 5. 創新性 · 8/10

**證據**：在官方 portfolio 结构上注入 Wonder Ticketing 產品語境（售票 / AI 文案 / WhatsApp Bot）；漸層打字循環「售票、驗票、分析、自動化」；Bento 展示 Phase 3 AI 能力而非 generic 三卡。

**Keep**：暗黑高對比 + 極簡邊框 + glow 組合有辨識度。  
**Fix（後續）**：可加入 template 的 GIF marquee 作 social proof 帶。

---

## 間距對照表（template vs 實作）

| 項目 | 官方 template | 本實作 | ✓ |
|------|---------------|--------|---|
| Hero column max-width | 440px | 440px | ✓ |
| Hero padding-top | 48 / 64px | 48 / 64px | ✓ |
| Section Y | 48 / 96px | 48 / 96px | ✓ |
| Wrap padding X | 24 / 32px | 24 / 32px | ✓ |
| Bento gap | 12 / 16px | 12 / 16px | ✓ |
| Card padding | 24 / 32px | 24 / 32px | ✓ |
| Bottom nav offset | 24px | 24px | ✓ |
| Footer bottom (nav clearance) | ~120px | 120px | ✓ |

---

## 修正紀錄（design-review 本輪已做）

- [x] 建立 `design-systems/ai-designer-portfolio/DESIGN.md` 設計合約
- [x] Hero 漸層打字 `GradientTypewriter`
- [x] Bento Grid `BentoProjectGrid` + hover Glow
- [x] `prefers-reduced-motion` fallback
- [x] `btn:focus-visible` 無障礙焦點環

---

## 檔案位置

| 檔案 | 說明 |
|------|------|
| `design-systems/ai-designer-portfolio/DESIGN.md` | 設計合約 |
| `design-systems/ai-designer-portfolio/tokens.css` | CSS tokens |
| `client/src/pages/Landing.tsx` | Landing 頁 |
| `client/src/components/landing/AiPortfolioSections.tsx` | Bento / Glow / Typewriter |
| `client/src/hooks/useInViewAnimation.ts` | Scroll reveal |
| `client/src/styles/landing.css` | Scoped styles |

---

## 參考

- Open Design `plugins/_official/examples/ai-designer-portfolio/SKILL.md`
- Open Design `design-templates/critique/SKILL.md`（五維評審）
- Open Design `skills/design-review/SKILL.md`
