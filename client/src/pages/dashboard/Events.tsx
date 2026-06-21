import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { formatEventDate } from "@/lib/eventText";
import { DashboardLayout } from "./DashboardLayout";

export function DashboardEvents() {
  const { t, i18n } = useTranslation();
  const { data, refetch, isLoading, isError } = trpc.event.listMine.useQuery();
  const update = trpc.event.update.useMutation({ onSuccess: () => refetch() });

  const events = data ?? [];

  return (
    <DashboardLayout>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">{t("dashboard.events")}</h1>
        <Link
          href="/dashboard/events/new"
          className="rounded-lg bg-wonder-primary px-4 py-2 text-sm text-white"
        >
          {t("dashboard.newEvent")}
        </Link>
      </div>

      {isLoading && <p className="text-slate-500">{t("common.loading")}</p>}
      {isError && <p className="text-red-600">{t("home.apiError")}</p>}

      {!isLoading && !isError && events.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-slate-600 mb-2">{t("dashboard.emptyEvents")}</p>
          <p className="text-sm text-slate-500 mb-4">{t("eventEdit.createHint")}</p>
          <Link href="/dashboard/events/new" className="text-wonder-primary underline">
            {t("dashboard.newEvent")}
          </Link>
        </div>
      )}

      <ul className="space-y-2">
        {events.map((ev) => (
          <li key={String(ev._id)} className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4">
            {ev.bannerUrl ? (
              <img src={ev.bannerUrl} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                —
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium">{ev.title}</p>
              <p className="text-sm text-slate-500">
                {formatEventDate(ev.eventDate, i18n.language)} ·{" "}
                <span className={ev.status === "published" ? "text-green-700" : "text-amber-700"}>
                  {ev.status === "published" ? t("eventEdit.statusPublished") : t("eventEdit.statusDraft")}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              {ev.status === "draft" && (
                <button
                  type="button"
                  onClick={() => update.mutate({ id: String(ev._id), status: "published" })}
                  disabled={update.isPending}
                  className="rounded bg-green-600 px-2 py-1 text-white"
                >
                  {t("eventEdit.publish")}
                </button>
              )}
              <Link href={`/dashboard/events/${ev._id}/edit`} className="text-wonder-primary underline">
                {t("eventEdit.manage")}
              </Link>
              <Link href={`/event/${ev.slug}`} className="text-slate-500 underline">
                {t("eventEdit.preview")}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </DashboardLayout>
  );
}
