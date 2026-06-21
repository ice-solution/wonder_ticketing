import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { DashboardLayout } from "./DashboardLayout";
import { RequireAdmin } from "@/components/RequireAdmin";

function AdminStats() {
  const { t } = useTranslation();
  const { data } = trpc.admin.stats.useQuery();
  if (!data) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {[
        { label: t("admin.stats.users"), value: data.users },
        { label: t("admin.stats.pro"), value: data.proUsers },
        { label: t("admin.stats.events"), value: data.events },
        { label: t("admin.stats.published"), value: data.published },
        { label: t("admin.stats.featured"), value: data.featured },
        { label: t("admin.stats.orders"), value: data.orders },
      ].map((s) => (
        <div key={s.label} className="rounded-xl border bg-white p-3 text-center">
          <p className="text-2xl font-bold text-wonder-primary">{s.value}</p>
          <p className="text-xs text-slate-500 mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

const adminTabs = [
  { href: "/dashboard/admin/events", labelKey: "admin.tabEvents" },
  { href: "/dashboard/admin/users", labelKey: "admin.tabUsers" },
] as const;

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [path] = useLocation();

  return (
    <RequireAdmin>
      <DashboardLayout>
        <h1 className="text-2xl font-bold mb-2">{t("admin.title")}</h1>
        <p className="text-sm text-slate-500 mb-6">{t("admin.subtitle")}</p>

        <AdminStats />

        <div className="flex gap-2 mb-4 border-b">
          {adminTabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                path === tab.href || path.startsWith(`${tab.href}/`)
                  ? "border-wonder-primary text-wonder-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t(tab.labelKey)}
            </Link>
          ))}
        </div>

        {children}
      </DashboardLayout>
    </RequireAdmin>
  );
}
