import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { eventTitle, formatEventDate } from "@/lib/eventText";
import { EventBanner } from "@/components/EventBanner";

export function Home() {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const { data, isLoading, isError, refetch } = trpc.event.listPublished.useQuery({
    limit: 20,
    search: query || undefined,
  });

  if (isLoading) {
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

      {!items.length ? (
        <div className="events-empty">
          <p>{query ? t("home.noResults") : t("home.empty")}</p>
          {!query && (
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
                  {ev.visibility === "members_only" && (
                    <span className="event-badge event-badge--members">{t("event.membersOnly")}</span>
                  )}
                </div>
                <h2>{eventTitle(ev, i18n.language)}</h2>
                <p className="event-card-meta">{formatEventDate(ev.eventDate, i18n.language)}</p>
                <p className="event-card-venue">{ev.venue}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
