import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Subscription, User } from "../models/index.js";
import { protectedProcedure, router } from "../_core/trpc.js";
import { isActivePro } from "../../shared/access.js";
import { PRO_MONTHLY_PRICE_HKD } from "../../shared/const.js";
import { isPaymentMockMode } from "../payment.js";
import { getPaymentStatus, createSubscriptionPaymentSession } from "../services/paymentConfig.js";
import {
  activateSubscriptionPayment,
  createPendingSubscriptionPayment,
} from "../services/subscriptionPayment.js";

export const subscriptionRouter = router({
  status: protectedProcedure.query(async ({ ctx }) => {
    const sub = await Subscription.findOne({ userId: ctx.user._id }).lean();
    const user = await User.findById(ctx.user._id).lean();
    const payment = getPaymentStatus();
    return {
      plan: user?.plan ?? "free",
      isPro: isActivePro(ctx.user),
      planExpiresAt: user?.planExpiresAt ?? null,
      cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
      subscription: sub,
      priceMonthly: PRO_MONTHLY_PRICE_HKD,
      currency: "HKD",
      paymentMode: payment.mode,
      paymentConfigured: payment.configured,
      isPending: sub?.status === "pending",
      pendingOrderNumber: sub?.status === "pending" ? sub.wonderPaymentSubscriptionId : null,
    };
  }),

  upgrade: protectedProcedure
    .input(
      z.object({
        origin: z.string().url(),
        paymentMethod: z.enum(["fps", "payme", "wechat", "alipay", "card"]).default("card"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (isActivePro(ctx.user)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "您已是 Pro 用戶" });
      }

      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      if (isPaymentMockMode()) {
        await User.updateOne(
          { _id: ctx.user._id },
          { plan: "pro", planExpiresAt: periodEnd }
        );
        await Subscription.findOneAndUpdate(
          { userId: ctx.user._id },
          {
            userId: ctx.user._id,
            plan: "pro",
            status: "active",
            currentPeriodStart: new Date(),
            currentPeriodEnd: periodEnd,
            wonderPaymentSubscriptionId: `mock_sub_${ctx.user._id}`,
          },
          { upsert: true }
        );
        return { paymentUrl: `${input.origin}/dashboard/subscription?upgraded=1`, mock: true };
      }

      const orderNumber = `SUB-${Date.now()}`;
      await createPendingSubscriptionPayment(String(ctx.user._id), orderNumber);
      const session = await createSubscriptionPaymentSession({
        userId: String(ctx.user._id),
        orderNumber,
        origin: input.origin,
      });
      return { paymentUrl: session.paymentUrl, mock: false, orderNumber };
    }),

  cancel: protectedProcedure.mutation(async ({ ctx }) => {
    if (!isActivePro(ctx.user)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "目前沒有 Pro 訂閱" });
    }

    const user = await User.findById(ctx.user._id).lean();
    const periodEnd = user?.planExpiresAt ?? new Date();

    let sub = await Subscription.findOne({ userId: ctx.user._id });
    if (!sub) {
      sub = await Subscription.create({
        userId: ctx.user._id,
        plan: "pro",
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: true,
      });
      return { success: true, cancelAtPeriodEnd: true };
    }

    if (sub.cancelAtPeriodEnd) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "已排程於本期結束後取消" });
    }

    sub.cancelAtPeriodEnd = true;
    await sub.save();
    return { success: true, cancelAtPeriodEnd: true };
  }),
});
