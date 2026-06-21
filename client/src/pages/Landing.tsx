import { Link } from "wouter";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import {
  AI_BENTO_ITEMS,
  BentoProjectGrid,
  GifMarquee,
  GlowCard,
  GradientTypewriter,
} from "@/components/landing/AiPortfolioSections";
import { useInViewAnimation } from "@/hooks/useInViewAnimation";
import "@/styles/landing.css";

const TYPEWRITER_WORDS = ["售票", "驗票", "分析", "自動化"];

export function Landing() {
  const { t } = useTranslation();
  const { data: me } = trpc.auth.me.useQuery(undefined, { retry: false });
  const isAuthed = !!me;
  const ctaHref = isAuthed ? "/dashboard/events/new" : "/login";
  const accountHref = isAuthed ? "/dashboard" : "/login";

  useInViewAnimation(".landing-page .reveal");

  return (
    <div className="landing-page">
      <div className="page-bg" aria-hidden="true" />

      <header className="nav">
        <div className="wrap nav-inner">
          <Link href="/" className="logo">
            {t("appName")}
          </Link>
          <nav className="nav-links" aria-label="主要導覽">
            <a className="nav-text" href="#ai-projects">
              AI 功能
            </a>
            <a className="nav-text" href="#pricing">
              方案
            </a>
            <Link className="nav-text" href="/events">
              {t("nav.home")}
            </Link>
            <Link className="btn btn-ghost" href={accountHref}>
              {isAuthed ? t("nav.dashboard") : t("nav.login")}
            </Link>
            <Link className="btn btn-primary" href={ctaHref}>
              免費試用
            </Link>
          </nav>
        </div>
      </header>

      <main className="landing-main">
        <section className="hero wrap">
          <div className="hero-inner">
            <p className="kicker mono reveal">Wonder Ticketing · 活動 SaaS</p>
            <p className="hero-logo serif reveal" style={{ animationDelay: "0.1s" }}>
              {t("appName")}
            </p>
            <h1 className="reveal" style={{ animationDelay: "0.2s" }}>
              用 AI 重新定義
              <br />
              活動<GradientTypewriter words={TYPEWRITER_WORDS} />流程
            </h1>
            <div className="hero-lede reveal" style={{ animationDelay: "0.3s" }}>
              <p>
                建立活動、設定票種、串接 Wonder Payment 收款——從購票確認到 QR
                驗票入場，一個平台全部搞定。
              </p>
              <p>Pro 方案解鎖 AI 文案、CRM、座位圖與系統整合，讓主辦方專注在活動本身。</p>
            </div>
            <div className="hero-cta reveal" style={{ animationDelay: "0.4s" }}>
              <Link className="btn btn-primary" href={ctaHref}>
                開始免費試用
              </Link>
              <Link className="btn btn-secondary" href="/events">
                探索活動
              </Link>
            </div>
          </div>
        </section>

        <GifMarquee />

        <section className="section wrap" id="ai-projects">
          <div className="section-head reveal">
            <h2>
              AI 驅動的<span className="serif"> 產品能力</span>
            </h2>
            <p>Bento 式模組佈局，展示 Wonder Ticketing Phase 3 智能化功能。</p>
          </div>
          <BentoProjectGrid items={AI_BENTO_ITEMS} />
        </section>

        <section className="section wrap" id="pricing">
          <div className="section-head reveal">
            <h2>
              簡單透明的<span className="serif"> 方案</span>
            </h2>
            <p>依活動規模選擇，隨時升級或取消。</p>
          </div>
          <div className="pricing-grid">
            <GlowCard className="tier tier-dark reveal" as="article" style={{ animationDelay: "0.1s" } as CSSProperties}>
              <h3>Starter</h3>
              <p className="tier-desc">
                公開活動售票、多票種與折扣碼。
                <br />
                Email 購票確認，零月費起步。
              </p>
              <div className="price">
                $0<small>月費 · 5% 全包</small>
              </div>
              <ul>
                <li>公開活動售票</li>
                <li>多票種與折扣碼</li>
                <li>Email 購票確認</li>
              </ul>
              <div className="tier-cta">
                <Link className="btn btn-primary" href={ctaHref}>
                  開始使用
                </Link>
              </div>
            </GlowCard>

            <GlowCard className="tier tier-light reveal" as="article" style={{ animationDelay: "0.2s" } as CSSProperties}>
              <h3>Pro</h3>
              <p className="tier-desc">
                Private 邀請、座位圖、CRM 與 AI 功能。
                <br />
                適合成長型主辦方。
              </p>
              <div className="price">
                $460<small>月費 · 3% 全包</small>
              </div>
              <ul>
                <li>Private 活動邀請連結</li>
                <li>座位圖 · CRM · 分析</li>
                <li>AI 文案 · Widget · Webhooks</li>
              </ul>
              <div className="tier-cta">
                <Link className="btn btn-secondary" href="/dashboard/subscription">
                  升級 Pro
                </Link>
              </div>
            </GlowCard>
          </div>
        </section>
      </main>

      <footer className="landing-footer wrap">
        <div className="footer-row">
          <Link className="btn btn-primary" href={ctaHref}>
            開始售票
          </Link>
          <div className="footer-links">
            <div className="footer-col">
              <a href="#ai-projects">AI 功能</a>
              <a href="#pricing">方案</a>
              <Link href="/events">{t("nav.home")}</Link>
            </div>
            <div className="footer-col">
              <a href="mailto:support@wonder.hk">support@wonder.hk</a>
              <Link href="/login">{t("nav.login")}</Link>
            </div>
          </div>
        </div>
        <div className="copyright">
          <span>© 2026 {t("appName")}</span>
          <span>Hong Kong</span>
        </div>
      </footer>

      <nav className="bottom-nav" aria-label="快速操作">
        <span className="bottom-nav-mark serif">W</span>
        <Link className="btn btn-primary" href={ctaHref}>
          免費試用
        </Link>
      </nav>
    </div>
  );
}
