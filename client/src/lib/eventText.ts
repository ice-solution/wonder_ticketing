type BilingualEvent = {
  title: string;
  titleEn?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
};

export function eventTitle(event: BilingualEvent, lng: string) {
  if (lng.startsWith("en") && event.titleEn) return event.titleEn;
  return event.title;
}

export function eventDescription(event: BilingualEvent, lng: string) {
  if (lng.startsWith("en") && event.descriptionEn) return event.descriptionEn;
  return event.description ?? "";
}

export function formatEventDate(d: Date | string, lng: string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString(lng === "en" ? "en-HK" : "zh-HK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatMoney(amount: number, currency = "HKD", lng: string) {
  return new Intl.NumberFormat(lng === "en" ? "en-HK" : "zh-HK", {
    style: "currency",
    currency,
  }).format(amount);
}
