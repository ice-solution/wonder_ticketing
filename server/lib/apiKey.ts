import crypto from "crypto";

const PREFIX = "wtk_live_";

export function generateApiKey(): { raw: string; prefix: string; hash: string } {
  const secret = crypto.randomBytes(24).toString("hex");
  const raw = `${PREFIX}${secret}`;
  const prefix = raw.slice(0, 12);
  const hash = hashApiKey(raw);
  return { raw, prefix, hash };
}

export function hashApiKey(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}
