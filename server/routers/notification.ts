import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { EventReminder } from "../models/index.js";
import { protectedProcedure, router } from "../_core/trpc.js";
import { userCanManageEvent } from "../services/cohost.js";
import {
  getOrganizerNotificationStatus,
  getEmailProviderStatus,
  getWhatsAppNotificationStatus,
  sendNotification,
} from "../services/notifications.js";
import { isActivePro } from "../../shared/access.js";

export const notificationRouter = router({
  emailStatus: protectedProcedure.query(() => {
    const status = getEmailProviderStatus();
    return {
      ready: status.configured,
    };
  }),

  whatsappStatus: protectedProcedure.query(() => {
    const status = getWhatsAppNotificationStatus();
    return {
      ready: status.configured,
    };
  }),

  quota: protectedProcedure.query(async ({ ctx }) => {
    const plan = isActivePro(ctx.user) ? ("pro" as const) : ("free" as const);
    return getOrganizerNotificationStatus(String(ctx.user._id), plan);
  }),

  scheduleReminder: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        type: z.enum(["email", "whatsapp"]),
        triggerBeforeHours: z.number().int().min(1).max(168),
        templateContent: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ok = await userCanManageEvent(ctx.user._id, input.eventId);
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });

      const doc = await EventReminder.create({
        eventId: input.eventId,
        type: input.type,
        triggerBefore: input.triggerBeforeHours,
        templateContent: input.templateContent,
        status: "pending",
      });
      return { id: String(doc._id) };
    }),

  listReminders: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      const ok = await userCanManageEvent(ctx.user._id, input.eventId);
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      return EventReminder.find({ eventId: input.eventId, triggerBefore: { $gt: 0 } })
        .sort({ createdAt: -1 })
        .lean();
    }),

  deleteReminder: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const reminder = await EventReminder.findById(input.id).lean();
      if (!reminder) throw new TRPCError({ code: "NOT_FOUND" });
      const ok = await userCanManageEvent(ctx.user._id, String(reminder.eventId));
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      if (reminder.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "僅可刪除待發送的提醒" });
      }
      await EventReminder.deleteOne({ _id: input.id });
      return { success: true };
    }),

  sendTest: protectedProcedure
    .input(
      z.object({
        channel: z.enum(["email", "whatsapp"]),
        to: z.string().min(3),
        message: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const plan = isActivePro(ctx.user) ? ("pro" as const) : ("free" as const);
      const result = await sendNotification({
        organizerId: String(ctx.user._id),
        organizerPlan: plan,
        channel: input.channel,
        to: input.to,
        subject: "Wonder Ticketing 測試通知",
        body: input.message,
      });
      if (!result.sent) {
        const msg =
          result.reason === "SEND_FAILED"
            ? input.channel === "email"
              ? "Email 發送失敗，請稍後再試"
              : "WhatsApp 發送失敗，請稍後再試"
            : "本週通知額度已用完";
        throw new TRPCError({ code: "BAD_REQUEST", message: msg });
      }
      return { success: true };
    }),
});
