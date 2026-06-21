import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { DashboardLayout } from "./DashboardLayout";
import { SalesTrendChart } from "@/components/charts/SalesTrendChart";
import { TicketTypeChart } from "@/components/charts/TicketTypeChart";

export function DashboardAnalytics() {
  const { t } = useTranslation();
  const events = trpc.event.listMine.useQuery();
  const [eventId, setEventId] = useState("");
  const [period, setPeriod] = useState<"7d" | "30d">("7d");

  const summary = trpc.analytics.summary.useQuery(
    { eventId },
    { enabled: !!eventId, retry: false }
  );
  const trend = trpc.analytics.salesTrend.useQuery(
    { eventId, period },
    { enabled: !!eventId && !summary.error, retry: false }
  );
  const byType = trpc.analytics.revenueByTicketType.useQuery(
    { eventId },
    { enabled: !!eventId && !summary.error, retry: false }
  );

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Analytics (Pro)</h1>
      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="rounded border px-3 py-2"
        >
          <option value="">Select event</option>
          {(events.data ?? []).map((ev) => (
            <option key={String(ev._id)} value={String(ev._id)}>
              {ev.title}
            </option>
          ))}
        </select>
        {eventId && (
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as "7d" | "30d")}
            className="rounded border px-3 py-2"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        )}
      </div>

      {summary.error && (
        <p className="text-amber-700 text-sm mb-4">{summary.error.message}</p>
      )}

      {summary.data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <Stat label="Orders" value={summary.data.orderCount} />
            <Stat label="Revenue" value={`HK$${summary.data.revenue.toFixed(0)}`} />
            <Stat label="Tickets sold" value={summary.data.ticketsSold} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Sales trend">
              {trend.isLoading ? (
                <p className="text-sm text-slate-500">{t("common.loading")}</p>
              ) : (
                <SalesTrendChart data={trend.data ?? []} />
              )}
            </ChartCard>
            <ChartCard title="Revenue by ticket type">
              {byType.isLoading ? (
                <p className="text-sm text-slate-500">{t("common.loading")}</p>
              ) : (
                <TicketTypeChart data={byType.data ?? []} />
              )}
            </ChartCard>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <h2 className="mb-4 font-semibold text-slate-800">{title}</h2>
      {children}
    </div>
  );
}
