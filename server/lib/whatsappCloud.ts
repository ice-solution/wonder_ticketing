import crypto from "crypto";
import { env } from "../_core/env.js";

const GRAPH_API = "https://graph.facebook.com/v21.0";

export function isWhatsAppConfigured(): boolean {
  return !!(env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID);
}

export function getWhatsAppProviderStatus() {
  return {
    configured: isWhatsAppConfigured(),
    provider: isWhatsAppConfigured() ? ("meta_cloud" as const) : ("console" as const),
    webhookUrl: env.WEBHOOK_BASE_URL
      ? `${env.WEBHOOK_BASE_URL}/api/whatsapp/webhook`
      : undefined,
  };
}

export function verifyWhatsAppWebhookSignature(rawBody: Buffer, signatureHeader?: string): boolean {
  const secret = env.WHATSAPP_APP_SECRET;
  if (!secret) return true;
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const received = signatureHeader.slice(7);
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

export async function sendWhatsAppText(to: string, body: string): Promise<void> {
  if (!isWhatsAppConfigured()) {
    throw new Error("WHATSAPP_NOT_CONFIGURED");
  }

  const phone = to.replace(/\D/g, "");
  const res = await fetch(`${GRAPH_API}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "text",
      text: { preview_url: true, body },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`WhatsApp API ${res.status}: ${errText.slice(0, 200)}`);
  }
}

export type WhatsAppIncomingMessage = {
  from: string;
  messageId: string;
  text: string;
};

/** Parse Meta Cloud API webhook payload */
export function parseWhatsAppWebhook(body: unknown): WhatsAppIncomingMessage[] {
  const messages: WhatsAppIncomingMessage[] = [];
  if (!body || typeof body !== "object") return messages;

  const entries = (body as { entry?: unknown[] }).entry ?? [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const changes = (entry as { changes?: unknown[] }).changes ?? [];
    for (const change of changes) {
      if (!change || typeof change !== "object") continue;
      const value = (change as { value?: { messages?: unknown[] } }).value;
      for (const msg of value?.messages ?? []) {
        if (!msg || typeof msg !== "object") continue;
        const m = msg as {
          from?: string;
          id?: string;
          type?: string;
          text?: { body?: string };
        };
        if (m.type === "text" && m.text?.body && m.from) {
          messages.push({
            from: m.from,
            messageId: m.id ?? "",
            text: m.text.body.trim(),
          });
        }
      }
    }
  }
  return messages;
}
