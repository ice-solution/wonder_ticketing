import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { formatEventDate } from "@/lib/eventText";
import { RequireAuth } from "@/components/RequireAuth";
import { TicketQrCode } from "@/components/TicketQrCode";
import { TicketListSkeleton } from "@/components/loading/SaasLoading";

function MyTicketsContent() {
  const { t, i18n } = useTranslation();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.ticket.myTickets.useQuery();
  const transfer = trpc.ticket.transfer.useMutation({
    onSuccess: () => utils.ticket.myTickets.invalidate(),
  });
  const [transferId, setTransferId] = useState<string | null>(null);
  const [toEmail, setToEmail] = useState("");

  if (isLoading) return <TicketListSkeleton />;

  const tickets = data ?? [];
  if (!tickets.length) {
    return (
      <div className="py-8 text-center">
        <p className="text-slate-500 mb-2">{t("myTickets.empty")}</p>
        <Link href="/events" className="text-wonder-primary underline">
          {t("nav.home")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("nav.myTickets")}</h1>
      <ul className="space-y-3">
        {tickets.map((tk) => (
          <li key={String(tk._id)} className="rounded-xl border bg-white p-4">
            {tk.eventTitle && (
              <div className="mb-2 border-b pb-2">
                <Link href={tk.eventSlug ? `/event/${tk.eventSlug}` : "/events"} className="font-semibold text-wonder-primary hover:underline">
                  {tk.eventTitle}
                </Link>
                {tk.eventDate && (
                  <p className="text-xs text-slate-500">{formatEventDate(tk.eventDate, i18n.language)}</p>
                )}
                {tk.eventVenue && <p className="text-xs text-slate-400">{tk.eventVenue}</p>}
              </div>
            )}
            <p className="font-medium">{tk.ticketTypeName}</p>
            <div className="mt-2 flex flex-wrap items-start gap-4">
              <TicketQrCode value={tk.ticketCode} size={120} />
              <div>
                <p className="font-mono text-sm tracking-wide text-slate-800">{tk.ticketCode}</p>
                <p className="text-xs text-slate-400">{t("checkin.ticketCode")}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {tk.checkedInAt
                ? `${t("ticket.checkedIn")} ${formatEventDate(tk.checkedInAt, i18n.language)}`
                : tk.status}
            </p>
            {tk.status === "valid" && !tk.checkedInAt && (
              <div className="mt-3">
                {transferId === String(tk._id) ? (
                  <form
                    className="flex flex-wrap gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      transfer.mutate(
                        { ticketId: String(tk._id), toEmail },
                        { onSuccess: () => { setTransferId(null); setToEmail(""); } }
                      );
                    }}
                  >
                    <input
                      type="email"
                      required
                      value={toEmail}
                      onChange={(e) => setToEmail(e.target.value)}
                      placeholder={t("ticket.transferEmail")}
                      className="flex-1 min-w-[12rem] rounded border px-2 py-1 text-sm"
                    />
                    <button type="submit" disabled={transfer.isPending} className="text-sm text-wonder-primary">
                      {t("ticket.transfer")}
                    </button>
                    <button type="button" onClick={() => setTransferId(null)} className="text-sm text-slate-500">
                      {t("common.cancel")}
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTransferId(String(tk._id))}
                    className="text-sm text-wonder-primary"
                  >
                    {t("ticket.transfer")}
                  </button>
                )}
                {transfer.error && transferId === String(tk._id) && (
                  <p className="text-xs text-red-600 mt-1">{transfer.error.message}</p>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MyTickets() {
  return (
    <RequireAuth>
      <MyTicketsContent />
    </RequireAuth>
  );
}
