import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { TicketType } from "../models/index.js";
import { protectedProcedure, router } from "../_core/trpc.js";
import { userCanManageEvent } from "../services/cohost.js";

const ticketTypeInput = z.object({
  eventId: z.string(),
  name: z.string().min(1),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  price: z.number().min(0),
  quantity: z.number().int().positive(),
  minPerOrder: z.number().int().positive().optional(),
  maxPerOrder: z.number().int().positive().optional(),
  requireApproval: z.boolean().optional(),
  unlockCode: z.string().optional(),
  salesStart: z.coerce.date().optional(),
  salesEnd: z.coerce.date().optional(),
});

export const ticketTypeRouter = router({
  list: protectedProcedure.input(z.object({ eventId: z.string() })).query(async ({ input, ctx }) => {
    const ok = await userCanManageEvent(ctx.user._id, input.eventId);
    if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
    return TicketType.find({ eventId: input.eventId }).sort({ sortOrder: 1 }).lean();
  }),

  create: protectedProcedure.input(ticketTypeInput).mutation(async ({ input, ctx }) => {
    const ok = await userCanManageEvent(ctx.user._id, input.eventId);
    if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
    const doc = await TicketType.create(input);
    return { id: String(doc._id) };
  }),

  update: protectedProcedure
    .input(ticketTypeInput.partial().extend({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const tt = await TicketType.findById(input.id);
      if (!tt) throw new TRPCError({ code: "NOT_FOUND" });
      const ok = await userCanManageEvent(ctx.user._id, String(tt.eventId));
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      await TicketType.updateOne({ _id: id }, { $set: { ...data, updatedAt: new Date() } });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const tt = await TicketType.findById(input.id);
      if (!tt) throw new TRPCError({ code: "NOT_FOUND" });
      const ok = await userCanManageEvent(ctx.user._id, String(tt.eventId));
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      await TicketType.deleteOne({ _id: input.id });
      return { success: true };
    }),
});
