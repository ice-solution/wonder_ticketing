export const PLATFORM_FEE_RATES = {
  free: 0.05,
  pro: 0.03,
} as const;

export const PRO_MONTHLY_PRICE_HKD = 460;
export const DEFAULT_MAX_ATTENDEES = 300;
export const ORDER_NUMBER_PREFIX = "WDR-";
export const DEFAULT_CURRENCY = "HKD";
export const DEFAULT_LOCALE = "zh-TW";

/** Organizer 帳戶每週 Email/WhatsApp 發送上限（PRODUCT_DECISIONS §4） */
export const PLATFORM_WEEKLY_SEND_LIMITS = {
  free: 500,
  pro: 5000,
} as const;

/** Calendar admins：帳戶級協作者上限（含擁有者以外的邀請名額） */
export const CALENDAR_ADMIN_LIMITS = {
  free: 3,
  pro: 5,
} as const;
