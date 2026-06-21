import mongoose from "mongoose";
import {
  Order,
  OrderItem,
  Ticket,
  TicketType,
  Event,
  DiscountCode,
  QuestionResponse,
  User,
} from "../models/index.js";
import { generateTicketCode } from "../lib/ids.js";
import { calculatePlatformFee } from "../featureGate.js";
import { markSeatsSold, validateSeatReservation } from "./seat.js";
import { findActivePeerReferral, calculatePeerReferralDiscount, recordPeerReferralRedemption } from "./peerReferral.js";
import type { CheckoutInputSchema } from "../../shared/schemas/order.js";
import type { z } from "zod";

type CheckoutInput = z.infer<typeof CheckoutInputSchema>;

export async function fulfillPaidOrder(orderId: mongoose.Types.ObjectId | string) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.status === "paid") return order;

  order.status = "paid";
  order.paidAt = new Date();
  await order.save();

  if (order.referralCodeUsed) {
    await recordPeerReferralRedemption(order.referralCodeUsed, order.eventId);
  }

  const items = await OrderItem.find({ orderId: order._id });
  for (const item of items) {
    await TicketType.updateOne({ _id: item.ticketTypeId }, { $inc: { sold: item.quantity } });

    const rawAttendees = item.attendees as { name?: string; email?: string; phone?: string }[] | undefined;
    const attendees = rawAttendees?.length
      ? rawAttendees
      : Array.from({ length: item.quantity }, () => ({
          name: order.buyerName,
          email: order.buyerEmail,
          phone: order.buyerPhone,
        }));

    for (let i = 0; i < item.quantity; i++) {
      const att = attendees[i] ?? attendees[0];
      const seatNumber = item.seatNumbers?.[i];
      const ticket = await Ticket.create({
        ticketCode: generateTicketCode(),
        orderId: order._id,
        orderItemId: item._id,
        eventId: order.eventId,
        ticketTypeId: item.ticketTypeId,
        ticketTypeName: item.ticketTypeName,
        holderName: att?.name ?? order.buyerName,
        holderEmail: att?.email ?? order.buyerEmail,
        holderPhone: att?.phone ?? order.buyerPhone,
        seatNumber,
        status: "valid",
      });
      if (seatNumber) {
        await markSeatsSold(order.eventId, [seatNumber], ticket._id);
      }
    }
  }

  void import("./postPayment.js").then((m) => m.runPostPaymentHooks(order));

  return order;
}

export async function createPendingOrder(
  input: CheckoutInput,
  opts?: { walkIn?: boolean; recordedBy?: string }
) {
  const event = await Event.findById(input.eventId).lean();
  if (!event || (event.status !== "published" && !opts?.walkIn)) {
    throw new Error("EVENT_NOT_AVAILABLE");
  }

  const organizer = await User.findById(event.createdBy).lean();
  const organizerPlan =
    organizer?.plan === "pro" && (!organizer.planExpiresAt || organizer.planExpiresAt > new Date())
      ? "pro"
      : "free";

  let discountAmount = 0;
  let discountCodeId: mongoose.Types.ObjectId | undefined;

  if (input.discountCode) {
    const dc = await DiscountCode.findOne({
      eventId: event._id,
      code: input.discountCode.toUpperCase(),
      status: "active",
    });
    if (dc) discountCodeId = dc._id;
  }

  const lineItems: {
    ticketTypeId: mongoose.Types.ObjectId;
    ticketTypeName: string;
    quantity: number;
    unitPrice: number;
    seatNumbers?: string[];
    attendees?: { name: string; email?: string; phone?: string }[];
  }[] = [];

  const allSeatNumbers = input.items.flatMap((i) => i.seatNumbers ?? []);
  if (event.enableSeating) {
    const ticketCount = input.items.reduce((s, i) => s + i.quantity, 0);
    if (allSeatNumbers.length !== ticketCount) {
      throw new Error("SEAT_COUNT_MISMATCH");
    }
    if (!input.reservationId) throw new Error("SEAT_RESERVATION_REQUIRED");
    await validateSeatReservation(event._id, allSeatNumbers, input.reservationId);
  }

  let subtotal = 0;

  for (const item of input.items) {
    const tt = await TicketType.findOne({
      _id: item.ticketTypeId,
      eventId: event._id,
      status: "active",
    });
    if (!tt) throw new Error("INVALID_TICKET_TYPE");
    const available = tt.quantity - (tt.sold ?? 0);
    if (item.quantity > available) throw new Error("INSUFFICIENT_STOCK");

    subtotal += tt.price * item.quantity;
    lineItems.push({
      ticketTypeId: tt._id,
      ticketTypeName: tt.name,
      quantity: item.quantity,
      unitPrice: tt.price,
      seatNumbers: item.seatNumbers,
      attendees: item.attendees,
    });
  }

  if (discountCodeId) {
    const dc = await DiscountCode.findById(discountCodeId);
    if (dc) {
      discountAmount =
        dc.type === "percentage"
          ? Math.round(subtotal * (dc.value / 100) * 100) / 100
          : Math.min(dc.value, subtotal);
    }
  }

  let peerReferralCode: string | undefined;
  if (input.referralCode?.trim()) {
    const peerRef = await findActivePeerReferral(input.referralCode.trim(), event._id);
    if (peerRef) {
      const afterCode = Math.max(0, subtotal - discountAmount);
      const peerOff = calculatePeerReferralDiscount(afterCode, peerRef);
      if (peerOff > 0) {
        discountAmount += peerOff;
        peerReferralCode = peerRef.code;
      }
    }
  }

  const donationAmount = input.donationAmount ?? 0;
  const totalAmount = Math.max(0, subtotal - discountAmount + donationAmount);
  const { feeAmount } = calculatePlatformFee(totalAmount, organizerPlan);

  const { generateOrderNumber } = await import("../lib/ids.js");
  const orderNumber = generateOrderNumber();

  const order = await Order.create({
    orderNumber,
    eventId: event._id,
    buyerName: input.buyerName,
    buyerEmail: input.buyerEmail,
    buyerPhone: input.buyerPhone,
    totalAmount,
    donationAmount,
    discountAmount,
    platformFee: opts?.walkIn ? 0 : feeAmount,
    currency: "HKD",
    paymentMethod: opts?.walkIn ? "walk_in" : input.paymentMethod,
    orderSource: opts?.walkIn ? "walk_in" : "online",
    status: opts?.walkIn ? "paid" : "pending",
    paidAt: opts?.walkIn ? new Date() : undefined,
    recordedBy: opts?.recordedBy,
    discountCodeId,
    referralCodeUsed: peerReferralCode ?? input.referralCode,
    seatReservationId: input.reservationId,
    locale: input.locale,
  });

  for (const li of lineItems) {
    await OrderItem.create({ orderId: order._id, ...li });
  }

  if (input.customAnswers?.length) {
    await QuestionResponse.insertMany(
      input.customAnswers.map((a) => ({
        orderId: order._id,
        questionId: a.questionId,
        answer: a.answer,
      }))
    );
  }

  if (opts?.walkIn) {
    await fulfillPaidOrder(order._id);
  }

  return { order, event, organizerPlan, orderNumber };
}
