import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { CrmTag, CrmAttendeeTag } from "../models/CrmTag.js";
import { Order } from "../models/index.js";
import { proProcedure, router } from "../_core/trpc.js";
import { userCanManageEvent } from "../services/cohost.js";

export const crmRouter = router({
  listTags: proProcedure.input(z.object({ eventId: z.string() })).query(async ({ input, ctx }) => {
    const ok = await userCanManageEvent(ctx.user._id, input.eventId);
    if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
    return CrmTag.find({ eventId: input.eventId }).sort({ sortOrder: 1 }).lean();
  }),

  createTag: proProcedure
    .input(z.object({ eventId: z.string(), name: z.string(), color: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const ok = await userCanManageEvent(ctx.user._id, input.eventId);
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      const doc = await CrmTag.create(input);
      return { id: String(doc._id) };
    }),

  deleteTag: proProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const tag = await CrmTag.findById(input.id);
      if (!tag) throw new TRPCError({ code: "NOT_FOUND" });
      const ok = await userCanManageEvent(ctx.user._id, String(tag.eventId));
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      await CrmAttendeeTag.deleteMany({ tagId: tag._id });
      await CrmTag.deleteOne({ _id: tag._id });
      return { success: true };
    }),

  assignTag: proProcedure
    .input(
      z.object({
        eventId: z.string(),
        tagId: z.string(),
        attendeeEmail: z.string().email(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const ok = await userCanManageEvent(ctx.user._id, input.eventId);
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      await CrmAttendeeTag.create({
        eventId: input.eventId,
        tagId: input.tagId,
        attendeeEmail: input.attendeeEmail,
        taggedBy: ctx.user._id,
      });
      return { success: true };
    }),

  listAttendees: proProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input, ctx }) => {
      const ok = await userCanManageEvent(ctx.user._id, input.eventId);
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      const orders = await Order.find({ eventId: input.eventId, status: "paid" }).lean();
      const tags = await CrmAttendeeTag.find({ eventId: input.eventId }).lean();
      return orders.map((o) => ({
        email: o.buyerEmail,
        name: o.buyerName,
        tags: tags.filter((t) => t.attendeeEmail === o.buyerEmail).map((t) => String(t.tagId)),
      }));
    }),
});
