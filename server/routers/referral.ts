import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { customAlphabet } from "nanoid";
import { Event, ReferralCode, ReferralUse, User } from "../models/index.js";
import { protectedProcedure, proProcedure, publicProcedure, router } from "../_core/trpc.js";
import { userCanManageEvent } from "../services/cohost.js";
import {
  calculatePeerReferralDiscount,
  findActivePeerReferral,
  peerReferralRewardLabel,
} from "../services/peerReferral.js";
const genCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

export const referralRouter = router({
  getMyCode: protectedProcedure.query(async ({ ctx }) => {
    let doc = await ReferralCode.findOne({
      userId: ctx.user._id,
      type: "organizer",
      status: "active",
    }).lean();
    if (!doc) {
      const user = await User.findById(ctx.user._id);
      const code = user?.referralCode ?? genCode();
      if (!user?.referralCode) {
        await User.updateOne({ _id: ctx.user._id }, { referralCode: code });
      }
      doc = (
        await ReferralCode.create({
          userId: ctx.user._id,
          code,
          type: "organizer",
          rewardType: "pro_month",
          maxUses: 12,
        })
      ).toObject();
    }
    return {
      code: doc.code,
      usedCount: doc.usedCount ?? 0,
      maxUses: doc.maxUses ?? 12,
    };
  }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const uses = await ReferralUse.countDocuments({ referrerId: ctx.user._id });
    const granted = await ReferralUse.countDocuments({
      referrerId: ctx.user._id,
      rewardGranted: true,
    });
    return { totalReferred: uses, freeMonths: granted };
  }),

  applyCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const ref = await ReferralCode.findOne({
        code: input.code.toUpperCase(),
        status: "active",
      });
      if (!ref) throw new TRPCError({ code: "NOT_FOUND", message: "推薦碼無效" });
      if (String(ref.userId) === String(ctx.user._id)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "不可使用自己的推薦碼" });
      }
      const existing = await ReferralUse.findOne({ refereeId: ctx.user._id });
      if (existing) throw new TRPCError({ code: "BAD_REQUEST", message: "已使用過推薦碼" });

      await ReferralUse.create({
        referralCodeId: ref._id,
        referrerId: ref.userId,
        refereeId: ctx.user._id,
        rewardGranted: true,
      });
      await ReferralCode.updateOne({ _id: ref._id }, { $inc: { usedCount: 1 } });

      const expires = new Date();
      expires.setMonth(expires.getMonth() + 1);
      await User.updateOne(
        { _id: ctx.user._id },
        { plan: "pro", planExpiresAt: expires }
      );

      return { success: true, reward: "pro_month" };
    }),

  createPeerReferral: proProcedure
    .input(
      z.object({
        eventId: z.string(),
        rewardType: z.enum(["discount", "free_ticket", "cashback"]).default("discount"),
        rewardValue: z.number().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const ok = await userCanManageEvent(ctx.user._id, input.eventId);
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });

      const code = genCode();
      const doc = await ReferralCode.create({
        userId: ctx.user._id,
        code,
        type: "peer",
        eventId: input.eventId,
        rewardType: input.rewardType,
        rewardValue: input.rewardValue,
        maxUses: 100,
      });
      await Event.updateOne(
        { _id: input.eventId },
        {
          peerReferralReward: {
            rewardType: input.rewardType,
            rewardValue: input.rewardValue,
            code: doc.code,
          },
        }
      );
      return { code: doc.code, id: String(doc._id) };
    }),

  listPeerForEvent: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input, ctx }) => {
      const ok = await userCanManageEvent(ctx.user._id, input.eventId);
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      const codes = await ReferralCode.find({
        eventId: input.eventId,
        type: "peer",
        userId: ctx.user._id,
      })
        .sort({ createdAt: -1 })
        .lean();
      const event = await Event.findById(input.eventId).select("slug").lean();
      return codes.map((c) => ({
        id: String(c._id),
        code: c.code,
        rewardType: c.rewardType,
        rewardValue: c.rewardValue,
        usedCount: c.usedCount ?? 0,
        maxUses: c.maxUses ?? 100,
        status: c.status,
        slug: event?.slug,
      }));
    }),

  validatePeerCode: publicProcedure
    .input(
      z.object({
        code: z.string().min(2),
        eventId: z.string(),
        subtotal: z.number().min(0).optional(),
      })
    )
    .query(async ({ input }) => {
      const ref = await findActivePeerReferral(input.code, input.eventId);
      if (!ref) return { valid: false as const };
      const base = input.subtotal ?? 0;
      const discountAmount = calculatePeerReferralDiscount(base, ref);
      return {
        valid: true as const,
        code: ref.code,
        rewardType: ref.rewardType,
        rewardValue: ref.rewardValue,
        label: peerReferralRewardLabel(ref),
        discountAmount,
      };
    }),

  deactivatePeerCode: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const ref = await ReferralCode.findById(input.id);
      if (!ref || ref.type !== "peer") {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const ok = await userCanManageEvent(ctx.user._id, String(ref.eventId));
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      ref.status = "inactive";
      await ref.save();
      return { success: true };
    }),
});
