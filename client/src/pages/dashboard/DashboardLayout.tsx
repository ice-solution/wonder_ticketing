import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { RequireAuth } from "@/components/RequireAuth";

const links = [
  { href: "/dashboard", labelKey: "dashboard.events" },
  { href: "/dashboard/orders", labelKey: "dashboard.orders" },
  { href: "/dashboard/check-in", labelKey: "dashboard.checkIn" },
  { href: "/dashboard/analytics", labelKey: "Analytics" },
  { href: "/dashboard/crm", labelKey: "CRM" },
  { href: "/dashboard/referrals", labelKey: "Referrals" },
  { href: "/dashboard/seats", labelKey: "dashboard.seats" },
  { href: "/dashboard/subscription", labelKey: "dashboard.subscription" },
  { href: "/dashboard/integrations", labelKey: "dashboard.integrations" },
  { href: "/dashboard/admin/events", labelKey: "dashboard.admin", adminOnly: true },
];

function isActive(path: string, href: string) {
  if (href === "/dashboard") return path === "/dashboard" || path.startsWith("/dashboard/events");
  if (href === "/dashboard/admin/events") return path.startsWith("/dashboard/admin");
  return path === href || path.startsWith(`${href}/`);
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [path] = useLocation();
  const { t } = useTranslation();
  const { data: me } = trpc.auth.me.useQuery();

  const visibleLinks = links.filter((l) => !l.adminOnly || me?.role === "admin");

  return (
    <RequireAuth>
      <div className="dash-layout">
        <aside className="dash-sidebar">
          <nav className="dash-nav" aria-label="後台導覽">
            {visibleLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`dash-nav-link${isActive(path, l.href) ? " is-active" : ""}`}
              >
                {l.labelKey.startsWith("dashboard.") ? t(l.labelKey) : l.labelKey}
              </Link>
            ))}
            <Link href="/dashboard/events/new" className="dash-nav-link dash-nav-cta">
              {t("dashboard.newEvent")}
            </Link>
          </nav>
        </aside>
        <div className="dash-content">{children}</div>
      </div>
    </RequireAuth>
  );
}
