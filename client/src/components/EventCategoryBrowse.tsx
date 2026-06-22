import { useTranslation } from "react-i18next";
import {
  CATEGORY_ICONS,
  EVENT_CATEGORY_SLUGS,
  type EventCategorySlug,
} from "@shared/eventBrowse";

type Props = {
  counts: Record<string, number>;
  selected?: string | null;
  onSelect: (slug: EventCategorySlug | null) => void;
};

export function EventCategoryBrowse({ counts, selected, onSelect }: Props) {
  const { t } = useTranslation();

  return (
    <section className="events-browse-section">
      <h2 className="events-browse-title">{t("home.browseByCategory")}</h2>
      <div className="events-category-grid">
        {EVENT_CATEGORY_SLUGS.filter((s) => s !== "other").map((slug) => {
          const count = counts[slug] ?? 0;
          const active = selected === slug;
          return (
            <button
              key={slug}
              type="button"
              className={`events-category-card${active ? " is-active" : ""}`}
              onClick={() => onSelect(active ? null : slug)}
            >
              <span className="events-category-icon" aria-hidden>
                {CATEGORY_ICONS[slug]}
              </span>
              <span className="events-category-text">
                <span className="events-category-name">{t(`eventCategory.${slug}`)}</span>
                <span className="events-category-count">
                  {t("home.eventCount", { count })}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
