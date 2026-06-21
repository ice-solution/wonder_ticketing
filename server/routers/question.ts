import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { CustomQuestion, Order, QuestionResponse } from "../models/index.js";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc.js";
import { userCanManageEvent } from "../services/cohost.js";

const questionSchema = z.object({
  eventId: z.string(),
  question: z.string().min(1).max(500),
  questionEn: z.string().max(500).optional(),
  type: z.enum(["text", "select", "checkbox", "radio"]).default("text"),
  options: z.array(z.string()).optional(),
  isRequired: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const questionRouter = router({
  listForCheckout: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      return CustomQuestion.find({ eventId: input.eventId }).sort({ sortOrder: 1 }).lean();
    }),

  list: protectedProcedure.input(z.object({ eventId: z.string() })).query(async ({ input, ctx }) => {
    const ok = await userCanManageEvent(ctx.user._id, input.eventId);
    if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
    return CustomQuestion.find({ eventId: input.eventId }).sort({ sortOrder: 1 }).lean();
  }),

  create: protectedProcedure.input(questionSchema).mutation(async ({ input, ctx }) => {
    const ok = await userCanManageEvent(ctx.user._id, input.eventId);
    if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
    const doc = await CustomQuestion.create(input);
    return { id: String(doc._id) };
  }),

  update: protectedProcedure
    .input(questionSchema.partial().extend({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const q = await CustomQuestion.findById(input.id);
      if (!q) throw new TRPCError({ code: "NOT_FOUND" });
      const ok = await userCanManageEvent(ctx.user._id, String(q.eventId));
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      await CustomQuestion.updateOne({ _id: id }, { $set: data });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const q = await CustomQuestion.findById(input.id);
      if (!q) throw new TRPCError({ code: "NOT_FOUND" });
      const ok = await userCanManageEvent(ctx.user._id, String(q.eventId));
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      await CustomQuestion.deleteOne({ _id: input.id });
      return { success: true };
    }),

  listResponses: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input, ctx }) => {
      const ok = await userCanManageEvent(ctx.user._id, input.eventId);
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      const orders = await Order.find({ eventId: input.eventId })
        .select("_id orderNumber buyerName buyerEmail paidAt createdAt")
        .sort({ createdAt: -1 })
        .lean();
      const orderIds = orders.map((o) => o._id);
      const [questions, responses] = await Promise.all([
        CustomQuestion.find({ eventId: input.eventId }).sort({ sortOrder: 1 }).lean(),
        QuestionResponse.find({ orderId: { $in: orderIds } }).lean(),
      ]);
      const qMap = new Map(questions.map((q) => [String(q._id), q.question]));
      const answersByOrder = new Map<string, { question: string; answer: string }[]>();
      for (const r of responses) {
        const oid = String(r.orderId);
        const list = answersByOrder.get(oid) ?? [];
        list.push({
          question: qMap.get(String(r.questionId)) ?? "—",
          answer: r.answer,
        });
        answersByOrder.set(oid, list);
      }
      return orders.map((o) => ({
        orderId: String(o._id),
        orderNumber: o.orderNumber,
        buyerName: o.buyerName,
        buyerEmail: o.buyerEmail,
        paidAt: o.paidAt,
        createdAt: o.createdAt,
        answers: answersByOrder.get(String(o._id)) ?? [],
      }));
    }),
});
