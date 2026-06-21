import { Event, Ticket, User } from "../models/index.js";
import type { IOrder } from "../models/Order.js";
import { sendOrderConfirmation } from "./notifications.js";
import { onOrderPaidWebhook } from "./webhooks.js";

export async function runPostPaymentHooks(order: IOrder) {
  try {
    const [event, tickets, organizer] = await Promise.all([
      Event.findById(order.eventId).lean(),
      Ticket.find({ orderId: order._id }).lean(),
      Event.findById(order.eventId)
        .lean()
        .then((ev) => (ev ? User.findById(ev.createdBy).lean() : null)),
    ]);

    if (event && organizer) {
      const plan =
        organizer.plan === "pro" &&
        (!organizer.planExpiresAt || organizer.planExpiresAt > new Date())
          ? ("pro" as const)
          : ("free" as const);

      await sendOrderConfirmation({
        organizerId: String(organizer._id),
        organizerPlan: plan,
        eventId: String(event._id),
        eventTitle: event.title,
        eventDate: event.eventDate,
        venue: event.venue,
        buyerEmail: order.buyerEmail,
        buyerName: order.buyerName,
        orderNumber: order.orderNumber,
        ticketCodes: tickets.map((t) => t.ticketCode),
      });
    }

    await onOrderPaidWebhook(order._id);
  } catch (e) {
    console.error("[postPayment]", e);
  }
}
