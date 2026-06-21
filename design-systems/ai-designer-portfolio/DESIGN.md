# AI Designer Portfolio · Wonder Ticketing Dark Variant

> 視覺來源：Open Design 官方 `example-ai-designer-portfolio`  
> 本 repo 採 **白底藍字** 亮色變體（`#ffffff` + `#051A24` / `#2563eb` accent）。

## 設計方向

| 維度 | 規範 |
|------|------|
| 模式 | 白底 `#ffffff` + 深藍字 `#051A24` / accent `#2563eb` |
| 邊框 | 1px `rgba(246,252,255,0.08)`，hover 微光 `#a5f3fc33` |
| 佈局 | Bento Grid — 12 欄、gap `12px`（md `16px`） |
| 字體 | Sans: Space Grotesk / PP Neue Montreal · Serif accent: DM Serif Display · Mono: IBM Plex Mono |
| 動效 | Hero 漸層打字 · 卡片 hover glow · scroll reveal fadeInUp 0.8s |

## Color Tokens

```
--od-bg:           #030812
--od-bg-2:         #051A24
--od-surface:      #0D212C
--od-surface-2:    #122a38
--od-fg:           #F6FCFF
--od-fg-muted:     #E0EBF0
--od-fg-subtle:    #8FA3AD
--od-body:         #C5D4DC
--od-border:       rgba(246, 252, 255, 0.08)
--od-border-hover: rgba(165, 243, 252, 0.35)
--od-glow-cyan:    rgba(165, 243, 252, 0.15)
--od-glow-violet:  rgba(196, 181, 253, 0.12)
--od-gradient-hero: linear-gradient(135deg, #a5f3fc 0%, #c4b5fd 50%, #f0abfc 100%)
```

## Typography Scale（對齊官方 template）

| Token | Size | Weight | 用途 |
|-------|------|--------|------|
| `--text-display` | clamp(32px, 5vw, 44px) | 500 | Hero H1 |
| `--text-serif` | 同上 | 400 | Serif accent 詞 |
| `--text-section` | clamp(28px, 4vw, 40px) | 500 | Section H2 |
| `--text-card-title` | 22px | 500 | Bento 卡片標題 |
| `--text-body` | 16px | 400 | 正文 |
| `--text-sm` | 14px | 400 | 次要說明 |
| `--text-kicker` | 12px | 500 | Mono kicker，letter-spacing 0.06em |

- 標題 `letter-spacing: -0.02em`，`line-height: 1.1`
- 正文 `line-height: 1.6`

## Spacing（官方 template 對照）

| 區塊 | Mobile | Desktop |
|------|--------|---------|
| Section Y | 48px | 96px |
| Hero top | 48px | 64px |
| Hero column max-width | 440px（文案欄） | 同左 |
| Bento gap | 12px | 16px |
| Card padding | 24px | 32px |
| Nav height | 56px | 64px |
| Page wrap padding X | 24px | 32px |
| Max content width | 1200px | 1200px |

## Bento Grid

- Container: `display: grid; grid-template-columns: repeat(12, 1fr); gap: var(--bento-gap)`
- Spans: `span-4` · `span-6` · `span-8` · `span-12`
- 最小卡片高度: 180px；featured 卡片: min-height 280px
- 圓角: `16px`（小卡）· `24px`（featured）
- 禁止均分三欄 generic feature row — 必須不對稱 Bento

## Glow Card

```css
border: 1px solid var(--od-border);
transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
/* hover */
border-color: var(--od-border-hover);
box-shadow: 0 0 0 1px rgba(165,243,252,0.12),
            0 0 32px var(--od-glow-violet),
            0 8px 32px rgba(0,0,0,0.45);
transform: translateY(-2px);
```

## Hero Gradient Typewriter

- 循環詞組以 `background-clip: text` 呈現漸層
- `background-size: 200% 200%` + `gradientShift 4s ease infinite`
- 切換間隔 2.4s，fade + translateY 過渡 0.5s
- `prefers-reduced-motion`: 停用 gradient 動畫，保留靜態漸層

## Buttons（源自 template 陰影邏輯，dark 適配）

- **Primary**: bg `#F6FCFF`, text `#051A24`, rounded-full, multi-layer shadow
- **Secondary**: transparent, border 1px `--od-border`, text `--od-fg`
- Hover: `translateY(-1px)`

## Anti-patterns

- 不用 Stripe 紫 accent `#533afd`
- 不用全屏 purple-blue 光暈背景
- 不用等寬三卡 feature grid
- 不用 700 weight 標題

## 檔案對應

| 檔案 | 用途 |
|------|------|
| `design-systems/ai-designer-portfolio/tokens.css` | 共用 CSS 變數 |
| `client/src/styles/landing.css` | Landing scoped styles |
| `client/src/styles/dashboard.css` | 後台 / 登入 shell（白底藍字 + glow 卡片） |
| `client/src/pages/Landing.tsx` | 公開 Landing |
| `client/src/components/Layout.tsx` | 後台 header shell |
| `client/src/pages/dashboard/DashboardLayout.tsx` | 側欄導覽 |
