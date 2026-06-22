import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Event, TicketType } from "../models/index.js";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc.js";
import { CreateEventInputSchema, UpdateEventInputSchema } from "../../shared/schemas/event.js";
import { uniqueEventSlug } from "../lib/ids.js";
import { saveEventBanner, removeEventBanner } from "../lib/bannerUpload.js";
import { canAccessMembersOnlyEvent } from "../../shared/access.js";
import { assertCanAddCohost, userCanManageEvent } from "../services/cohost.js";
import { EventCohost } from "../models/index.js";
import {
  accessDeniedMessage,
  resolveEventAccess,
  stripPrivateFields,
} from "../lib/eventAccess.js";
import { buildEventInviteUrl, generateInviteToken } from "../lib/inviteToken.js";
import { onEventPublishedWebhook } from "../services/webhooks.js";
import {
  EVENT_CATEGORY_SLUGS,
  EVENT_CITY_SLUGS,
  EVENT_REGION_SLUGS,
} from "../../shared/eventBrowse.js";
import type { Context } from "../_core/context.js";

function publishedVisibilityFilter(ctx: Context) {
  const visibilities = ["public"];
  if (ctx.user && canAccessMembersOnlyEvent(ctx.user, true)) {
    visibilities.push("members_only");
  }
  return { status: "published", visibility: { $in: visibilities } };
}

async function ensureInviteToken(eventId: string): Promise<string> {
  const event = await Event.findById(eventId).select("inviteToken").lean();
  if (event?.inviteToken) return event.inviteToken;
  const token = generateInviteToken();
  await Event.updateOne({ _id: eventId }, { inviteToken: token, updatedAt: new Date() });
  return token;
}

export const eventRouter = router({
  listPublished: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().optional(),
        limit: z.number().int().positive().optional(),
        category: z.string().optional(),
        region: z.string().optional(),
        city: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const page = input.page ?? 1;
      const limit = Math.min(input.limit ?? 20, 50);
      const filter: Record<string, unknown> = publishedVisibilityFilter(ctx);
      if (input.category) filter.category = input.category;
      if (input.region) filter.region = input.region;
      if (input.city) filter.city = input.city;
      if (input.search) {
        filter.$or = [
          { title: { $regex: input.search, $options: "i" } },
          { titleEn: { $regex: input.search, $options: "i" } },
        ];
      }
      const [items, total] = await Promise.all([
        Event.find(filter)
          .sort({ isFeatured: -1, eventDate: 1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Event.countDocuments(filter),
      ]);
      return { items, total, page, limit };
    }),

  /** 公開列表：類別 / 地區活動數量（供 /events 瀏覽區塊） */
  browseFacets: publicProcedure.query(async ({ ctx }) => {
    const base = publishedVisibilityFilter(ctx);

    const [categoryRows, cityRows] = await Promise.all([
      Event.aggregate<{ _id: string; count: number }>([
        { $match: { ...base, category: { $nin: [null, ""] } } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
      Event.aggregate<{ _id: { city: string; region: string }; count: number }>([
        { $match: { ...base, city: { $nin: [null, ""] } } },
        { $group: { _id: { city: "$city", region: "$region" }, count: { $sum: 1 } } },
      ]),
    ]);

    const categories = EVENT_CATEGORY_SLUGS.map((slug) => ({
      slug,
      count: categoryRows.find((r) => r._id === slug)?.count ?? 0,
    }));

    const cities = EVENT_CITY_SLUGS.map((slug) => {
      const row = cityRows.find((r) => r._id?.city === slug);
      return {
        slug,
        region: row?._id?.region ?? null,
        count: row?.count ?? 0,
      };
    });

    const regions = EVENT_REGION_SLUGS.map((slug) => ({
      slug,
      count: cityRows
        .filter((r) => r._id?.region === slug)
        .reduce((sum, r) => sum + r.count, 0),
    }));

    return { categories, cities, regions };
  }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string(), inviteToken: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const event = await Event.findOne({ slug: input.slug }).lean();
      if (!event) return null;

      const canManage = ctx.user
        ? await userCanManageEvent(ctx.user._id, String(event._id))
        : false;

      if (event.status !== "published" && !canManage) return null;

      const { allowed, isOrganizer } = await resolveEventAccess(event, ctx, input.inviteToken);
      if (!allowed) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: accessDeniedMessage(event.visibility),
        });
      }

      return stripPrivateFields(event, isOrganizer || canManage);
    }),

  getTicketTypes: publicProcedure
    .input(z.object({ eventId: z.string(), inviteToken: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const event = await Event.findById(input.eventId).lean();
      if (!event) return [];

      const { allowed, isOrganizer } = await resolveEventAccess(event, ctx, input.inviteToken);
      if (!allowed && !isOrganizer) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: accessDeniedMessage(event.visibility),
        });
      }

      return TicketType.find({ eventId: input.eventId, status: "active" })
        .sort({ sortOrder: 1 })
        .lean();
    }),

  listMine: protectedProcedure.query(async ({ ctx }) => {
    const owned = await Event.find({ createdBy: ctx.user._id }).sort({ eventDate: -1 }).lean();
    const cohosted = await EventCohost.find({
      userId: ctx.user._id,
      status: "active",
    }).lean();
    const coIds = cohosted.map((c) => c.eventId);
    const shared =
      coIds.length > 0
        ? await Event.find({ _id: { $in: coIds } })
            .sort({ eventDate: -1 })
            .lean()
        : [];
    return [...owned, ...shared.filter((e) => !owned.some((o) => String(o._id) === String(e._id)))];
  }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    const ok = await userCanManageEvent(ctx.user._id, input.id);
    if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
    const event = await Event.findById(input.id).lean();
    if (!event) return null;
    if (event.visibility === "private") {
      const token = event.inviteToken ?? (await ensureInviteToken(input.id));
      return {
        ...event,
        inviteToken: token,
        inviteUrl: buildEventInviteUrl(event.slug, token),
      };
    }
    return event;
  }),

  create: protectedProcedure.input(CreateEventInputSchema).mutation(async ({ input, ctx }) => {
    const slug = await uniqueEventSlug(input.title, async (s) => !!(await Event.findOne({ slug: s })));
    const event = await Event.create({
      ...input,
      slug,
      createdBy: ctx.user._id,
      status: "draft",
    });
    await TicketType.create({
      eventId: event._id,
      name: "一般入場",
      price: 100,
      quantity: 100,
      sold: 0,
      status: "active",
      sortOrder: 0,
    });
    return { id: String(event._id), slug: event.slug };
  }),

  update: protectedProcedure.input(UpdateEventInputSchema).mutation(async ({ input, ctx }) => {
    const ok = await userCanManageEvent(ctx.user._id, input.id);
    if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
    const { id, ...data } = input;
    const existing = await Event.findById(id).select("status inviteToken").lean();
    if (data.bannerUrl === "") {
      await removeEventBanner(id);
    }
    const patch: Record<string, unknown> = { ...data, updatedAt: new Date() };
    if (data.visibility === "private") {
      if (!existing?.inviteToken) {
        patch.inviteToken = generateInviteToken();
      }
    }
    await Event.updateOne({ _id: id }, { $set: patch });
    if (data.status === "published" && existing?.status !== "published") {
      void onEventPublishedWebhook(id).catch((e) => console.error("[webhook] event.published", e));
    }
    return { success: true };
  }),

  regenerateInvite: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const ok = await userCanManageEvent(ctx.user._id, input.eventId);
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      const event = await Event.findById(input.eventId).lean();
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });
      const token = generateInviteToken();
      await Event.updateOne(
        { _id: input.eventId },
        { inviteToken: token, updatedAt: new Date() }
      );
      return { inviteToken: token, inviteUrl: buildEventInviteUrl(event.slug, token) };
    }),

  uploadBanner: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
        dataBase64: z.string().min(1).max(7_000_000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const ok = await userCanManageEvent(ctx.user._id, input.eventId);
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      try {
        const bannerUrl = await saveEventBanner(input.eventId, input.dataBase64, input.mimeType);
        await Event.updateOne(
          { _id: input.eventId },
          { $set: { bannerUrl, updatedAt: new Date() } }
        );
        return { bannerUrl };
      } catch (e) {
        const msg = (e as Error).message;
        if (msg === "FILE_TOO_LARGE") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "圖片不得超過 5MB" });
        }
        if (msg === "INVALID_MIME" || msg === "EMPTY_FILE") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "不支援的圖片格式" });
        }
        throw e;
      }
    }),

  removeBanner: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const ok = await userCanManageEvent(ctx.user._id, input.eventId);
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      await removeEventBanner(input.eventId);
      await Event.updateOne(
        { _id: input.eventId },
        { $set: { bannerUrl: null, updatedAt: new Date() } }
      );
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const event = await Event.findById(input.id);
      if (!event || String(event.createdBy) !== String(ctx.user._id)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await Event.deleteOne({ _id: input.id });
      return { success: true };
    }),

  duplicate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const src = await Event.findById(input.id).lean();
      if (!src || String(src.createdBy) !== String(ctx.user._id)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const slug = await uniqueEventSlug(`${src.title} Copy`, async (s) => !!(await Event.findOne({ slug: s })));
      const { _id, slug: _s, createdAt, updatedAt, inviteToken: _it, ...rest } = src as Record<string, unknown>;
      const copy = await Event.create({
        ...rest,
        title: `${src.title} (Copy)`,
        slug,
        status: "draft",
        createdBy: ctx.user._id,
        inviteToken: src.visibility === "private" ? generateInviteToken() : undefined,
      });
      const types = await TicketType.find({ eventId: src._id }).lean();
      for (const t of types) {
        const { _id: tid, eventId, sold, createdAt: ca, updatedAt: ua, ...tRest } = t as Record<string, unknown>;
        await TicketType.create({ ...tRest, eventId: copy._id, sold: 0 });
      }
      return { id: String(copy._id), slug: copy.slug };
    }),

  addCohost: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        userId: z.string().optional(),
        invitedEmail: z.string().email().optional(),
        role: z.enum(["editor", "viewer"]).default("editor"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const event = await Event.findById(input.eventId);
      if (!event || String(event.createdBy) !== String(ctx.user._id)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      try {
        await assertCanAddCohost(ctx.user._id, input.eventId, input.userId);
      } catch (e) {
        if ((e as Error).message === "COHOST_LIMIT") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Cohost 登入名額已滿（上限 ${(e as Error & { limit: number }).limit} 人）。如需增加請聯絡 Wonder。`,
          });
        }
        throw e;
      }
      const doc = await EventCohost.create({
        eventId: event._id,
        organizerId: event.createdBy,
        userId: input.userId,
        invitedEmail: input.invitedEmail,
        role: input.role,
        status: input.userId ? "active" : "pending",
        canLogin: true,
      });
      return { id: String(doc._id) };
    }),

  listCohosts: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input, ctx }) => {
      const ok = await userCanManageEvent(ctx.user._id, input.eventId);
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      return EventCohost.find({ eventId: input.eventId }).lean();
    }),
});
