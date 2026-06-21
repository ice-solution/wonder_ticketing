import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Event } from "../models/index.js";
import { protectedProcedure, proProcedure, router } from "../_core/trpc.js";
import { userCanManageEvent } from "../services/cohost.js";
import { generateEventCopy } from "../services/aiCopy.js";

export const aiRouter = router({
  generateEventCopy: proProcedure
    .input(
      z.object({
        eventId: z.string(),
        locale: z.enum(["zh-TW", "en"]).default("zh-TW"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ok = await userCanManageEvent(ctx.user._id, input.eventId);
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });

      const event = await Event.findById(input.eventId).lean();
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });

      const copy = await generateEventCopy({
        title: event.title,
        titleEn: event.titleEn ?? undefined,
        venue: event.venue,
        eventDate: event.eventDate,
        category: event.category ?? undefined,
        eventType: event.eventType ?? undefined,
        locale: input.locale,
      });

      await Event.updateOne(
        { _id: event._id },
        {
          description: copy.description,
          descriptionEn: copy.descriptionEn,
          updatedAt: new Date(),
        }
      );

      return copy;
    }),
});
