import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { formatMoney } from "@/lib/eventText";
import { DashboardLayout } from "./DashboardLayout";
import { QrScanner } from "@/components/QrScanner";
import { NumberInput } from "@/components/NumberInput";

export function DashboardCheckIn() {
  const { t, i18n } = useTranslation();
  const events = trpc.event.listMine.useQuery();
  const [eventId, setEventId] = useState("");
  const [code, setCode] = useState("");
  const [tab, setTab] = useState<"scan" | "walkin">("scan");
  const checkIn = trpc.ticket.checkIn.useMutation({
    onSuccess: () => setCode(""),
  });

  const types = trpc.event.getTicketTypes.useQuery({ eventId }, { enabled: !!eventId });
  const [walkName, setWalkName] = useState("");
  const [walkEmail, setWalkEmail] = useState("");
  const [walkPhone, setWalkPhone] = useState("");
  const [walkNote, setWalkNote] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [walkInResult, setWalkInResult] = useState<{
    orderNumber: string;
    tickets: { ticketCode: string; ticketTypeName: string }[];
  } | null>(null);

  const walkIn = trpc.order.walkInCheckout.useMutation({
    onSuccess: (res) => {
      setWalkInResult({
        orderNumber: res.orderNumber,
        tickets: (res.tickets ?? []).map((tk) => ({
          ticketCode: tk.ticketCode,
          ticketTypeName: tk.ticketTypeName,
        })),
      });
      if (res.tickets?.[0]?.ticketCode) {
        setCode(res.tickets[0].ticketCode);
        setTab("scan");
      }
      setWalkName("");
      setWalkEmail("");
      setWalkPhone("");
      setWalkNote("");
      setQty({});
    },
  });

  const walkInItems = Object.entries(qty)
    .filter(([, n]) => n > 0)
    .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">{t("dashboard.checkIn")}</h1>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setTab("scan")}
          className={`rounded-lg px-4 py-2 text-sm ${tab === "scan" ? "bg-wonder-primary text-white" : "border"}`}
        >
          {t("checkin.scan")}
        </button>
        <button
          type="button"
          onClick={() => setTab("walkin")}
          className={`rounded-lg px-4 py-2 text-sm ${tab === "walkin" ? "bg-wonder-primary text-white" : "border"}`}
        >
          {t("walkin.title")}
        </button>
      </div>

      <select
        value={eventId}
        onChange={(e) => {
          setEventId(e.target.value);
          setWalkInResult(null);
          checkIn.reset();
        }}
        className="mb-4 w-full max-w-md rounded border px-3 py-2"
      >
        <option value="">{t("checkin.selectEvent")}</option>
        {(events.data ?? []).map((ev) => (
          <option key={String(ev._id)} value={String(ev._id)}>
            {ev.title}
          </option>
        ))}
      </select>

      {tab === "scan" && (
        <div className="max-w-md space-y-4">
          {eventId && (
            <QrScanner
              onScan={(scanned) => {
                setCode(scanned);
                checkIn.mutate({ ticketCode: scanned, eventId });
              }}
            />
          )}
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={t("checkin.ticketCode")}
              className="flex-1 rounded border px-3 py-2 font-mono"
            />
            <button
              type="button"
              disabled={!code || !eventId || checkIn.isPending}
              onClick={() => checkIn.mutate({ ticketCode: code, eventId })}
              className="rounded-lg bg-wonder-primary px-4 text-white disabled:opacity-50"
            >
              OK
            </button>
          </div>
          {checkIn.data && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
              <p className="font-semibold">✓ {t("checkin.success")}</p>
              <p>{checkIn.data.ticket.ticketTypeName}</p>
              <p className="font-mono">{checkIn.data.ticket.ticketCode}</p>
              {checkIn.data.ticket.holderName && <p>{checkIn.data.ticket.holderName}</p>}
            </div>
          )}
          {checkIn.error && <p className="text-red-600 text-sm">{checkIn.error.message}</p>}
        </div>
      )}

      {tab === "walkin" && eventId && (
        <form
          className="max-w-md space-y-3 rounded-xl border bg-white p-4"
          onSubmit={(e) => {
            e.preventDefault();
            setWalkInResult(null);
            walkIn.mutate({
              eventId,
              buyerName: walkName,
              buyerEmail: walkEmail,
              buyerPhone: walkPhone,
              items: walkInItems,
              walkInNote: walkNote || undefined,
            });
          }}
        >
          <p className="text-sm text-slate-600">{t("walkin.hint")}</p>
          <input
            required
            value={walkName}
            onChange={(e) => setWalkName(e.target.value)}
            placeholder={t("checkout.name")}
            className="w-full rounded border px-3 py-2"
          />
          <input
            type="email"
            required
            value={walkEmail}
            onChange={(e) => setWalkEmail(e.target.value)}
            placeholder={t("checkout.email")}
            className="w-full rounded border px-3 py-2"
          />
          <input
            required
            value={walkPhone}
            onChange={(e) => setWalkPhone(e.target.value)}
            placeholder={t("checkout.phone")}
            className="w-full rounded border px-3 py-2"
          />
          <textarea
            value={walkNote}
            onChange={(e) => setWalkNote(e.target.value)}
            placeholder={t("walkin.note")}
            className="w-full rounded border px-3 py-2 text-sm"
            rows={2}
          />
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("walkin.tickets")}</p>
            {(types.data ?? []).map((tt) => (
              <label key={String(tt._id)} className="flex items-center justify-between text-sm">
                <span>
                  {tt.name} · {formatMoney(tt.price, "HKD", i18n.language)}
                </span>
                <NumberInput
                  min={0}
                  max={Math.max(0, (tt.quantity ?? 0) - (tt.sold ?? 0))}
                  value={qty[String(tt._id)] ?? 0}
                  onChange={(n) =>
                    setQty((q) => ({ ...q, [String(tt._id)]: n }))
                  }
                  className="w-16 rounded border px-2 py-1 text-right"
                />
              </label>
            ))}
          </div>
          {walkIn.error && <p className="text-sm text-red-600">{walkIn.error.message}</p>}
          <button
            type="submit"
            disabled={!walkInItems.length || walkIn.isPending}
            className="w-full rounded-lg bg-wonder-primary py-2 text-white disabled:opacity-50"
          >
            {t("walkin.submit")}
          </button>
        </form>
      )}

      {walkInResult && (
        <div className="mt-4 max-w-md rounded-xl border border-green-200 bg-green-50 p-4 text-sm">
          <p className="font-medium text-green-800">{t("walkin.success")}</p>
          <p className="font-mono text-xs text-slate-600">{walkInResult.orderNumber}</p>
          <ul className="mt-2 space-y-1">
            {walkInResult.tickets.map((tk) => (
              <li key={tk.ticketCode} className="font-mono">
                {tk.ticketTypeName}: {tk.ticketCode}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-500">{t("walkin.checkInHint")}</p>
        </div>
      )}
    </DashboardLayout>
  );
}
