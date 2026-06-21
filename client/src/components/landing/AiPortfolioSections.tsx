import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

type Props = {
  words: string[];
  intervalMs?: number;
  className?: string;
};

export function GradientTypewriter({ words, intervalMs = 2400, className = "" }: Props) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % words.length);
        setVisible(true);
      }, 280);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [words.length, intervalMs]);

  return (
    <span
      className={`gradient-typewriter ${visible ? "is-visible" : "is-hidden"} ${className}`.trim()}
      aria-live="polite"
    >
      {words[index]}
    </span>
  );
}

type GlowCardProps = {
  children: ReactNode;
  className?: string;
  as?: "article" | "div" | "a";
  href?: string;
  style?: CSSProperties;
};

export function GlowCard({ children, className = "", as = "article", href, style }: GlowCardProps) {
  const Tag = as;
  const props = href ? { href } : {};
  return (
    <Tag className={`glow-card reveal ${className}`.trim()} style={style} {...props}>
      {children}
    </Tag>
  );
}

export type BentoItem = {
  id: string;
  title: string;
  description: string;
  tag: string;
  span: "4" | "6" | "8" | "12";
  featured?: boolean;
  preview?: "chart" | "bot" | "widget" | "copy";
};

const previewLabels: Record<NonNullable<BentoItem["preview"]>, string> = {
  chart: "Analytics",
  bot: "WhatsApp",
  widget: "Widget",
  copy: "AI Copy",
};

export function BentoProjectGrid({ items }: { items: BentoItem[] }) {
  return (
    <div className="bento-grid">
      {items.map((item, i) => (
        <GlowCard
          key={item.id}
          className={`bento-item bento-span-${item.span}${item.featured ? " bento-featured" : ""}`}
          style={{ animationDelay: `${0.1 * (i + 1)}s` } as CSSProperties}
        >
          <div className="bento-top">
            <span className="bento-tag mono">{item.tag}</span>
            {item.preview ? (
              <span className="bento-preview mono">{previewLabels[item.preview]}</span>
            ) : null}
          </div>
          <h3 className="bento-title">{item.title}</h3>
          <p className="bento-desc">{item.description}</p>
          {item.preview ? <div className={`bento-visual bento-visual--${item.preview}`} aria-hidden /> : null}
        </GlowCard>
      ))}
    </div>
  );
}

export const MARQUEE_GIF_URLS = [
  "https://plugin-assets.open-design.ai/plugins/ai-designer-portfolio/hero-space-voyage-preview-eECLH3Yc-475920.gif",
  "https://plugin-assets.open-design.ai/plugins/ai-designer-portfolio/hero-portfolio-cosmic-preview-BpvWJ3Nc-89ab29.gif",
  "https://plugin-assets.open-design.ai/plugins/ai-designer-portfolio/hero-velorah-preview-CJNTtbpd-626d83.gif",
  "https://plugin-assets.open-design.ai/plugins/ai-designer-portfolio/hero-asme-preview-B_nGDnTP-7fb29d.gif",
  "https://plugin-assets.open-design.ai/plugins/ai-designer-portfolio/hero-transform-data-preview-Cx5OU29N-910cf9.gif",
  "https://plugin-assets.open-design.ai/plugins/ai-designer-portfolio/hero-aethera-preview-DknSlcTa-097fee.gif",
  "https://plugin-assets.open-design.ai/plugins/ai-designer-portfolio/hero-orbit-web3-preview-BXt4OttD-f84442.gif",
  "https://plugin-assets.open-design.ai/plugins/ai-designer-portfolio/hero-nexora-preview-cx5HmUgo-d2d4a4.gif",
];

export function GifMarquee() {
  const urls = [...MARQUEE_GIF_URLS, ...MARQUEE_GIF_URLS];
  return (
    <div className="marquee reveal" aria-label="產品預覽跑馬燈">
      <div className="marquee-track">
        {urls.map((src, i) => (
          <img key={`${src}-${i}`} src={src} alt="產品預覽" loading="lazy" />
        ))}
      </div>
    </div>
  );
}

export const AI_BENTO_ITEMS: BentoItem[] = [
  {
    id: "ai-copy",
    title: "AI 活動文案",
    description: "一鍵生成雙語活動描述、票種說明與 Email 提醒文案，保持品牌語氣一致。",
    tag: "Phase 3",
    span: "8",
    featured: true,
    preview: "copy",
  },
  {
    id: "analytics",
    title: "智能售票分析",
    description: "銷售趨勢、票種轉換與收入報表，Pro 主辦方即時掌握活動健康度。",
    tag: "Pro",
    span: "4",
    preview: "chart",
  },
  {
    id: "whatsapp",
    title: "WhatsApp 購票 Bot",
    description: "買家透過對話完成查詢、購票與票券接收，降低客服負擔。",
    tag: "Automation",
    span: "6",
    preview: "bot",
  },
  {
    id: "widget",
    title: "嵌入 Widget",
    description: "將售票模組嵌入官網或 Landing，無需跳轉即可完成結帳。",
    tag: "Integrations",
    span: "6",
    preview: "widget",
  },
];
