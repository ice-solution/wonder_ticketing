import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/wonder_ticketing"),
  JWT_SECRET: z.string().min(8).default("dev-only-change-in-production"),
  COOKIE_NAME: z.string().default("wonder_session"),
  CLIENT_URL: z.string().url().optional(),
  WEBHOOK_BASE_URL: z.string().url().optional(),

  /** Google OAuth */
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  /** Facebook OAuth */
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),

  /** Wonder Payment Gateway（參考 checkinSystem） */
  PAYMENT_DEV: z.string().optional(),
  WONDER_APP_ID: z.string().optional(),
  WONDER_PRIVATE_KEY: z.string().optional(),
  WONDER_PRIVATE_KEY_PATH: z.string().optional(),
  WONDER_CUSTOMER_UUID: z.string().optional(),
  WONDER_API_KEY: z.string().optional(),

  /** AWS SES Email */
  SENDER_EMAIL: z.string().email().optional(),
  AWS_SES_ACCESS_KEY_ID: z.string().optional(),
  AWS_SES_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_SES_REGION: z.string().default("ap-southeast-1"),

  /** Meta WhatsApp Cloud API */
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_APP_SECRET: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().default("wonder_dev"),

  /** Enterprise SSO (OIDC — Azure AD / Okta / Google Workspace) */
  SSO_OIDC_ISSUER: z.string().url().optional(),
  SSO_OIDC_CLIENT_ID: z.string().optional(),
  SSO_OIDC_CLIENT_SECRET: z.string().optional(),
  SSO_OIDC_DOMAIN_ALLOWLIST: z.string().optional(),
  SSO_OIDC_LABEL: z.string().optional(),
  SSO_OIDC_SCOPES: z.string().optional(),

  /** Google Gemini (AI Studio) — 活動文案生成 */
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.0-flash"),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
  }
  return parsed.data;
}

export const env = loadEnv();
