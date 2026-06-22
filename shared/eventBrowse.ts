/** 公開活動列表：類別與地區瀏覽（slug 存 DB，label 由 i18n 顯示） */

export const EVENT_CATEGORY_SLUGS = [
  "technology",
  "food_drink",
  "ai",
  "arts_culture",
  "climate",
  "fitness",
  "wellness",
  "crypto",
  "music",
  "business",
  "education",
  "other",
] as const;

export type EventCategorySlug = (typeof EVENT_CATEGORY_SLUGS)[number];

export const EVENT_REGION_SLUGS = [
  "asia_pacific",
  "europe",
  "africa",
  "north_america",
  "south_america",
] as const;

export type EventRegionSlug = (typeof EVENT_REGION_SLUGS)[number];

export const EVENT_CITY_SLUGS = [
  "hong_kong",
  "taipei",
  "tokyo",
  "seoul",
  "singapore",
  "sydney",
  "bangkok",
  "kuala_lumpur",
  "manila",
  "london",
  "paris",
  "berlin",
  "amsterdam",
  "new_york",
  "los_angeles",
  "toronto",
  "sao_paulo",
  "dubai",
  "other",
] as const;

export type EventCitySlug = (typeof EVENT_CITY_SLUGS)[number];

export const CITY_REGION: Record<EventCitySlug, EventRegionSlug> = {
  hong_kong: "asia_pacific",
  taipei: "asia_pacific",
  tokyo: "asia_pacific",
  seoul: "asia_pacific",
  singapore: "asia_pacific",
  sydney: "asia_pacific",
  bangkok: "asia_pacific",
  kuala_lumpur: "asia_pacific",
  manila: "asia_pacific",
  dubai: "asia_pacific",
  london: "europe",
  paris: "europe",
  berlin: "europe",
  amsterdam: "europe",
  new_york: "north_america",
  los_angeles: "north_america",
  toronto: "north_america",
  sao_paulo: "south_america",
  other: "asia_pacific",
};

export const CATEGORY_ICONS: Record<EventCategorySlug, string> = {
  technology: "💻",
  food_drink: "🍜",
  ai: "🧠",
  arts_culture: "🎨",
  climate: "🌿",
  fitness: "🏃",
  wellness: "🧘",
  crypto: "₿",
  music: "🎵",
  business: "💼",
  education: "📚",
  other: "✨",
};

export const CITY_ICONS: Record<EventCitySlug, string> = {
  hong_kong: "🏙️",
  taipei: "🗼",
  tokyo: "🗾",
  seoul: "🇰🇷",
  singapore: "🦁",
  sydney: "🦘",
  bangkok: "🛕",
  kuala_lumpur: "🌴",
  manila: "🏝️",
  dubai: "🏜️",
  london: "🇬🇧",
  paris: "🗼",
  berlin: "🇩🇪",
  amsterdam: "🌷",
  new_york: "🗽",
  los_angeles: "🌴",
  toronto: "🍁",
  sao_paulo: "🇧🇷",
  other: "📍",
};

export function citiesForRegion(region: EventRegionSlug): EventCitySlug[] {
  return EVENT_CITY_SLUGS.filter((c) => CITY_REGION[c] === region);
}
