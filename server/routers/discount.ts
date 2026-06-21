import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { DiscountCode } from "../models/index.js";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc.js";
import { userCanManageEvent } from "../services/cohost.js";

const createSchema = z.object({
  eventId: z.string(),
  code: z.string().min(2).max(32),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().positive(),
  maxUses: z.number().int().positive().optional(),
  minOrderAmount: z.number().min(0).optional(),
  validFrom: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional(),
});

export const discountRouter = router({
  create: protectedProcedure.input(createSchema).mutation(async ({ input, ctx }) => {
    const ok = await userCanManageEvent(ctx.user._id, input.eventId);
    if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
    const doc = await DiscountCode.create({ ...input, code: input.code.toUpperCase() });
    return { id: String(doc._id) };
  }),

  validate: publicProcedure
    .input(z.object({ code: z.string(), eventId: z.string() }))
    .query(async ({ input }) => {
      const dc = await DiscountCode.findOne({
        eventId: input.eventId,
        code: input.code.toUpperCase(),
        status: "active",
      }).lean();
      if (!dc) return { valid: false as const, discount: null };
      if (dc.maxUses != null && (dc.usedCount ?? 0) >= dc.maxUses) {
        return { valid: false as const, discount: null };
      }
      const now = new Date();
      if (dc.validFrom && dc.validFrom > now) return { valid: false as const, discount: null };
      if (dc.validUntil && dc.validUntil < now) return { valid: false as const, discount: null };
      return {
        valid: true as const,
        discount: { type: dc.type, value: dc.value, id: String(dc._id) },
      };
    }),

  list: protectedProcedure.input(z.object({ eventId: z.string() })).query(async ({ input, ctx }) => {
    const ok = await userCanManageEvent(ctx.user._id, input.eventId);
    if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
    return DiscountCode.find({ eventId: input.eventId }).lean();
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const dc = await DiscountCode.findById(input.id);
      if (!dc) throw new TRPCError({ code: "NOT_FOUND" });
      const ok = await userCanManageEvent(ctx.user._id, String(dc.eventId));
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      await DiscountCode.deleteOne({ _id: input.id });
      return { success: true };
    }),
});
