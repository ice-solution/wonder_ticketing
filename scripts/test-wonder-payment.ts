import "dotenv/config";
import { getWonderConfig, isWonderConfigured, createWonderOrder } from "../server/payment/wonderGateway.js";
import { env } from "../server/_core/env.js";

const c = getWonderConfig();
console.log("configured:", isWonderConfigured());
console.log("appId:", c.appId);
console.log("keyLen:", c.privateKey.length);
console.log("keyOk:", c.privateKey.includes("BEGIN") && c.privateKey.includes("END"));
console.log("baseUrl:", env.WEBHOOK_BASE_URL);

try {
  const r = await createWonderOrder({
    referenceNumber: `TEST-${Date.now()}`,
    amount: 1,
    currency: "HKD",
    note: "Wonder connectivity test",
    callbackUrl: `${env.WEBHOOK_BASE_URL ?? "http://localhost:3777"}/api/wonder-payment/webhook`,
    redirectUrl: `${env.CLIENT_URL ?? "http://localhost:5173"}/events`,
  });
  console.log("createOrder OK");
  console.log("paymentUrl:", r.paymentUrl);
  console.log("orderId:", r.orderId);
} catch (e) {
  console.error("createOrder FAIL:", (e as Error).message);
  process.exit(1);
}
