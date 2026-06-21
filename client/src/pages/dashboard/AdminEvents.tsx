import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "./AdminLayout";
import { AdminPagination, ADMIN_DEFAULT_PAGE_SIZE } from "@/components/AdminPagination";
import { eventTitle, formatEventDate } from "@/lib/eventText";

export function AdminEventsPage() {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(ADMIN_DEFAULT_PAGE_SIZE);
  const utils = trpc.useUtils();

  useEffect(() => {
    setPage(1);
  }, [query, featuredOnly, limit]);

  const { data, isLoading } = trpc.admin.listEvents.useQuery({
    search: query || undefined,
    featuredOnly,
    page,
    limit,
  });

  const setFeatured = trpc.admin.setFeatured.useMutation({
    onSuccess: () => {
      void utils.admin.listEvents.invalidate();
      void utils.admin.stats.invalidate();
    },
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <AdminLayout>
      <div className="rounded-xl border bg-white p-4">
        <h2 className="font-semibold mb-3">{t("admin.featuredTitle")}</h2>
        <p className="text-sm text-slate-500 mb-4">{t("admin.featuredHint")}</p>

        <div className="flex flex-wrap gap-3 mb-4">
          <form
            className="flex gap-2 flex-1 min-w-[200px]"
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(search.trim());
            }}
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("admin.searchEvents")}
              className="flex-1 rounded border px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-lg bg-wonder-primary px-3 py-2 text-sm text-white">
              {t("home.searchBtn")}
            </button>
          </form>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={featuredOnly}
              onChange={(e) => setFeaturedOnly(e.target.checked)}
            />
            {t("admin.featuredOnly")}
          </label>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500">{t("common.loading")}</p>
        ) : !items.length ? (
          <p className="text-sm text-slate-500">{t("admin.noEvents")}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="py-2 pr-3">{t("admin.colEvent")}</th>
                    <th className="py-2 pr-3">{t("admin.colOrganizer")}</th>
                    <th className="py-2 pr-3">{t("admin.colStatus")}</th>
                    <th className="py-2 pr-3">{t("admin.colFeatured")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((ev) => {
                    const organizer = ev.createdBy as { name?: string; email?: string } | null;
                    return (
                      <tr key={String(ev._id)} className="border-b last:border-0">
                        <td className="py-3 pr-3">
                          <p className="font-medium">{eventTitle(ev, i18n.language)}</p>
                          <p className="text-xs text-slate-400">
                            {formatEventDate(ev.eventDate, i18n.language)}
                          </p>
                          <Link href={`/event/${ev.slug}`} className="text-xs text-wonder-accent underline">
                            /{ev.slug}
                          </Link>
                        </td>
                        <td className="py-3 pr-3 text-slate-600">
                          {organizer?.name ?? "—"}
                          <br />
                          <span className="text-xs text-slate-400">{organizer?.email ?? ""}</span>
                        </td>
                        <td className="py-3 pr-3">
                          <span className="rounded-full border px-2 py-0.5 text-xs uppercase">{ev.status}</span>
                        </td>
                        <td className="py-3 pr-3">
                          <button
                            type="button"
                            disabled={setFeatured.isPending || ev.status !== "published"}
                            onClick={() =>
                              setFeatured.mutate({
                                eventId: String(ev._id),
                                featured: !ev.isFeatured,
                              })
                            }
                            className={`rounded-lg px-3 py-1 text-xs font-medium ${
                              ev.isFeatured
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "border text-slate-600 hover:bg-slate-50"
                            } disabled:opacity-40`}
                          >
                            {ev.isFeatured ? t("admin.unfeature") : t("admin.feature")}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <AdminPagination
              page={page}
              limit={limit}
              total={total}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
