import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { DashboardLayout } from "./DashboardLayout";

function defaultEventDate() {
  const d = new Date(Date.now() + 7 * 86400000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T19:00`;
}

export function EventForm() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const create = trpc.event.create.useMutation({
    onSuccess: (res) => navigate(`/dashboard/events/${res.id}/edit`),
  });

  const [title, setTitle] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [venue, setVenue] = useState("Hong Kong");
  const [eventDate, setEventDate] = useState(defaultEventDate);

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-2">{t("dashboard.newEvent")}</h1>
      <p className="mb-4 text-sm text-slate-500">{t("eventEdit.createHint")}</p>
      <form
        className="max-w-md space-y-4 rounded-xl border bg-white p-6"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate({
            title,
            titleEn: titleEn || undefined,
            venue,
            eventDate: new Date(eventDate),
            visibility: "public",
          });
        }}
      >
        <label className="block text-sm">
          標題（中）
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
        </label>
        <label className="block text-sm">
          Title (EN)
          <input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
        </label>
        <label className="block text-sm">
          {t("event.venue")}
          <input required value={venue} onChange={(e) => setVenue(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
        </label>
        <label className="block text-sm">
          {t("event.date")}
          <input
            type="datetime-local"
            required
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </label>
        {create.error && (
          <p className="text-sm text-red-600">{create.error.message || t("common.error")}</p>
        )}
        <button type="submit" className="w-full rounded-lg bg-wonder-primary py-2 text-white" disabled={create.isPending}>
          {create.isPending ? t("common.loading") : t("common.save")}
        </button>
      </form>
    </DashboardLayout>
  );
}
