import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { eventTitle, formatEventDate } from "@/lib/eventText";
import { EventBanner } from "@/components/EventBanner";
import { EventCategoryBrowse } from "@/components/EventCategoryBrowse";
import { EventRegionBrowse } from "@/components/EventRegionBrowse";
import type { EventCategorySlug, EventCitySlug, EventRegionSlug } from "@shared/eventBrowse";

export function Home() {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<EventCategorySlug | null>(null);
  const [region, setRegion] = useState<EventRegionSlug>("asia_pacific");
  const [city, setCity] = useState<EventCitySlug | null>(null);

  const { data: facets } = trpc.event.browseFacets.useQuery();

  const { data, isLoading, isError, refetch } = trpc.event.listPublished.useQuery({
    limit: 20,
    search: query || undefined,
    category: category ?? undefined,
    city: city ?? undefined,
  });

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of facets?.categories ?? []) {
      map[row.slug] = row.count;
    }
    return map;
  }, [facets]);

  const hasActiveFilter = !!(category || city || query);

  const clearFilters = () => {
    setCategory(null);
    setCity(null);
    setQuery("");
    setSearch("");
  };

  if (isLoading && !data) {
    return (
      <div className="events-page">
        <p className="events-loading">{t("common.loading")}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="events-page">
        <div className="events-empty events-empty--error">
          <p>{t("home.apiError")}</p>
          <p className="events-empty-hint">{t("home.apiErrorHint")}</p>
          <button type="button" onClick={() => refetch()} className="events-search-btn">
            {t("common.retry")}
          </button>
        </div>
      </div>
    );
  }

  const items = data?.items ?? [];

  return (
    <div className="events-page">
      <header className="events-hero">
        <p className="events-kicker mono">{t("appName")}</p>
        <h1>{t("home.title")}</h1>
        <form
          className="events-search"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search.trim());
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("home.search")}
            className="events-search-input"
          />
          <button type="submit" className="events-search-btn">
            {t("home.searchBtn")}
          </button>
        </form>
      </header>

      {facets && (
        <>
          <EventCategoryBrowse
            counts={categoryCounts}
            selected={category}
            onSelect={setCategory}
          />
          <EventRegionBrowse
            cities={facets.cities}
            regions={facets.regions}
            activeRegion={region}
            selectedCity={city}
            onRegionChange={(r) => {
              setRegion(r);
              setCity(null);
            }}
            onCitySelect={setCity}
          />
        </>
      )}

      <section className="events-list-section">
        <div className="events-list-header">
          <h2 className="events-browse-title">{t("home.upcomingEvents")}</h2>
          {hasActiveFilter && (
            <button type="button" className="events-clear-filters" onClick={clearFilters}>
              {t("home.clearFilters")}
            </button>
          )}
        </div>
        {hasActiveFilter && (
          <div className="events-active-filters">
            {query && <span className="events-filter-chip">「{query}」</span>}
            {category && (
              <span className="events-filter-chip">{t(`eventCategory.${category}`)}</span>
            )}
            {city && <span className="events-filter-chip">{t(`eventCity.${city}`)}</span>}
          </div>
        )}

        {isLoading ? (
          <p className="events-loading">{t("common.loading")}</p>
        ) : !items.length ? (
          <div className="events-empty">
            <p>{hasActiveFilter ? t("home.noResults") : t("home.empty")}</p>
            {!hasActiveFilter && (
              <>
                <p className="events-empty-hint">{t("home.emptyHint")}</p>
                <Link href="/login" className="events-empty-link">
                  {t("nav.login")}
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="events-grid">
            {items.map((ev) => (
              <Link key={String(ev._id)} href={`/event/${ev.slug}`} className="event-card">
                <div className="event-card-banner">
                  <EventBanner url={ev.bannerUrl} title={eventTitle(ev, i18n.language)} variant="card" />
                </div>
                <div className="event-card-body">
                  <div className="event-card-badges">
                    {ev.isFeatured && (
                      <span className="event-badge event-badge--featured">{t("home.featured")}</span>
                    )}
                    {ev.category && (
                      <span className="event-badge event-badge--category">
                        {t(`eventCategory.${ev.category}`, { defaultValue: ev.category })}
                      </span>
                    )}
                    {ev.visibility === "members_only" && (
                      <span className="event-badge event-badge--members">{t("event.membersOnly")}</span>
                    )}
                  </div>
                  <h2>{eventTitle(ev, i18n.language)}</h2>
                  <p className="event-card-meta">{formatEventDate(ev.eventDate, i18n.language)}</p>
                  <p className="event-card-venue">
                    {ev.city ? t(`eventCity.${ev.city}`, { defaultValue: ev.city }) : ev.venue}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
