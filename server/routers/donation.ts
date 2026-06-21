import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Donation, Event } from "../models/index.js";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc.js";
import { createPaymentSession } from "../payment.js";
import { userCanManageEvent } from "../services/cohost.js";
import { generateOrderNumber } from "../lib/ids.js";

export const donationRouter = router({
  donate: publicProcedure
    .input(
      z.object({
        eventId: z.string(),
        amount: z.number().positive(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        message: z.string().optional(),
        isAnonymous: z.boolean().optional(),
        origin: z.string().url(),
        paymentMethod: z.enum(["fps", "payme", "wechat", "alipay", "card"]).default("fps"),
      })
    )
    .mutation(async ({ input }) => {
      const event = await Event.findById(input.eventId);
      if (!event?.enableDonation) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "此活動未開啟捐款" });
      }
      const ref = generateOrderNumber();
      const donation = await Donation.create({
        eventId: event._id,
        donorName: input.isAnonymous ? undefined : input.name,
        donorEmail: input.email,
        amount: input.amount,
        message: input.message,
        isAnonymous: input.isAnonymous ?? false,
        status: "pending",
      });
      const session = await createPaymentSession({
        orderId: String(donation._id),
        orderNumber: ref,
        amount: input.amount,
        currency: "HKD",
        paymentMethod: input.paymentMethod,
        buyerEmail: input.email ?? "donor@example.com",
        buyerName: input.name ?? "Donor",
        eventTitle: `${event.title} Donation`,
        origin: input.origin,
        metadata: { type: "donation", donationId: String(donation._id) },
      });
      await Donation.updateOne({ _id: donation._id }, { wonderPaymentId: session.sessionId });
      return { paymentUrl: session.paymentUrl, donationId: String(donation._id) };
    }),

  listByEvent: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input, ctx }) => {
      const ok = await userCanManageEvent(ctx.user._id, input.eventId);
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      return Donation.find({ eventId: input.eventId, status: "completed" }).lean();
    }),

  getStats: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input, ctx }) => {
      const ok = await userCanManageEvent(ctx.user._id, input.eventId);
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      const event = await Event.findById(input.eventId).lean();
      const rows = await Donation.find({ eventId: input.eventId, status: "completed" }).lean();
      const total = rows.reduce((s, d) => s + d.amount, 0);
      return { total, count: rows.length, goal: event?.donationGoal ?? null };
    }),
});
