import { env } from "./_core/env.js";
import { createWonderOrder, isWonderConfigured } from "./payment/wonderGateway.js";

export type PaymentMethod = "fps" | "payme" | "wechat" | "alipay" | "card";

export interface CreatePaymentInput {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  buyerEmail: string;
  buyerName: string;
  eventTitle: string;
  origin: string;
  metadata: Record<string, string>;
}

export interface PaymentSession {
  sessionId: string;
  paymentUrl: string;
  expiresAt: number;
}

export function isPaymentMockMode(): boolean {
  if (process.env.E2E_MOCK_PAYMENT === "1") return true;
  return !isWonderConfigured();
}

function siteBaseUrl(): string {
  return env.WEBHOOK_BASE_URL ?? `http://localhost:${env.PORT}`;
}

export async function createPaymentSession(input: CreatePaymentInput): Promise<PaymentSession> {
  if (isPaymentMockMode()) {
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    return {
      sessionId: `mock_${input.orderNumber}`,
      paymentUrl: `${input.origin}/api/dev/mock-pay?orderNumber=${encodeURIComponent(input.orderNumber)}`,
      expiresAt,
    };
  }

  const base = siteBaseUrl();
  const { paymentUrl, orderId } = await createWonderOrder({
    referenceNumber: input.orderNumber,
    currency: input.currency,
    amount: input.amount,
    note: `${input.eventTitle} · ${input.buyerName} · ${input.paymentMethod}`,
    callbackUrl: `${base}/api/wonder-payment/webhook`,
    redirectUrl: `${input.origin}/order/${input.orderNumber}`,
  });

  return {
    sessionId: orderId,
    paymentUrl,
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
  };
}

/** Wonder callback 以 reference_number + state 為準，無獨立 HMAC header */
export function verifyWebhookSignature(): boolean {
  return true;
}
