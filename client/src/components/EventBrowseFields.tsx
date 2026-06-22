import { useTranslation } from "react-i18next";
import {
  CITY_REGION,
  EVENT_CATEGORY_SLUGS,
  EVENT_CITY_SLUGS,
  EVENT_REGION_SLUGS,
  type EventCitySlug,
  type EventRegionSlug,
} from "@shared/eventBrowse";

type Props = {
  category: string;
  region: string;
  city: string;
  onCategoryChange: (v: string) => void;
  onRegionChange: (v: EventRegionSlug) => void;
  onCityChange: (v: EventCitySlug) => void;
};

export function EventBrowseFields({
  category,
  region,
  city,
  onCategoryChange,
  onRegionChange,
  onCityChange,
}: Props) {
  const { t } = useTranslation();
  const cities = EVENT_CITY_SLUGS.filter((c) => CITY_REGION[c] === region);

  return (
    <fieldset className="rounded border p-3 space-y-3 text-sm">
      <legend className="px-1 font-medium">{t("eventEdit.browseFields")}</legend>
      <label className="block">
        {t("eventEdit.category")}
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="mt-1 w-full border rounded px-2 py-1.5"
        >
          <option value="">{t("common.optional")}</option>
          {EVENT_CATEGORY_SLUGS.map((slug) => (
            <option key={slug} value={slug}>
              {t(`eventCategory.${slug}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        {t("eventEdit.region")}
        <select
          value={region}
          onChange={(e) => {
            const next = e.target.value as EventRegionSlug;
            onRegionChange(next);
            if (city && CITY_REGION[city as EventCitySlug] !== next) {
              onCityChange("hong_kong");
            }
          }}
          className="mt-1 w-full border rounded px-2 py-1.5"
        >
          {EVENT_REGION_SLUGS.map((slug) => (
            <option key={slug} value={slug}>
              {t(`eventRegion.${slug}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        {t("eventEdit.city")}
        <select
          value={city}
          onChange={(e) => onCityChange(e.target.value as EventCitySlug)}
          className="mt-1 w-full border rounded px-2 py-1.5"
        >
          {cities.map((slug) => (
            <option key={slug} value={slug}>
              {t(`eventCity.${slug}`)}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  );
}
