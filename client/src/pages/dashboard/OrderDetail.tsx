import { Link, useParams } from "wouter";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { eventTitle, formatEventDate, formatMoney } from "@/lib/eventText";
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

export function DashboardOrderDetail() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { t, i18n } = useTranslation();
  const utils = trpc.useUtils();
  const refund = trpc.order.refund.useMutation({
    onSuccess: () => utils.order.getOrganizerDetail.invalidate({ orderNumber: orderNumber! }),
  });
  const { data, isLoading, error, isFetched } = trpc.order.getOrganizerDetail.useQuery(
    { orderNumber: orderNumber! },
    { enabled: !!orderNumber }
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <OrderListSkeleton />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <p className="text-red-600">{error.message}</p>
        <Link href="/dashboard/orders" className="mt-2 inline-block text-wonder-primary underline">
          {t("orderDetail.backToOrders")}
        </Link>
      </DashboardLayout>
    );
  }

  if (isFetched && !data) {
    return (
      <DashboardLayout>
        <p className="text-slate-600">{t("order.notFound")}</p>
        <Link href="/dashboard/orders" className="mt-2 inline-block text-wonder-primary underline">
          {t("orderDetail.backToOrders")}
        </Link>
      </DashboardLayout>
    );
  }

  if (!data) return null;

  const { order, items, tickets, event, questionAnswers } = data;

  return (
    <DashboardLayout>
      <Link href="/dashboard/orders" className="text-sm text-wonder-primary underline mb-4 inline-block">
        ← {t("orderDetail.backToOrders")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">{t("orderDetail.title")}</h1>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            STATUS_STYLE[order.status] ?? "bg-slate-100 text-slate-600"
          }`}
        >
          {statusLabel(order.status, t)}
        </span>
      </div>

      <p className="font-mono text-lg text-slate-800 mb-4">{order.orderNumber}</p>

      {event && (
        <div className="rounded-xl border bg-white p-4 mb-4 text-sm">
          <p className="font-medium">{eventTitle(event, i18n.language)}</p>
          <p className="text-slate-500">{formatEventDate(event.eventDate, i18n.language)}</p>
          <p className="text-slate-500">{event.venue}</p>
        </div>
      )}

      <div className="rounded-xl border bg-white p-4 mb-4 text-sm space-y-2">
        <p>
          <span className="text-slate-500">{t("checkout.name")}:</span> {order.buyerName}
        </p>
        <p>
          <span className="text-slate-500">{t("checkout.email")}:</span> {order.buyerEmail}
        </p>
        {order.buyerPhone && (
          <p>
            <span className="text-slate-500">{t("checkout.phone")}:</span> {order.buyerPhone}
          </p>
        )}
        <p>
          <span className="text-slate-500">{t("checkout.total")}:</span>{" "}
          {formatMoney(order.totalAmount, order.currency ?? "HKD", i18n.language)}
        </p>
        {order.paidAt && (
          <p className="text-slate-500 text-xs">
            {t("orderDetail.paidAt")}: {new Date(order.paidAt).toLocaleString(i18n.language)}
          </p>
        )}
      </div>

      {items.length > 0 && (
        <section className="rounded-xl border bg-white p-4 mb-4">
          <h2 className="font-semibold mb-2 text-sm">{t("orderDetail.items")}</h2>
          <ul className="text-sm space-y-1">
            {items.map((item) => (
              <li key={String(item._id)} className="flex justify-between">
                <span>
                  {item.ticketTypeName} × {item.quantity}
                </span>
                <span>
                  {formatMoney(item.unitPrice * item.quantity, order.currency ?? "HKD", i18n.language)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tickets.length > 0 && (
        <section className="rounded-xl border bg-white p-4 mb-4">
          <h2 className="font-semibold mb-2 text-sm">{t("orderDetail.tickets")}</h2>
          <ul className="text-sm space-y-2">
            {tickets.map((tk) => (
              <li key={String(tk._id)} className="flex flex-wrap items-center justify-between gap-2 rounded border p-2">
                <span>{tk.ticketTypeName}</span>
                <span className="font-mono text-xs">{tk.ticketCode}</span>
                <span className="text-xs text-slate-500">{tk.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {questionAnswers.length > 0 && (
        <section className="rounded-xl border bg-white p-4 mb-4">
          <h2 className="font-semibold mb-2 text-sm">{t("orderDetail.registrationAnswers")}</h2>
          <dl className="text-sm space-y-2">
            {questionAnswers.map((a, i) => (
              <div key={i}>
                <dt className="text-slate-500">{a.question}</dt>
                <dd className="mt-0.5">{a.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <Link href={`/order/${order.orderNumber}`} className="text-sm text-wonder-primary underline">
        {t("orderDetail.publicView")}
      </Link>

      {order.status === "paid" && (
        <button
          type="button"
          disabled={refund.isPending}
          onClick={() => {
            if (window.confirm(t("orderDetail.refundConfirm"))) {
              refund.mutate({ orderNumber: order.orderNumber });
            }
          }}
          className="mt-4 block rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          {refund.isPending ? t("common.loading") : t("orderDetail.refund")}
        </button>
      )}
      {refund.isSuccess && (
        <p className="mt-2 text-sm text-green-700">{t("orderDetail.refundDone")}</p>
      )}
      {refund.error && <p className="mt-2 text-sm text-red-600">{refund.error.message}</p>}
    </DashboardLayout>
  );
}
