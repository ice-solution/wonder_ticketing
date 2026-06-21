import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { EventMessage } from "../models/EventMessage.js";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc.js";
import { userCanManageEvent } from "../services/cohost.js";
import { requireFeature } from "../_core/trpc.js";

export const chatRouter = router({
  list: publicProcedure
    .input(z.object({ eventId: z.string(), limit: z.number().int().max(100).default(50) }))
    .query(async ({ input }) => {
      return EventMessage.find({ eventId: input.eventId })
        .sort({ createdAt: -1 })
        .limit(input.limit)
        .populate("userId", "name")
        .lean();
    }),

  send: protectedProcedure
    .input(z.object({ eventId: z.string(), body: z.string().min(1).max(2000) }))
    .mutation(async ({ input, ctx }) => {
      requireFeature(ctx.user.plan, "EVENT_CHAT");
      const doc = await EventMessage.create({
        eventId: input.eventId,
        userId: ctx.user._id,
        body: input.body,
      });
      return { id: String(doc._id) };
    }),
});
