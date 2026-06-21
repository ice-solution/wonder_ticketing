/** Free/Pro 功能分界 — 與規格書 Section 8 一致 */
export const FEATURES = {
  UNLIMITED_EVENTS: { free: true, pro: true },
  UNLIMITED_ATTENDEES: { free: true, pro: true },
  MULTI_TICKET_TYPES: { free: true, pro: true },
  GROUP_TICKETS: { free: true, pro: true },
  QR_CHECK_IN: { free: true, pro: true },
  EMAIL_NOTIFICATIONS: { free: true, pro: true },
  WHATSAPP_NOTIFICATIONS: { free: true, pro: true },
  AUTO_REMINDERS: { free: true, pro: true },
  WAITLIST: { free: true, pro: true },
  DISCOUNT_CODES: { free: true, pro: true },
  CSV_EXPORT: { free: true, pro: true },
  DONATION: { free: true, pro: true },
  BILINGUAL: { free: true, pro: true },
  EVENT_DISCOVERY: { free: true, pro: true },
  CUSTOM_QUESTIONS: { free: true, pro: true },
  TICKET_TRANSFER: { free: true, pro: true },
  ORGANIZER_REFERRAL: { free: true, pro: true },
  EVENT_CHAT: { free: true, pro: true },
  POST_EVENT_SURVEY: { free: true, pro: true },
  WEEKLY_SENDS_500: { free: true, pro: true },

  SEAT_MAP_EDITOR: { free: false, pro: true },
  SEAT_SELECTION: { free: false, pro: true },
  CUSTOM_URL: { free: false, pro: true },
  TAX_VAT: { free: false, pro: true },
  CHECKER_ROLE: { free: false, pro: true },
  SEPARATE_NAMES: { free: false, pro: true },
  ZAPIER: { free: false, pro: true },
  API_ACCESS: { free: false, pro: true },
  WEBHOOKS: { free: false, pro: true },
  META_PIXEL: { free: false, pro: true },
  GOOGLE_ANALYTICS: { free: false, pro: true },
  SALES_REPORTS: { free: false, pro: true },
  REVENUE_CHARTS: { free: false, pro: true },
  CRM_TAGS: { free: false, pro: true },
  PEER_REFERRAL: { free: false, pro: true },
  AI_COPYWRITING: { free: false, pro: true },
  EMBED_WIDGET: { free: false, pro: true },
  WHATSAPP_BOT: { free: false, pro: true },
  CUSTOM_RECEIPTS: { free: false, pro: true },
  PRIORITY_SUPPORT: { free: false, pro: true },
  EARLY_ACCESS: { free: false, pro: true },
  WEEKLY_SENDS_5000: { free: false, pro: true },
  CALENDAR_ADMINS_5: { free: false, pro: true },
} as const;

export type FeatureKey = keyof typeof FEATURES;
export type UserPlan = "free" | "pro";

export function checkFeature(plan: UserPlan, feature: FeatureKey): boolean {
  return FEATURES[feature][plan];
}
