import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { DashboardLayout } from "./DashboardLayout";

export function DashboardReferrals() {
  const { t } = useTranslation();
  const code = trpc.referral.getMyCode.useQuery();
  const stats = trpc.referral.getStats.useQuery();

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">{t("referral.title")}</h1>
      {code.data && (
        <div className="rounded-xl border bg-white p-6 mb-4">
          <p className="text-sm text-slate-500">{t("referral.yourCode")}</p>
          <p className="text-3xl font-mono font-bold text-wonder-primary">{code.data.code}</p>
          <p className="text-sm mt-2">
            {t("referral.used")} {code.data.usedCount} / {code.data.maxUses}
          </p>
        </div>
      )}
      {stats.data && (
        <p className="text-slate-600">
          {t("referral.totalReferred")}: {stats.data.totalReferred} · {t("referral.freeMonths")}:{" "}
          {stats.data.freeMonths}
        </p>
      )}
    </DashboardLayout>
  );
}
