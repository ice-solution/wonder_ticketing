import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { trpc } from "@/lib/trpc";

export function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [path] = useLocation();
  const { data: me } = trpc.auth.me.useQuery(undefined, { retry: false });
  const isAuthed = !!me;

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/";
  };

  const inDashboard = path.startsWith("/dashboard");
  const onLoginPage = path === "/login";
  const isEmbed = path.startsWith("/embed");

  if (isEmbed) {
    return <div className="min-h-screen bg-white">{children}</div>;
  }

  return (
    <div className="dashboard-app">
      <header className="dash-header">
        <div className="dash-header-inner">
          <Link href="/" className="dash-logo">
            {t("appName")}
          </Link>
          <nav className="dash-topnav" aria-label="帳戶導覽">
            {!onLoginPage && (
              <Link href="/events" className={path.startsWith("/events") || path.startsWith("/event/") ? "is-active" : ""}>
                {t("nav.home")}
              </Link>
            )}
            {isAuthed && !onLoginPage && (
              <>
                <Link href="/my-tickets">{t("nav.myTickets")}</Link>
                <Link href="/dashboard">{t("nav.dashboard")}</Link>
              </>
            )}
            <LanguageSwitcher />
            {isAuthed ? (
              <button type="button" onClick={logout}>
                {t("nav.logout")}
              </button>
            ) : (
              !onLoginPage && (
                <Link href="/login" className="dash-login-btn">
                  {t("nav.login")}
                </Link>
              )
            )}
          </nav>
        </div>
      </header>
      <main className={`dash-main${inDashboard ? "" : " dash-main--public"}`}>{children}</main>
    </div>
  );
}
