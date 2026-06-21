import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Order, OrderItem, Ticket, Event, CustomQuestion, QuestionResponse } from "../models/index.js";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc.js";
import { CheckoutInputSchema, WalkInCheckoutSchema } from "../../shared/schemas/order.js";
import { createPendingOrder, fulfillPaidOrder } from "../services/orderFulfillment.js";
import { refundOrder as processRefund } from "../services/refundOrder.js";
import { createPaymentSession } from "../payment.js";
import { activateSubscriptionPayment } from "../services/subscriptionPayment.js";
import { userCanManageEvent } from "../services/cohost.js";
import { resolveEventAccess, accessDeniedMessage } from "../lib/eventAccess.js";
import { canAccessMembersOnlyEvent } from "../../shared/access.js";

export const orderRouter = router({
  checkout: publicProcedure.input(CheckoutInputSchema).mutation(async ({ input, ctx }) => {
    const event = await Event.findById(input.eventId).lean();
    if (!event) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "活動不存在" });
    }
    const { allowed } = await resolveEventAccess(event, ctx, input.inviteToken);
    if (!allowed) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: accessDeniedMessage(event.visibility),
      });
    }
    if (event?.visibility === "members_only") {
      if (!canAccessMembersOnlyEvent(ctx.user, !!ctx.user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "此活動僅限 Pro 會員購票，請登入並升級",
        });
      }
    }
    try {
      const { order, event: ev, orderNumber } = await createPendingOrder(input);
      const session = await createPaymentSession({
        orderId: String(order._id),
        orderNumber,
        amount: order.totalAmount,
        currency: order.currency ?? "HKD",
        paymentMethod: input.paymentMethod,
        buyerEmail: input.buyerEmail,
        buyerName: input.buyerName,
        eventTitle: ev.title,
        origin: input.origin,
        metadata: { eventId: String(ev._id), eventSlug: ev.slug },
      });
      await Order.updateOne(
        { _id: order._id },
        { wonderPaymentId: session.sessionId, wonderPaymentStatus: "pending" }
      );
      return { paymentUrl: session.paymentUrl, orderNumber };
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === "INSUFFICIENT_STOCK") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "票券庫存不足" });
      }
      if (msg === "EVENT_NOT_AVAILABLE") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "活動不可購票" });
      }
      if (msg === "SEAT_COUNT_MISMATCH") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "選座數量須與購票數量一致" });
      }
      if (msg === "SEAT_RESERVATION_REQUIRED" || msg === "SEAT_RESERVATION_INVALID") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "座位預留已失效，請重新選座" });
      }
      throw e;
    }
  }),

  walkInCheckout: protectedProcedure
    .input(WalkInCheckoutSchema)
    .mutation(async ({ input, ctx }) => {
      const ok = await userCanManageEvent(ctx.user._id, input.eventId);
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      const { order, orderNumber } = await createPendingOrder(
        {
          ...input,
          paymentMethod: "card",
          origin: envOrigin(),
          locale: "zh-TW",
        },
        { walkIn: true, recordedBy: String(ctx.user._id) }
      );
      const tickets = await Ticket.find({ orderId: order._id }).lean();
      return { orderNumber, orderId: String(order._id), tickets };
    }),

  getByNumber: publicProcedure
    .input(z.object({ orderNumber: z.string() }))
    .query(async ({ input }) => {
      const order = await Order.findOne({ orderNumber: input.orderNumber }).lean();
      if (!order) return null;
      const items = await OrderItem.find({ orderId: order._id }).lean();
      const tickets = await Ticket.find({ orderId: order._id }).lean();
      const event = await Event.findById(order.eventId).lean();
      return { order, items, tickets, event };
    }),

  getOrganizerDetail: protectedProcedure
    .input(z.object({ orderNumber: z.string() }))
    .query(async ({ input, ctx }) => {
      const order = await Order.findOne({ orderNumber: input.orderNumber }).lean();
      if (!order) return null;
      const ok = await userCanManageEvent(ctx.user._id, String(order.eventId));
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      const [items, tickets, event, questions, responses] = await Promise.all([
        OrderItem.find({ orderId: order._id }).lean(),
        Ticket.find({ orderId: order._id }).lean(),
        Event.findById(order.eventId).lean(),
        CustomQuestion.find({ eventId: order.eventId }).sort({ sortOrder: 1 }).lean(),
        QuestionResponse.find({ orderId: order._id }).lean(),
      ]);
      const qMap = new Map(questions.map((q) => [String(q._id), q.question]));
      const questionAnswers = responses.map((r) => ({
        question: qMap.get(String(r.questionId)) ?? "—",
        answer: r.answer,
      }));
      return { order, items, tickets, event, questionAnswers };
    }),

  listMine: protectedProcedure
    .input(z.object({ eventId: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      if (input.eventId) {
        const ok = await userCanManageEvent(ctx.user._id, input.eventId);
        if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
        return Order.find({ eventId: input.eventId }).sort({ createdAt: -1 }).lean();
      }
      const events = await Event.find({ createdBy: ctx.user._id }).select("_id").lean();
      const ids = events.map((e) => e._id);
      return Order.find({ eventId: { $in: ids } })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();
    }),

  exportCSV: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input, ctx }) => {
      const ok = await userCanManageEvent(ctx.user._id, input.eventId);
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      const [orders, questions] = await Promise.all([
        Order.find({ eventId: input.eventId, status: "paid" }).lean(),
        CustomQuestion.find({ eventId: input.eventId }).sort({ sortOrder: 1 }).lean(),
      ]);
      const orderIds = orders.map((o) => o._id);
      const responses = await QuestionResponse.find({ orderId: { $in: orderIds } }).lean();
      const answerMap = new Map<string, Map<string, string>>();
      for (const r of responses) {
        const oid = String(r.orderId);
        if (!answerMap.has(oid)) answerMap.set(oid, new Map());
        answerMap.get(oid)!.set(String(r.questionId), r.answer);
      }
      const qHeaders = questions.map((q) => escapeCsv(q.question));
      const header = `orderNumber,buyerName,buyerEmail,buyerPhone,totalAmount,paidAt${qHeaders.length ? "," + qHeaders.join(",") : ""}\n`;
      const rows = orders
        .map((o) => {
          const base = [
            o.orderNumber,
            escapeCsv(o.buyerName),
            o.buyerEmail,
            o.buyerPhone ?? "",
            o.totalAmount,
            o.paidAt?.toISOString() ?? "",
          ];
          const answers = questions.map((q) =>
            escapeCsv(answerMap.get(String(o._id))?.get(String(q._id)) ?? "")
          );
          return [...base, ...answers].join(",");
        })
        .join("\n");
      return { csv: header + rows };
    }),

  refund: protectedProcedure
    .input(z.object({ orderNumber: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const order = await Order.findOne({ orderNumber: input.orderNumber });
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "訂單不存在" });
      const ok = await userCanManageEvent(ctx.user._id, String(order.eventId));
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      if (order.status !== "paid") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "僅已付款訂單可退款" });
      }
      try {
        const result = await processRefund(order._id);
        return { success: true, orderNumber: result.order.orderNumber };
      } catch (e) {
        const msg = (e as Error).message;
        if (msg === "ORDER_NOT_REFUNDABLE") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "此訂單無法退款" });
        }
        throw e;
      }
    }),
});

function escapeCsv(s: string) {
  return `"${s.replace(/"/g, '""')}"`;
}

function envOrigin() {
  return process.env.WEBHOOK_BASE_URL ?? "http://localhost:3000";
}

export async function handlePaymentSuccess(orderNumber: string) {
  if (orderNumber.startsWith("SUB-")) {
    await activateSubscriptionPayment(orderNumber);
    return;
  }
  const order = await Order.findOne({ orderNumber });
  if (!order) return;
  if (order.status === "paid") return;
  await Order.updateOne(
    { _id: order._id },
    { wonderPaymentStatus: "paid", updatedAt: new Date() }
  );
  await fulfillPaidOrder(order._id);
}
