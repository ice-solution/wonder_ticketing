import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Ticket, Event, User } from "../models/index.js";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc.js";
import { userCanManageEvent } from "../services/cohost.js";
import { isActivePro } from "../../shared/access.js";
import { sendTicketTransferNotice } from "../services/notifications.js";
import { onTicketCheckedInWebhook } from "../services/webhooks.js";

export const ticketRouter = router({
  getByCode: publicProcedure.input(z.object({ ticketCode: z.string() })).query(async ({ input }) => {
    const ticket = await Ticket.findOne({ ticketCode: input.ticketCode }).lean();
    if (!ticket) return null;
    const event = await Event.findById(ticket.eventId).lean();
    return { ticket, event };
  }),

  checkIn: protectedProcedure
    .input(z.object({ ticketCode: z.string(), eventId: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const ticket = await Ticket.findOne({ ticketCode: input.ticketCode });
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND", message: "票券不存在" });
      if (input.eventId && String(ticket.eventId) !== input.eventId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "票券不屬於此活動" });
      }
      const ok = await userCanManageEvent(ctx.user._id, String(ticket.eventId));
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      if (ticket.status === "used") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "票券已使用" });
      }
      if (ticket.status !== "valid") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "票券狀態無效" });
      }
      ticket.status = "used";
      ticket.checkedInAt = new Date();
      await ticket.save();
      void onTicketCheckedInWebhook(ticket._id).catch((e) =>
        console.error("[webhook] ticket.checked_in", e)
      );
      const event = await Event.findById(ticket.eventId).lean();
      return { ticket: ticket.toObject(), event };
    }),

  listByEvent: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input, ctx }) => {
      const ok = await userCanManageEvent(ctx.user._id, input.eventId);
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      return Ticket.find({ eventId: input.eventId }).lean();
    }),

  myTickets: protectedProcedure.query(async ({ ctx }) => {
    const tickets = await Ticket.find({
      $or: [{ holderEmail: ctx.user.email }, { transferredTo: ctx.user._id }],
      status: { $in: ["valid", "used"] },
    })
      .sort({ createdAt: -1 })
      .lean();

    const eventIds = [...new Set(tickets.map((t) => String(t.eventId)))];
    const events = await Event.find({ _id: { $in: eventIds } }).lean();
    const eventById = new Map(events.map((e) => [String(e._id), e]));

    return tickets.map((t) => {
      const ev = eventById.get(String(t.eventId));
      return {
        ...t,
        eventTitle: ev?.title,
        eventSlug: ev?.slug,
        eventDate: ev?.eventDate,
        eventVenue: ev?.venue,
      };
    });
  }),

  transfer: protectedProcedure
    .input(z.object({ ticketId: z.string(), toEmail: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const ticket = await Ticket.findById(input.ticketId);
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });
      const order = await import("../models/Order.js").then((m) => m.Order.findById(ticket.orderId));
      if (order?.buyerEmail !== ctx.user.email && ticket.holderEmail !== ctx.user.email) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      ticket.holderEmail = input.toEmail;
      ticket.status = "transferred";
      await ticket.save();

      const event = await Event.findById(ticket.eventId).lean();
      const organizer = event ? await User.findById(event.createdBy).lean() : null;
      if (event && organizer && ctx.user.email) {
        const plan =
          organizer.plan === "pro" &&
          (!organizer.planExpiresAt || organizer.planExpiresAt > new Date())
            ? ("pro" as const)
            : ("free" as const);
        void sendTicketTransferNotice({
          organizerId: String(organizer._id),
          organizerPlan: plan,
          eventId: String(event._id),
          eventTitle: event.title,
          ticketCode: ticket.ticketCode,
          fromEmail: ctx.user.email,
          toEmail: input.toEmail,
        }).catch((e) => console.error("[transfer email]", e));
      }

      return { success: true };
    }),
});
