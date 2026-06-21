import crypto from "crypto";
import {
  WebhookEndpoint,
  WebhookDelivery,
  Event,
  Order,
  Ticket,
} from "../models/index.js";
import type mongoose from "mongoose";

export const WEBHOOK_EVENTS = [
  "order.paid",
  "order.refunded",
  "ticket.checked_in",
  "event.published",
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENTS)[number];

function signPayload(secret: string, body: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

async function deliverOnce(
  endpointId: mongoose.Types.ObjectId,
  url: string,
  secret: string,
  eventType: WebhookEventType,
  payload: Record<string, unknown>
) {
  const body = JSON.stringify({ type: eventType, data: payload, createdAt: new Date().toISOString() });
  const signature = signPayload(secret, body);

  const delivery = await WebhookDelivery.create({
    endpointId,
    eventType,
    payload,
    status: "pending",
    attempts: 1,
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Wonder-Signature": signature,
        "X-Wonder-Event": eventType,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) {
      await WebhookDelivery.updateOne(
        { _id: delivery._id },
        { status: "success", deliveredAt: new Date() }
      );
    } else {
      const text = await res.text().catch(() => "");
      await WebhookDelivery.updateOne(
        { _id: delivery._id },
        { status: "failed", lastError: `HTTP ${res.status}: ${text.slice(0, 200)}` }
      );
    }
  } catch (e) {
    await WebhookDelivery.updateOne(
      { _id: delivery._id },
      { status: "failed", lastError: (e as Error).message }
    );
  }
}

export async function dispatchOrganizerWebhook(
  organizerId: mongoose.Types.ObjectId | string,
  eventType: WebhookEventType,
  payload: Record<string, unknown>
) {
  const endpoints = await WebhookEndpoint.find({
    organizerId,
    active: true,
    events: eventType,
  }).lean();

  await Promise.all(
    endpoints.map((ep) =>
      deliverOnce(ep._id, ep.url, ep.secret, eventType, payload)
    )
  );
}

export async function onTicketCheckedInWebhook(ticketId: mongoose.Types.ObjectId | string) {
  const ticket = await Ticket.findById(ticketId).lean();
  if (!ticket) return;
  const event = await Event.findById(ticket.eventId).lean();
  if (!event) return;

  await dispatchOrganizerWebhook(String(event.createdBy), "ticket.checked_in", {
    ticketId: String(ticket._id),
    ticketCode: ticket.ticketCode,
    eventId: String(ticket.eventId),
    eventSlug: event.slug,
    holderEmail: ticket.holderEmail,
    checkedInAt: ticket.checkedInAt?.toISOString(),
  });
}

export async function onEventPublishedWebhook(eventId: mongoose.Types.ObjectId | string) {
  const event = await Event.findById(eventId).lean();
  if (!event) return;

  await dispatchOrganizerWebhook(String(event.createdBy), "event.published", {
    eventId: String(event._id),
    eventSlug: event.slug,
    title: event.title,
    eventDate: event.eventDate?.toISOString(),
    venue: event.venue,
    publishedAt: new Date().toISOString(),
  });
}

export async function onOrderPaidWebhook(orderId: mongoose.Types.ObjectId | string) {
  const order = await Order.findById(orderId).lean();
  if (!order) return;
  const event = await Event.findById(order.eventId).lean();
  if (!event) return;
  const tickets = await Ticket.find({ orderId: order._id }).lean();

  await dispatchOrganizerWebhook(String(event.createdBy), "order.paid", {
    orderId: String(order._id),
    orderNumber: order.orderNumber,
    eventId: String(order.eventId),
    eventSlug: event.slug,
    buyerEmail: order.buyerEmail,
    totalAmount: order.totalAmount,
    currency: order.currency,
    ticketCount: tickets.length,
    paidAt: order.paidAt?.toISOString(),
  });
}

export async function onOrderRefundedWebhook(orderId: mongoose.Types.ObjectId | string) {
  const order = await Order.findById(orderId).lean();
  if (!order) return;
  const event = await Event.findById(order.eventId).lean();
  if (!event) return;

  await dispatchOrganizerWebhook(String(event.createdBy), "order.refunded", {
    orderId: String(order._id),
    orderNumber: order.orderNumber,
    eventId: String(order.eventId),
    eventSlug: event.slug,
    buyerEmail: order.buyerEmail,
    totalAmount: order.totalAmount,
    currency: order.currency,
    refundedAt: order.refundedAt?.toISOString(),
  });
}
