import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { EventSeat } from "../models/index.js";
import { publicProcedure, proProcedure, router } from "../_core/trpc.js";
import { userCanManageEvent } from "../services/cohost.js";
import { releaseExpiredReservations, reserveSeats, seedSeatGrid } from "../services/seat.js";
import {
  clearEventSeatMap,
  getEventSeatLayout,
  syncEventSeatMap,
} from "../services/seatMapSync.js";
import { SeatMapLayoutSchema } from "../../shared/schemas/seatMap.js";

export const seatRouter = router({
  getMap: publicProcedure.input(z.object({ eventId: z.string() })).query(async ({ input }) => {
    await releaseExpiredReservations(input.eventId);
    const seats = await EventSeat.find({ eventId: input.eventId }).lean();
    const available = seats.filter((s) => s.status === "available").length;
    const categories = [...new Set(seats.map((s) => s.category).filter(Boolean))];
    return { seats, available, categories };
  }),

  getLayout: proProcedure.input(z.object({ eventId: z.string() })).query(async ({ input, ctx }) => {
    const ok = await userCanManageEvent(ctx.user._id, input.eventId);
    if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
    const layout = await getEventSeatLayout(input.eventId);
    const seats = await EventSeat.find({ eventId: input.eventId }).lean();
    return { layout, seatCount: seats.length };
  }),

  saveLayout: proProcedure
    .input(z.object({ eventId: z.string(), layout: SeatMapLayoutSchema }))
    .mutation(async ({ input, ctx }) => {
      const ok = await userCanManageEvent(ctx.user._id, input.eventId);
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      try {
        return await syncEventSeatMap(input.eventId, input.layout);
      } catch (e) {
        throw new TRPCError({ code: "BAD_REQUEST", message: (e as Error).message });
      }
    }),

  clearLayout: proProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const ok = await userCanManageEvent(ctx.user._id, input.eventId);
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      try {
        await clearEventSeatMap(input.eventId);
        return { success: true };
      } catch (e) {
        const msg = (e as Error).message;
        if (msg === "SEAT_MAP_HAS_SOLD") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "已有售出或預留座位，無法清除座位圖" });
        }
        throw e;
      }
    }),

  getAvailable: publicProcedure
    .input(z.object({ eventId: z.string(), category: z.string().optional() }))
    .query(async ({ input }) => {
      await releaseExpiredReservations(input.eventId);
      const filter: Record<string, unknown> = { eventId: input.eventId, status: "available" };
      if (input.category) filter.category = input.category;
      return EventSeat.find(filter).lean();
    }),

  reserve: publicProcedure
    .input(z.object({ eventId: z.string(), seatNumbers: z.array(z.string()).min(1) }))
    .mutation(async ({ input }) => {
      try {
        return await reserveSeats(input.eventId, input.seatNumbers);
      } catch {
        throw new TRPCError({ code: "CONFLICT", message: "座位已被預留或售出" });
      }
    }),

  release: publicProcedure
    .input(z.object({ reservationId: z.string() }))
    .mutation(async ({ input }) => {
      await EventSeat.updateMany(
        { reservationId: input.reservationId, status: "reserved" },
        {
          $set: {
            status: "available",
            reservationId: null,
            reservationExpiresAt: null,
          },
        }
      );
      return { success: true };
    }),

  seedRows: proProcedure
    .input(
      z.object({
        eventId: z.string(),
        rows: z.number().int().min(1).max(50),
        cols: z.number().int().min(1).max(50),
        category: z.string().default("A"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const ok = await userCanManageEvent(ctx.user._id, input.eventId);
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      await seedSeatGrid(input.eventId, {
        rows: input.rows,
        cols: input.cols,
        category: input.category,
      });
      return { success: true };
    }),

  updateMap: proProcedure
    .input(z.object({ eventId: z.string(), seatMapData: z.unknown() }))
    .mutation(async ({ input, ctx }) => {
      const ok = await userCanManageEvent(ctx.user._id, input.eventId);
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      const parsed = SeatMapLayoutSchema.safeParse(input.seatMapData);
      if (!parsed.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "座位圖格式無效" });
      }
      return syncEventSeatMap(input.eventId, parsed.data);
    }),
});
