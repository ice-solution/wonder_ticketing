import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { WaitlistEntry } from "../models/index.js";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc.js";
import { userCanManageEvent } from "../services/cohost.js";

export const waitlistRouter = router({
  join: publicProcedure
    .input(
      z.object({
        eventId: z.string(),
        ticketTypeId: z.string().optional(),
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        quantity: z.number().int().positive().default(1),
      })
    )
    .mutation(async ({ input }) => {
      const position =
        (await WaitlistEntry.countDocuments({ eventId: input.eventId, status: "waiting" })) + 1;
      await WaitlistEntry.create({ ...input, status: "waiting" });
      return { position };
    }),

  list: protectedProcedure.input(z.object({ eventId: z.string() })).query(async ({ input, ctx }) => {
    const ok = await userCanManageEvent(ctx.user._id, input.eventId);
    if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
    return WaitlistEntry.find({ eventId: input.eventId }).sort({ createdAt: 1 }).lean();
  }),

  approve: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const entry = await WaitlistEntry.findById(input.id);
      if (!entry) throw new TRPCError({ code: "NOT_FOUND" });
      const ok = await userCanManageEvent(ctx.user._id, String(entry.eventId));
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      entry.status = "notified";
      entry.notifiedAt = new Date();
      await entry.save();
      return { success: true };
    }),

  reject: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const entry = await WaitlistEntry.findById(input.id);
      if (!entry) throw new TRPCError({ code: "NOT_FOUND" });
      const ok = await userCanManageEvent(ctx.user._id, String(entry.eventId));
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      entry.status = "expired";
      await entry.save();
      return { success: true };
    }),
});
