import { env } from "../_core/env.js";
import {
  createWonderOrder,
  getPaymentBaseUrl,
  isWonderConfigured,
  loadWonderPrivateKey,
  wonderAuthenticate,
} from "../payment/wonderGateway.js";
import { isPaymentMockMode } from "../payment.js";

export function getPaymentStatus() {
  const configured = isWonderConfigured();
  const key = loadWonderPrivateKey();
  return {
    mode: isPaymentMockMode() ? ("mock" as const) : ("wonder" as const),
    configured,
    gateway: getPaymentBaseUrl(),
    appId: env.WONDER_APP_ID ?? null,
    hasPrivateKey: key.includes("BEGIN") && key.includes("END"),
    webhookUrl: `${env.WEBHOOK_BASE_URL ?? `http://localhost:${env.PORT}`}/api/wonder-payment/webhook`,
  };
}

export async function testWonderConnection(): Promise<{ ok: boolean; message: string }> {
  if (!isWonderConfigured()) {
    return { ok: false, message: "WONDER_APP_ID 或私鑰未設定" };
  }
  try {
    await wonderAuthenticate();
    return { ok: true, message: "Wonder echo 認證成功" };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function createSubscriptionPaymentSession(input: {
  userId: string;
  orderNumber: string;
  origin: string;
}): Promise<{ paymentUrl: string; sessionId: string }> {
  const base = env.WEBHOOK_BASE_URL ?? `http://localhost:${env.PORT}`;
  const { paymentUrl, orderId } = await createWonderOrder({
    referenceNumber: input.orderNumber,
    currency: "HKD",
    amount: 460,
    note: `Wonder Ticketing Pro · ${input.orderNumber}`,
    callbackUrl: `${base}/api/wonder-payment/webhook`,
    redirectUrl: `${input.origin}/dashboard/subscription?upgraded=1`,
  });
  return { paymentUrl, sessionId: orderId };
}
