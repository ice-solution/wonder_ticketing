import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { SurveyForm } from "@/components/SurveyForm";
import { eventTitle, formatEventDate, formatMoney } from "@/lib/eventText";
import { TicketQrCode } from "@/components/TicketQrCode";
import { OrderSkeleton } from "@/components/loading/SaasLoading";

export function OrderConfirmation() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { t, i18n } = useTranslation();
  const { data, refetch, isFetched } = trpc.order.getByNumber.useQuery(
    { orderNumber: orderNumber! },
    { enabled: !!orderNumber, refetchInterval: (q) => (q.state.data?.order.status === "paid" ? false : 3000) }
  );

  useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => {
      if (Date.now() - started > 5 * 60 * 1000) clearInterval(id);
      else void refetch();
    }, 3000);
    return () => clearInterval(id);
  }, [refetch]);

  if (!data && !isFetched) return <OrderSkeleton />;

  if (isFetched && !data) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border bg-white p-6 text-center">
        <p className="text-slate-600">{t("order.notFound")}</p>
        <Link href="/events" className="mt-4 inline-block text-wonder-primary underline">
          {t("nav.home")}
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const paid = data.order.status === "paid";

  return (
    <div className="mx-auto max-w-lg rounded-xl border bg-white p-6">
      <h1 className="text-2xl font-bold">{t("order.title")}</h1>
      <p className="mt-2 font-mono text-sm">{data.order.orderNumber}</p>

      {data.event && (
        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
          <p className="font-medium">{eventTitle(data.event, i18n.language)}</p>
          <p className="text-slate-500">{formatEventDate(data.event.eventDate, i18n.language)}</p>
          <p className="text-slate-500">{data.event.venue}</p>
        </div>
      )}

      <p className="mt-4 text-sm text-slate-600">
        {t("checkout.total")}: {formatMoney(data.order.totalAmount, data.order.currency ?? "HKD", i18n.language)}
      </p>

      <p className={`mt-2 text-lg ${paid ? "text-green-700" : "text-amber-700"}`}>
        {paid ? t("order.paid") : t("order.pending")}
      </p>

      {paid && data.tickets.length > 0 && (
        <ul className="mt-4 space-y-2">
          {data.tickets.map((tk) => (
            <li key={String(tk._id)} className="rounded border p-3 text-sm">
              <p className="font-medium">{tk.ticketTypeName}</p>
              <div className="mt-2 flex flex-wrap items-start gap-4">
                <TicketQrCode value={tk.ticketCode} size={120} />
                <div>
                  <p className="font-mono text-sm tracking-wide text-slate-800">{tk.ticketCode}</p>
                  <p className="text-xs text-slate-400">{t("checkin.ticketCode")}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {paid && (
        <div className="mt-4 rounded-lg border border-dashed p-3 text-sm text-slate-600">
          <p>{t("order.ticketHint", { email: data.order.buyerEmail })}</p>
          <Link href="/login?redirect=%2Fmy-tickets" className="mt-2 inline-block text-wonder-primary underline">
            {t("order.viewTickets")}
          </Link>
        </div>
      )}

      {paid && data.event && (
        <SurveyForm eventId={String(data.event._id)} respondentEmail={data.order.buyerEmail} />
      )}

      <button type="button" onClick={() => refetch()} className="mt-4 text-sm text-wonder-primary underline">
        {t("order.refresh")}
      </button>
    </div>
  );
}
