import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { DashboardLayout } from "./DashboardLayout";
import { SeatMapEditor } from "@/components/SeatMapEditor";

export function DashboardSeats() {
  const { t } = useTranslation();
  const events = trpc.event.listMine.useQuery();
  const [eventId, setEventId] = useState("");

  const map = trpc.seat.getMap.useQuery({ eventId }, { enabled: !!eventId });

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-2">{t("seatEditor.pageTitle")}</h1>
      <p className="text-sm text-slate-500 mb-4">{t("seatEditor.pageHint")}</p>

      <label className="block text-sm mb-4 max-w-md">
        {t("seatEditor.selectEvent")}
        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="mt-1 block w-full rounded border px-3 py-2"
        >
          <option value="">{t("seatEditor.selectPlaceholder")}</option>
          {(events.data ?? []).map((ev) => (
            <option key={String(ev._id)} value={String(ev._id)}>
              {ev.title}
            </option>
          ))}
        </select>
      </label>

      {eventId && (
        <>
          <p className="text-sm text-slate-600 mb-2">
            {t("seatEditor.liveStats", {
              total: map.data?.seats.length ?? 0,
              available: map.data?.available ?? 0,
            })}
          </p>
          <SeatMapEditor eventId={eventId} />
          <p className="mt-4 text-sm">
            <Link href={`/dashboard/events/${eventId}/edit`} className="text-wonder-accent underline">
              {t("seatEditor.backToEvent")}
            </Link>
          </p>
        </>
      )}
    </DashboardLayout>
  );
}
