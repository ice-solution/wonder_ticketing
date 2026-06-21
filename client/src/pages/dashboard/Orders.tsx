import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { formatMoney } from "@/lib/eventText";
import { DashboardLayout } from "./DashboardLayout";
import { OrderListSkeleton } from "@/components/loading/SaasLoading";

const STATUS_STYLE: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
  cancelled: "bg-slate-100 text-slate-600",
  refunded: "bg-red-100 text-red-700",
};

function statusLabel(status: string, t: (k: string) => string) {
  if (status === "paid") return t("orders.statusPaid");
  if (status === "pending") return t("orders.statusPending");
  if (status === "cancelled") return t("orders.statusCancelled");
  if (status === "refunded") return t("orders.statusRefunded");
  return status;
}

export function DashboardOrders() {
  const { t, i18n } = useTranslation();
  const events = trpc.event.listMine.useQuery();
  const [eventId, setEventId] = useState("");
  const orders = trpc.order.listMine.useQuery(
    { eventId: eventId || undefined },
    { enabled: !!events.data }
  );
  const utils = trpc.useUtils();

  const summary = useMemo(() => {
    const list = orders.data ?? [];
    return { count: list.length, paid: list.filter((o) => o.status === "paid").length };
  }, [orders.data]);

  const downloadCsv = async () => {
    if (!eventId) return;
    const res = await utils.order.exportCSV.fetch({ eventId });
    const blob = new Blob([res.csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "attendees.csv";
    a.click();
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">{t("dashboard.orders")}</h1>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm text-slate-600">
          {t("orders.filterByEvent")}
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="mt-1 block rounded-lg border px-3 py-2 text-sm min-w-[200px]"
          >
            <option value="">{t("orders.allEvents")}</option>
            {(events.data ?? []).map((ev) => (
              <option key={String(ev._id)} value={String(ev._id)}>
                {ev.title}
              </option>
            ))}
          </select>
        </label>
        {eventId && (
          <button
            type="button"
            onClick={downloadCsv}
            className="mt-5 rounded-lg border border-wonder-primary px-3 py-2 text-sm text-wonder-primary hover:bg-wonder-bg"
          >
            {t("orders.exportCsv")}
          </button>
        )}
      </div>

      {!orders.isLoading && orders.data && orders.data.length > 0 && (
        <p className="mb-3 text-sm text-slate-500">
          {t("orders.summary", { count: summary.count, paid: summary.paid })}
        </p>
      )}

      {orders.isLoading && <OrderListSkeleton />}

      {!orders.isLoading && (orders.data ?? []).length === 0 && (
        <div className="rounded-xl border bg-slate-50 p-8 text-center text-slate-500">
          {t("orders.empty")}
        </div>
      )}

      <ul className="space-y-2">
        {!orders.isLoading &&
          (orders.data ?? []).map((o) => (
            <li
              key={String(o._id)}
              className="rounded-xl border bg-white p-4 text-sm flex flex-wrap items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="font-mono font-medium text-slate-800">{o.orderNumber}</p>
                <p className="text-slate-600 mt-0.5">
                  {o.buyerName} · {o.buyerEmail}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {o.createdAt ? new Date(o.createdAt).toLocaleString(i18n.language) : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    STATUS_STYLE[o.status] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  {statusLabel(o.status, t)}
                </span>
                <span className="font-semibold text-wonder-primary">
                  {formatMoney(o.totalAmount, o.currency ?? "HKD", i18n.language)}
                </span>
                <Link
                  href={`/dashboard/orders/${o.orderNumber}`}
                  className="text-wonder-primary underline text-xs"
                >
                  {t("orders.viewOrder")}
                </Link>
              </div>
            </li>
          ))}
      </ul>
    </DashboardLayout>
  );
}
