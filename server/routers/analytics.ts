import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Order, OrderItem, Ticket } from "../models/index.js";
import { proProcedure, router } from "../_core/trpc.js";
import { userCanManageEvent } from "../services/cohost.js";

export const analyticsRouter = router({
  summary: proProcedure.input(z.object({ eventId: z.string() })).query(async ({ input, ctx }) => {
    const ok = await userCanManageEvent(ctx.user._id, input.eventId);
    if (!ok) throw new TRPCError({ code: "FORBIDDEN" });

    const orders = await Order.find({ eventId: input.eventId, status: "paid" }).lean();
    const revenue = orders.reduce((s, o) => s + o.totalAmount, 0);
    const ticketsSold = await Ticket.countDocuments({ eventId: input.eventId, status: { $ne: "cancelled" } });

    return {
      orderCount: orders.length,
      revenue,
      ticketsSold,
    };
  }),

  salesTrend: proProcedure
    .input(
      z.object({
        eventId: z.string(),
        period: z.enum(["7d", "30d"]).default("7d"),
      })
    )
    .query(async ({ input, ctx }) => {
      const ok = await userCanManageEvent(ctx.user._id, input.eventId);
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });

      const days = input.period === "7d" ? 7 : 30;
      const since = new Date(Date.now() - days * 86400000);
      const orders = await Order.find({
        eventId: input.eventId,
        status: "paid",
        paidAt: { $gte: since },
      }).lean();

      const buckets: Record<string, { date: string; amount: number; count: number }> = {};
      for (const o of orders) {
        const d = (o.paidAt ?? o.createdAt).toISOString().slice(0, 10);
        if (!buckets[d]) buckets[d] = { date: d, amount: 0, count: 0 };
        buckets[d].amount += o.totalAmount;
        buckets[d].count += 1;
      }
      return Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date));
    }),

  revenueByTicketType: proProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input, ctx }) => {
      const ok = await userCanManageEvent(ctx.user._id, input.eventId);
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });

      const orders = await Order.find({ eventId: input.eventId, status: "paid" }).select("_id").lean();
      const orderIds = orders.map((o) => o._id);
      const items = await OrderItem.find({ orderId: { $in: orderIds } }).lean();

      const map: Record<string, { name: string; quantity: number; revenue: number }> = {};
      for (const it of items) {
        const key = String(it.ticketTypeId);
        if (!map[key]) map[key] = { name: it.ticketTypeName, quantity: 0, revenue: 0 };
        map[key].quantity += it.quantity;
        map[key].revenue += it.unitPrice * it.quantity;
      }
      return Object.values(map);
    }),
});
