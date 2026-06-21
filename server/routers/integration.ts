import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ApiKey, WebhookEndpoint, WebhookDelivery } from "../models/index.js";
import { proProcedure, router, requireFeature } from "../_core/trpc.js";
import { generateApiKey, generateWebhookSecret } from "../lib/apiKey.js";
import { WEBHOOK_EVENTS } from "../services/webhooks.js";

export const integrationRouter = router({
  listApiKeys: proProcedure.query(async ({ ctx }) => {
    requireFeature(ctx.user.plan, "API_ACCESS");
    return ApiKey.find({ organizerId: ctx.user._id, revokedAt: null })
      .select("-keyHash")
      .sort({ createdAt: -1 })
      .lean();
  }),

  createApiKey: proProcedure
    .input(z.object({ name: z.string().min(1).max(128), scopes: z.array(z.string()).optional() }))
    .mutation(async ({ ctx, input }) => {
      requireFeature(ctx.user.plan, "API_ACCESS");
      const { raw, prefix, hash } = generateApiKey();
      const doc = await ApiKey.create({
        organizerId: ctx.user._id,
        name: input.name,
        keyPrefix: prefix,
        keyHash: hash,
        scopes: input.scopes ?? ["events:read", "orders:read"],
      });
      return { id: String(doc._id), key: raw, prefix };
    }),

  revokeApiKey: proProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireFeature(ctx.user.plan, "API_ACCESS");
      const key = await ApiKey.findOne({ _id: input.id, organizerId: ctx.user._id });
      if (!key) throw new TRPCError({ code: "NOT_FOUND" });
      key.revokedAt = new Date();
      await key.save();
      return { success: true };
    }),

  listWebhooks: proProcedure.query(async ({ ctx }) => {
    requireFeature(ctx.user.plan, "WEBHOOKS");
    return WebhookEndpoint.find({ organizerId: ctx.user._id })
      .select("-secret")
      .sort({ createdAt: -1 })
      .lean();
  }),

  createWebhook: proProcedure
    .input(
      z.object({
        url: z.string().url(),
        events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireFeature(ctx.user.plan, "WEBHOOKS");
      const secret = generateWebhookSecret();
      const doc = await WebhookEndpoint.create({
        organizerId: ctx.user._id,
        url: input.url,
        events: input.events,
        secret,
      });
      return { id: String(doc._id), secret };
    }),

  deleteWebhook: proProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireFeature(ctx.user.plan, "WEBHOOKS");
      await WebhookEndpoint.deleteOne({ _id: input.id, organizerId: ctx.user._id });
      return { success: true };
    }),

  listDeliveries: proProcedure
    .input(z.object({ endpointId: z.string() }))
    .query(async ({ ctx, input }) => {
      requireFeature(ctx.user.plan, "WEBHOOKS");
      const ep = await WebhookEndpoint.findOne({ _id: input.endpointId, organizerId: ctx.user._id });
      if (!ep) throw new TRPCError({ code: "NOT_FOUND" });
      return WebhookDelivery.find({ endpointId: ep._id })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
    }),
});
