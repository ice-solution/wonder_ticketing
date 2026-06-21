import mongoose from "mongoose";
import { Order, OrderItem, Ticket, TicketType, Event } from "../models/index.js";
import { onOrderRefundedWebhook } from "./webhooks.js";

export async function refundOrder(orderId: mongoose.Types.ObjectId | string) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.status !== "paid") throw new Error("ORDER_NOT_REFUNDABLE");

  const items = await OrderItem.find({ orderId: order._id });
  for (const item of items) {
    await TicketType.updateOne({ _id: item.ticketTypeId }, { $inc: { sold: -item.quantity } });
  }

  await Ticket.updateMany(
    { orderId: order._id, status: { $in: ["valid", "used"] } },
    { status: "cancelled" }
  );

  order.status = "refunded";
  order.refundedAt = new Date();
  await order.save();

  void onOrderRefundedWebhook(order._id).catch((e) => console.error("[webhook] order.refunded", e));

  const event = await Event.findById(order.eventId).lean();
  return { order: order.toObject(), event };
}
