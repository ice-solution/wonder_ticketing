/**
 * Wonder Payment Gateway（移植自 checkinSystem/utils/wonderPayment.js）
 * PAYMENT_DEV=true → https://gateway-stg.wonder.today
 */
import fs from "node:fs";
import path from "node:path";
import { WonderSignature } from "../lib/wonderSignature.js";
import { env } from "../_core/env.js";

/** Wonder credential 時間戳須用 UTC（與 checkinSystem 一致） */
process.env.TZ = "UTC";

const WONDER_ECHO_URI = "/svc/payment/api/v1/openapi/echo";
const WONDER_ORDER_API_PATH = "/svc/payment/api/v1/openapi/orders";

export function getPaymentBaseUrl(): string {
  const dev = (env.PAYMENT_DEV ?? "").toString().trim().toLowerCase();
  const isDev = dev === "true" || dev === "1";
  return isDev ? "https://gateway-stg.wonder.today" : "https://gateway.wonder.today";
}

export function formatTimeToYYYYMMDDHHMMSS(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

export function loadWonderPrivateKey(): string {
  const keyPath = (env.WONDER_PRIVATE_KEY_PATH ?? "").trim();
  if (keyPath) {
    const resolved = path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath);
    return fs.readFileSync(resolved, "utf8").replace(/\\n/g, "\n").trim();
  }
  return (env.WONDER_PRIVATE_KEY ?? "").replace(/\\n/g, "\n").trim();
}

export function getWonderConfig() {
  const appId = (env.WONDER_APP_ID ?? "").trim();
  const customerUuid = (env.WONDER_CUSTOMER_UUID ?? "").trim();
  const apiKey = (env.WONDER_API_KEY ?? "").trim();
  const privateKey = loadWonderPrivateKey();
  return { appId, customerUuid, apiKey, privateKey };
}

export function isWonderConfigured(): boolean {
  const { appId, privateKey } = getWonderConfig();
  return !!(appId && privateKey && privateKey.includes("BEGIN"));
}

function getWonderAuthHeaders(
  privateKey: string,
  appId: string,
  method: string,
  uri: string,
  bodyString: string,
  credentialTime?: string
) {
  const wonderSignature = new WonderSignature();
  const nonce = WonderSignature.generateRandomString(16);
  const now = credentialTime || formatTimeToYYYYMMDDHHMMSS();
  const credential = `${appId}/${now}/Wonder-RSA-SHA256`;
  const signature = wonderSignature.signature(privateKey, credential, nonce, method, uri, bodyString || null);
  return { Credential: credential, Nonce: nonce, Signature: signature };
}

export async function wonderAuthenticate(): Promise<void> {
  const baseUrl = getPaymentBaseUrl();
  const { appId, privateKey } = getWonderConfig();
  if (!appId || !privateKey.includes("BEGIN")) {
    throw new Error("WONDER_APP_ID and WONDER_PRIVATE_KEY are required for Wonder auth");
  }

  const now = formatTimeToYYYYMMDDHHMMSS();
  const authBody = { message: `Hello, Current timestamp is ${now}` };
  const authBodyString = JSON.stringify(authBody);
  const method = "POST";
  const uri = WONDER_ECHO_URI;
  const authHeaders = getWonderAuthHeaders(privateKey, appId, method, uri, authBodyString, now);
  const url = `${baseUrl}${WONDER_ECHO_URI}`;

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Credential: authHeaders.Credential,
      Nonce: authHeaders.Nonce,
      Signature: authHeaders.Signature,
    },
    body: authBodyString,
    signal: AbortSignal.timeout(15_000),
  });

  if (response.status !== 200 && response.status !== 201) {
    const text = await response.text();
    throw new Error(`Wonder auth failed: ${response.status} - ${text}`);
  }
}

export interface WonderCreateOrderParams {
  referenceNumber: string;
  currency?: string;
  amount: number;
  note?: string;
  callbackUrl: string;
  redirectUrl: string;
}

export async function createWonderOrder(params: WonderCreateOrderParams): Promise<{
  paymentUrl: string;
  orderId: string;
}> {
  const baseUrl = getPaymentBaseUrl();
  const { appId, customerUuid, apiKey, privateKey } = getWonderConfig();
  if (!appId) throw new Error("WONDER_APP_ID is required");

  await wonderAuthenticate();

  const amountStr =
    typeof params.amount === "number" ? params.amount.toFixed(2) : String(params.amount || "0.00");

  const body: Record<string, unknown> = {
    app_id: appId,
    order: {
      reference_number: String(params.referenceNumber),
      charge_fee: amountStr,
      currency: (params.currency || "HKD").toUpperCase(),
      note: String(params.note || ""),
      callback_url: params.callbackUrl,
      redirect_url: params.redirectUrl,
    },
  };
  if (customerUuid) body.customer_uuid = customerUuid;

  const plainText = JSON.stringify(body);
  const query = "with_payment_link=true";
  const uriWithQuery = `${WONDER_ORDER_API_PATH}?${query}`;
  const url = `${baseUrl}${uriWithQuery}`;
  const method = "POST";

  if (!privateKey.includes("BEGIN")) {
    throw new Error("WONDER_PRIVATE_KEY is required for create order signature");
  }

  const orderAuthHeaders = getWonderAuthHeaders(privateKey, appId, method, uriWithQuery, plainText);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Credential: orderAuthHeaders.Credential,
    Nonce: orderAuthHeaders.Nonce,
    Signature: orderAuthHeaders.Signature,
  };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
    headers["X-API-Key"] = apiKey;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: plainText,
    signal: AbortSignal.timeout(15_000),
  });

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (response.status !== 200 && response.status !== 201) {
    const msg =
      (data.message as string) ||
      (data.error as string) ||
      response.statusText ||
      JSON.stringify(data);
    throw new Error(`Wonder create order failed: ${response.status} - ${msg}`);
  }

  const nested = data.data as Record<string, unknown> | undefined;
  const paymentUrl =
    (data.payment_url as string) ||
    (data.url as string) ||
    (nested?.payment_url as string) ||
    (nested?.url as string) ||
    (nested?.payment_link as string);
  const orderId =
    (data.order_id as string) ||
    (data.id as string) ||
    (nested?.order_id as string) ||
    (nested?.id as string) ||
    (data.reference_number as string);

  if (!paymentUrl) {
    throw new Error(`Wonder API did not return payment_url. Response: ${JSON.stringify(data)}`);
  }

  return { paymentUrl, orderId: orderId || params.referenceNumber };
}

/** 解析 Wonder webhook / callback payload（checkinSystem wonderWebhook） */
export function parseWonderWebhookPayload(body: Record<string, unknown>, query: Record<string, unknown>) {
  const referenceNumber =
    (body.reference_number as string) || (query.reference_number as string) || undefined;
  const state = String(body.state ?? "").toLowerCase();
  const correspondenceState = String(body.correspondence_state ?? "").toLowerCase();
  const isPaid = state === "completed" || correspondenceState === "paid";
  return { referenceNumber, state, correspondenceState, isPaid };
}
