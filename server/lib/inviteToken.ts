import { customAlphabet } from "nanoid";
import { env } from "../_core/env.js";

const inviteNano = customAlphabet("0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 32);

export function generateInviteToken(): string {
  return inviteNano();
}

export function buildEventInviteUrl(slug: string, inviteToken: string): string {
  const base = env.CLIENT_URL ?? "http://localhost:5173";
  return `${base}/event/${slug}?invite=${encodeURIComponent(inviteToken)}`;
}
