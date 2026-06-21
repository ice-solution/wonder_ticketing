import { useState } from "react";
import { useEffect } from "react";
import { useSearch } from "wouter";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { DashboardLayout } from "./DashboardLayout";

export function DashboardSubscription() {
  const { t } = useTranslation();
  const search = useSearch();
  const { data, refetch } = trpc.subscription.status.useQuery();
  const upgrade = trpc.subscription.upgrade.useMutation({
    onSuccess: (res) => {
      if (res.mock) void refetch();
      else window.location.href = res.paymentUrl;
    },
  });
  const cancel = trpc.subscription.cancel.useMutation({
    onSuccess: () => {
      void refetch();
      setCancelMsg(t("subscription.cancelScheduled"));
    },
    onError: (err) => setCancelMsg(err.message),
  });
  const quota = trpc.notification.quota.useQuery();
  const emailStatus = trpc.notification.emailStatus.useQuery();
  const whatsappStatus = trpc.notification.whatsappStatus.useQuery();
  const sendTest = trpc.notification.sendTest.useMutation();
  const [upgraded, setUpgraded] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [testMsg, setTestMsg] = useState("");
  const [testWaMsg, setTestWaMsg] = useState("");
  const [cancelMsg, setCancelMsg] = useState("");

  useEffect(() => {
    if (search.includes("upgraded=1")) {
      setUpgraded(true);
      void refetch();
    }
  }, [search, refetch]);

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">{t("subscription.title")}</h1>
      {upgraded && <p className="mb-4 text-green-700">{t("subscription.upgraded")}</p>}

      {data?.paymentMode && (
        <p className="mb-4 text-sm text-slate-600">
          {t("subscription.paymentMode")}:{" "}
          <span className="font-mono text-xs rounded-full border px-2 py-0.5">
            {data.paymentMode === "wonder" ? t("subscription.paymentWonder") : t("subscription.paymentMock")}
          </span>
        </p>
      )}

      {data?.isPending && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p>{t("subscription.pendingPayment")}</p>
          {data.pendingOrderNumber && (
            <p className="mt-2 font-mono text-xs">
              {t("subscription.pendingOrder")}: {data.pendingOrderNumber}
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl border bg-white p-6 max-w-lg space-y-3">
        <p>
          {t("subscription.currentPlan")}:{" "}
          <strong className="uppercase">{data?.isPro ? "Pro" : "Free"}</strong>
        </p>
        {data?.planExpiresAt && (
          <p className="text-sm text-slate-500">
            {t("subscription.expires")}: {new Date(data.planExpiresAt).toLocaleDateString()}
          </p>
        )}
        {data?.cancelAtPeriodEnd && (
          <p className="text-sm text-amber-700">{t("subscription.cancelScheduled")}</p>
        )}
        {quota.data && (
          <p className="text-sm text-slate-600">
            {t("subscription.quota")}: {quota.data.sent} / {quota.data.limit} {t("subscription.perWeek")}
          </p>
        )}

        {!data?.isPro && !data?.isPending ? (
          <button
            type="button"
            onClick={() =>
              upgrade.mutate({ origin: window.location.origin, paymentMethod: "card" })
            }
            disabled={upgrade.isPending}
            className="rounded-lg bg-wonder-primary px-4 py-2 text-white"
          >
            {t("subscription.upgrade", { price: data?.priceMonthly ?? 460 })}
          </button>
        ) : (
          <div className="space-y-2">
            {!data?.cancelAtPeriodEnd && (
              <button
                type="button"
                onClick={() => {
                  setCancelMsg("");
                  cancel.mutate();
                }}
                disabled={cancel.isPending}
                className="text-sm text-red-600 underline"
              >
                {t("subscription.cancel")}
              </button>
            )}
            {cancelMsg && <p className="text-sm text-slate-600">{cancelMsg}</p>}
          </div>
        )}
      </div>

      <div className="mt-6 max-w-lg rounded-xl border bg-white p-4 space-y-3">
        <h2 className="font-semibold text-slate-800">{t("notification.emailTitle")}</h2>
        {emailStatus.data?.ready ? (
          <p className="text-sm text-green-700">✓ {t("notification.emailReady")}</p>
        ) : (
          <p className="text-sm text-amber-700">{t("notification.emailNotConfigured")}</p>
        )}
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            setTestMsg("");
            sendTest.mutate(
              {
                channel: "email",
                to: testEmail,
                message: t("notification.testBody"),
              },
              {
                onSuccess: () => setTestMsg(t("notification.testSent")),
                onError: (err) => setTestMsg(err.message),
              }
            );
          }}
        >
          <input
            type="email"
            required
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder={t("checkout.email")}
            className="w-full rounded border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={sendTest.isPending || !emailStatus.data?.ready}
            className="rounded-lg border px-4 py-2 text-sm text-wonder-primary disabled:opacity-50"
          >
            {t("notification.sendTest")}
          </button>
          {testMsg && <p className="text-sm text-slate-600">{testMsg}</p>}
        </form>
      </div>

      <div className="mt-6 max-w-lg rounded-xl border bg-white p-4 space-y-3">
        <h2 className="font-semibold text-slate-800">{t("notification.whatsappTitle")}</h2>
        {whatsappStatus.data?.ready ? (
          <p className="text-sm text-green-700">✓ {t("notification.whatsappReady")}</p>
        ) : (
          <p className="text-sm text-amber-700">{t("notification.whatsappNotConfigured")}</p>
        )}
        <p className="text-xs text-slate-500">{t("notification.whatsappBotHint")}</p>
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            setTestWaMsg("");
            sendTest.mutate(
              {
                channel: "whatsapp",
                to: testPhone,
                message: t("notification.testBody"),
              },
              {
                onSuccess: () => setTestWaMsg(t("notification.testWaSent")),
                onError: (err) => setTestWaMsg(err.message),
              }
            );
          }}
        >
          <input
            type="tel"
            required
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder={t("notification.whatsappPhonePlaceholder")}
            className="w-full rounded border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={sendTest.isPending || !whatsappStatus.data?.ready}
            className="rounded-lg border px-4 py-2 text-sm text-wonder-primary disabled:opacity-50"
          >
            {t("notification.sendTestWhatsApp")}
          </button>
          {testWaMsg && <p className="text-sm text-slate-600">{testWaMsg}</p>}
        </form>
      </div>

      <div className="mt-6 max-w-lg rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
        <h2 className="font-semibold text-slate-800 mb-2">{t("subscription.proFeatures")}</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("subscription.featureSeats")}</li>
          <li>{t("subscription.featureAnalytics")}</li>
          <li>{t("subscription.featureApi")}</li>
          <li>{t("subscription.featureAi")}</li>
          <li>{t("subscription.featureWidget")}</li>
        </ul>
      </div>
    </DashboardLayout>
  );
}
