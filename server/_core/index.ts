import "dotenv/config";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import * as trpcExpress from "@trpc/server/adapters/express";
import { connectDB } from "../db/connect.js";
import { createContext } from "./context.js";
import { appRouter } from "../routers/index.js";
import { env } from "./env.js";
import { devLogin, clearSessionCookie } from "./auth.js";
import { parseWonderWebhookPayload } from "../payment/wonderGateway.js";
import {
  decodeOAuthState,
  getFacebookAuthUrl,
  getGoogleAuthUrl,
  handleFacebookCallback,
  handleGoogleCallback,
} from "./socialAuth.js";
import {
  getEnterpriseSsoAuthUrl,
  handleEnterpriseSsoCallback,
} from "./enterpriseSso.js";
import { handlePaymentSuccess } from "../routers/order.js";
import { startReminderScheduler } from "../services/reminderScheduler.js";
import { startSubscriptionScheduler } from "../services/subscriptionScheduler.js";
import { apiKeyAuth, type ApiKeyRequest } from "../middleware/apiKeyAuth.js";
import { Event, TicketType, Order } from "../models/index.js";
import { getPaymentStatus } from "../services/paymentConfig.js";
import { VERSION } from "../../shared/version.js";
import {
  getWhatsAppProviderStatus,
  verifyWhatsAppWebhookSignature,
} from "../lib/whatsappCloud.js";
import { processWhatsAppWebhook } from "../services/whatsappBot.js";

const app = express();
const port = env.PORT;

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(cookieParser());

/** Wonder Payment callback（GET/POST，參考 checkinSystem wonderWebhook） */
async function handleWonderPaymentWebhook(
  req: express.Request,
  res: express.Response
) {
  const body = (req.body && typeof req.body === "object" ? req.body : {}) as Record<string, unknown>;
  const query = (req.query ?? {}) as Record<string, unknown>;
  const { referenceNumber, state, correspondenceState, isPaid } = parseWonderWebhookPayload(body, query);

  console.log("[Wonder Webhook]", {
    method: req.method,
    referenceNumber,
    state,
    correspondenceState,
    isPaid,
  });

  if (referenceNumber && isPaid) {
    await handlePaymentSuccess(referenceNumber);
  }
  res.status(200).json({ received: true });
}

app.get("/api/wonder-payment/webhook", express.json(), handleWonderPaymentWebhook);
app.post("/api/wonder-payment/webhook", express.json(), handleWonderPaymentWebhook);

/** WhatsApp Bot Webhook — POST 需 raw body 驗簽 */
app.get("/api/whatsapp/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.status(403).end();
});

app.post(
  "/api/whatsapp/webhook",
  express.raw({ type: "application/json", limit: "1mb" }),
  (req, res) => {
    const raw = req.body as Buffer;
    const sig = req.headers["x-hub-signature-256"] as string | undefined;
    if (!verifyWhatsAppWebhookSignature(raw, sig)) {
      return res.status(403).json({ error: "Invalid signature" });
    }
    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      return res.status(400).json({ error: "Invalid JSON" });
    }
    res.json({ received: true });
    void processWhatsAppWebhook(body);
  }
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    version: VERSION,
    database: "mongodb",
    phase: 3,
    payment: getPaymentStatus(),
    whatsapp: getWhatsAppProviderStatus(),
  });
});

/** 嵌入式購票 Widget 資料（公開） */
app.get("/api/embed/:slug", async (req, res) => {
  const event = await Event.findOne({ slug: req.params.slug, status: "published" }).lean();
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (event.visibility === "private") {
    return res.status(403).json({ error: "Private event — embed not available" });
  }
  const types = await TicketType.find({ eventId: event._id, status: "active" })
    .sort({ sortOrder: 1 })
    .lean();
  res.json({
    event: {
      id: String(event._id),
      title: event.title,
      titleEn: event.titleEn,
      slug: event.slug,
      venue: event.venue,
      eventDate: event.eventDate,
      enableEmbedWidget: event.enableEmbedWidget !== false,
    },
    ticketTypes: types.map((t) => ({
      id: String(t._id),
      name: t.name,
      price: t.price,
      available: t.quantity - (t.sold ?? 0),
    })),
  });
});

/** Pro REST API（API Key 認證） */
app.get("/api/v1/events", apiKeyAuth, async (req: ApiKeyRequest, res) => {
  const events = await Event.find({ createdBy: req.apiKeyOrganizerId })
    .sort({ eventDate: -1 })
    .limit(100)
    .lean();
  res.json({ events });
});

app.get("/api/v1/events/:slug", apiKeyAuth, async (req: ApiKeyRequest, res) => {
  const event = await Event.findOne({
    slug: req.params.slug,
    createdBy: req.apiKeyOrganizerId,
  }).lean();
  if (!event) return res.status(404).json({ error: "Not found" });
  const types = await TicketType.find({ eventId: event._id }).lean();
  res.json({ event, ticketTypes: types });
});

app.get("/api/v1/orders/:orderNumber", apiKeyAuth, async (req: ApiKeyRequest, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber }).lean();
  if (!order) return res.status(404).json({ error: "Not found" });
  const event = await Event.findById(order.eventId).lean();
  if (!event || String(event.createdBy) !== req.apiKeyOrganizerId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  res.json({ order });
});

/** Google OAuth */
app.get("/api/auth/google", (req, res) => {
  const redirect = (req.query.redirect as string) ?? env.CLIENT_URL ?? "http://localhost:5173";
  const url = getGoogleAuthUrl(redirect);
  if (!url) return res.status(501).json({ error: "Google OAuth not configured" });
  res.redirect(url);
});

app.get("/api/auth/google/callback", async (req, res) => {
  const code = req.query.code as string | undefined;
  const state = req.query.state as string | undefined;
  const redirect = decodeOAuthState(state);
  if (!code) return res.redirect(`${redirect}?auth_error=google`);
  try {
    await handleGoogleCallback(code, res);
    res.redirect(redirect);
  } catch (e) {
    console.error("[google oauth]", e);
    res.redirect(`${redirect}?auth_error=google`);
  }
});

/** Facebook OAuth */
app.get("/api/auth/facebook", (req, res) => {
  const redirect = (req.query.redirect as string) ?? env.CLIENT_URL ?? "http://localhost:5173";
  const url = getFacebookAuthUrl(redirect);
  if (!url) return res.status(501).json({ error: "Facebook OAuth not configured" });
  res.redirect(url);
});

app.get("/api/auth/facebook/callback", async (req, res) => {
  const code = req.query.code as string | undefined;
  const state = req.query.state as string | undefined;
  const redirect = decodeOAuthState(state);
  if (!code) return res.redirect(`${redirect}?auth_error=facebook`);
  try {
    await handleFacebookCallback(code, res);
    res.redirect(redirect);
  } catch (e) {
    console.error("[facebook oauth]", e);
    res.redirect(`${redirect}?auth_error=facebook`);
  }
});

/** Enterprise SSO (OIDC) */
app.get("/api/auth/sso", async (req, res) => {
  const redirect = (req.query.redirect as string) ?? env.CLIENT_URL ?? "http://localhost:5173";
  try {
    const url = await getEnterpriseSsoAuthUrl(redirect);
    if (!url) return res.status(501).json({ error: "Enterprise SSO not configured" });
    res.redirect(url);
  } catch (e) {
    console.error("[sso login]", e);
    res.status(500).json({ error: "SSO discovery failed" });
  }
});

app.get("/api/auth/sso/callback", async (req, res) => {
  const code = req.query.code as string | undefined;
  const state = req.query.state as string | undefined;
  const redirect = decodeOAuthState(state);
  if (!code) return res.redirect(`${redirect}?auth_error=sso`);
  try {
    await handleEnterpriseSsoCallback(code, res);
    res.redirect(redirect);
  } catch (e) {
    const msg = (e as Error).message;
    console.error("[sso callback]", e);
    const errCode = msg === "SSO_DOMAIN_NOT_ALLOWED" ? "sso_domain" : "sso";
    res.redirect(`${redirect}?auth_error=${errCode}`);
  }
});

app.post("/api/auth/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.post("/api/dev/login", async (req, res) => {
  if (env.NODE_ENV === "production") {
    return res.status(404).end();
  }
  const { email, name, plan, planExpiresAt, role } = req.body as {
    email?: string;
    name?: string;
    plan?: "free" | "pro";
    planExpiresAt?: string | null;
    role?: "user" | "admin";
  };
  if (!email) return res.status(400).json({ error: "email required" });
  const user = await devLogin(res, { email, name });
  const { User } = await import("../models/User.js");
  const patch: Record<string, unknown> = {};
  if (plan === "pro") {
    patch.plan = "pro";
    patch.planExpiresAt = planExpiresAt ? new Date(planExpiresAt) : null;
  } else if (plan === "free") {
    patch.plan = "free";
    patch.planExpiresAt = null;
  } else if (planExpiresAt !== undefined) {
    patch.planExpiresAt = planExpiresAt ? new Date(planExpiresAt) : null;
  }
  if (role === "admin" || role === "user") {
    patch.role = role;
  }
  if (Object.keys(patch).length) {
    await User.updateOne({ _id: user._id }, patch);
  }
  const updated = await User.findById(user._id).lean();
  res.json({ user: updated });
});

app.post("/api/dev/process-subscriptions", async (_req, res) => {
  if (env.NODE_ENV === "production") return res.status(404).end();
  const { processExpiredSubscriptions } = await import("../services/subscriptionScheduler.js");
  await processExpiredSubscriptions();
  res.json({ ok: true });
});

app.post("/api/dev/logout", (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get("/api/dev/mock-pay", async (req, res) => {
  if (env.NODE_ENV === "production") return res.status(404).end();
  const orderNumber = req.query.orderNumber as string;
  if (!orderNumber) return res.status(400).send("orderNumber required");
  await handlePaymentSuccess(orderNumber);
  const clientUrl = process.env.CLIENT_URL ?? "http://localhost:5173";
  res.redirect(`${clientUrl}/order/${orderNumber}`);
});

/** E2E / 開發：直接標記訂單已付款（不依賴 Wonder redirect） */
app.post("/api/dev/fulfill-order", express.json(), async (req, res) => {
  if (env.NODE_ENV === "production") return res.status(404).end();
  const orderNumber = (req.body as { orderNumber?: string })?.orderNumber;
  if (!orderNumber) return res.status(400).json({ error: "orderNumber required" });
  await handlePaymentSuccess(orderNumber);
  res.json({ ok: true, orderNumber });
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveRuntimePath(relativePath: string): string {
  const candidates = [
    // Source runtime: server/_core/index.ts -> project root
    path.resolve(__dirname, "../..", relativePath),
    // Compiled runtime: dist/server/_core/index.js -> project root
    path.resolve(__dirname, "../../..", relativePath),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

const clientDist = resolveRuntimePath("client/dist");
const marketingDir = resolveRuntimePath("marketing");
const uploadsDir = resolveRuntimePath("uploads");

app.use("/uploads", express.static(uploadsDir));

app.get(["/marketing/flowmind", "/marketing/flowmind/"], (_req, res) => {
  res.redirect(301, "/");
});

app.use("/marketing", express.static(marketingDir));

app.use(
  "/api/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

if (env.NODE_ENV === "production") {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

async function main() {
  await connectDB();
  startReminderScheduler();
  startSubscriptionScheduler();
  app.listen(port, () => {
    console.log(`Wonder Ticketing — Phase 3 API http://localhost:${port}`);
    console.log(`tRPC http://localhost:${port}/api/trpc`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
