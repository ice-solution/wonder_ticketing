import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Event, Order, User } from "../models/index.js";
import { adminProcedure, router } from "../_core/trpc.js";

export const adminRouter = router({
  stats: adminProcedure.query(async () => {
    const [users, events, published, featured, orders, proUsers] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Event.countDocuments({ status: "published" }),
      Event.countDocuments({ isFeatured: true, status: "published" }),
      Order.countDocuments(),
      User.countDocuments({ plan: "pro" }),
    ]);
    return { users, events, published, featured, orders, proUsers };
  }),

  listEvents: adminProcedure
    .input(
      z.object({
        page: z.number().int().positive().optional(),
        limit: z.number().int().positive().optional(),
        search: z.string().optional(),
        featuredOnly: z.boolean().optional(),
        status: z.enum(["draft", "published", "cancelled", "completed"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const page = input.page ?? 1;
      const limit = Math.min(input.limit ?? 20, 50);
      const filter: Record<string, unknown> = {};
      if (input.featuredOnly) filter.isFeatured = true;
      if (input.status) filter.status = input.status;
      if (input.search?.trim()) {
        const q = input.search.trim();
        filter.$or = [
          { title: { $regex: q, $options: "i" } },
          { titleEn: { $regex: q, $options: "i" } },
          { slug: { $regex: q, $options: "i" } },
        ];
      }

      const [items, total] = await Promise.all([
        Event.find(filter)
          .sort({ isFeatured: -1, eventDate: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate("createdBy", "name email")
          .lean(),
        Event.countDocuments(filter),
      ]);

      return { items, total, page, limit };
    }),

  setFeatured: adminProcedure
    .input(z.object({ eventId: z.string(), featured: z.boolean() }))
    .mutation(async ({ input }) => {
      const event = await Event.findByIdAndUpdate(
        input.eventId,
        { isFeatured: input.featured, updatedAt: new Date() },
        { new: true }
      ).lean();
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });
      return { eventId: String(event._id), isFeatured: event.isFeatured };
    }),

  listUsers: adminProcedure
    .input(
      z.object({
        page: z.number().int().positive().optional(),
        limit: z.number().int().positive().optional(),
        search: z.string().optional(),
        role: z.enum(["user", "admin"]).optional(),
        plan: z.enum(["free", "pro"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const page = input.page ?? 1;
      const limit = Math.min(input.limit ?? 20, 50);
      const filter: Record<string, unknown> = {};
      if (input.role) filter.role = input.role;
      if (input.plan) filter.plan = input.plan;
      if (input.search?.trim()) {
        const q = input.search.trim();
        filter.$or = [
          { email: { $regex: q, $options: "i" } },
          { name: { $regex: q, $options: "i" } },
          { openId: { $regex: q, $options: "i" } },
        ];
      }

      const [items, total] = await Promise.all([
        User.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .select("-organizerNotificationQuota")
          .lean(),
        User.countDocuments(filter),
      ]);

      const userIds = items.map((u) => u._id);
      const eventCounts = await Event.aggregate<{ _id: unknown; count: number }>([
        { $match: { createdBy: { $in: userIds } } },
        { $group: { _id: "$createdBy", count: { $sum: 1 } } },
      ]);
      const countMap = new Map(eventCounts.map((e) => [String(e._id), e.count]));

      return {
        items: items.map((u) => ({
          ...u,
          eventCount: countMap.get(String(u._id)) ?? 0,
        })),
        total,
        page,
        limit,
      };
    }),

  updateUser: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["user", "admin"]).optional(),
        plan: z.enum(["free", "pro"]).optional(),
        planExpiresAt: z.string().datetime().nullable().optional(),
        cohostLimitOverride: z.number().int().min(1).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (String(ctx.user._id) === input.userId && input.role === "user") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "無法移除自己的管理員權限" });
      }

      const patch: Record<string, unknown> = { updatedAt: new Date() };
      if (input.role !== undefined) patch.role = input.role;
      if (input.plan !== undefined) patch.plan = input.plan;
      if (input.planExpiresAt !== undefined) {
        patch.planExpiresAt = input.planExpiresAt ? new Date(input.planExpiresAt) : null;
      }
      if (input.cohostLimitOverride !== undefined) {
        patch.cohostLimitOverride = input.cohostLimitOverride;
      }

      const user = await User.findByIdAndUpdate(input.userId, patch, { new: true })
        .select("-organizerNotificationQuota")
        .lean();
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      return user;
    }),
});
