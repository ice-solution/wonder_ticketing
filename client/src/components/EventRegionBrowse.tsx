import { useTranslation } from "react-i18next";
import {
  CITY_ICONS,
  citiesForRegion,
  EVENT_REGION_SLUGS,
  type EventCitySlug,
  type EventRegionSlug,
} from "@shared/eventBrowse";

type CityRow = { slug: string; region: string | null; count: number };

type Props = {
  cities: CityRow[];
  regions: { slug: string; count: number }[];
  activeRegion: EventRegionSlug;
  selectedCity?: string | null;
  onRegionChange: (region: EventRegionSlug) => void;
  onCitySelect: (city: EventCitySlug | null) => void;
};

export function EventRegionBrowse({
  cities,
  regions,
  activeRegion,
  selectedCity,
  onRegionChange,
  onCitySelect,
}: Props) {
  const { t } = useTranslation();
  const cityMap = new Map(cities.map((c) => [c.slug, c.count]));
  const regionCities = citiesForRegion(activeRegion);

  return (
    <section className="events-browse-section">
      <h2 className="events-browse-title">{t("home.browseByRegion")}</h2>
      <div className="events-region-tabs" role="tablist">
        {EVENT_REGION_SLUGS.map((slug) => {
          const count = regions.find((r) => r.slug === slug)?.count ?? 0;
          const active = activeRegion === slug;
          return (
            <button
              key={slug}
              type="button"
              role="tab"
              aria-selected={active}
              className={`events-region-tab${active ? " is-active" : ""}`}
              onClick={() => onRegionChange(slug)}
            >
              {t(`eventRegion.${slug}`)}
              {count > 0 && <span className="events-region-tab-count">{count}</span>}
            </button>
          );
        })}
      </div>
      <div className="events-city-grid">
        {regionCities.map((slug) => {
          const count = cityMap.get(slug) ?? 0;
          const active = selectedCity === slug;
          return (
            <button
              key={slug}
              type="button"
              className={`events-city-card${active ? " is-active" : ""}`}
              onClick={() => onCitySelect(active ? null : slug)}
            >
              <span className="events-city-icon" aria-hidden>
                {CITY_ICONS[slug]}
              </span>
              <span className="events-city-name">{t(`eventCity.${slug}`)}</span>
              <span className="events-city-count">{t("home.eventCount", { count })}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
