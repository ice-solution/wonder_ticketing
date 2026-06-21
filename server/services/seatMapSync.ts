import mongoose from "mongoose";
import { Event, EventSeat } from "../models/index.js";
import {
  type SeatMapLayout,
  createEmptyLayout,
  SeatMapLayoutSchema,
} from "../../shared/schemas/seatMap.js";

type ExistingSeat = {
  seatNumber: string;
  status: string;
  row?: string | null;
  col?: number | null;
  category?: string | null;
};

export function inferLayoutFromSeats(seats: ExistingSeat[]): SeatMapLayout | null {
  if (!seats.length) return null;

  const category = seats[0].category ?? "A";
  let maxRow = 0;
  let maxCol = 0;
  const byPos = new Map<string, ExistingSeat>();

  for (const s of seats) {
    const r = Number.parseInt(String(s.row ?? "1"), 10);
    const c = s.col ?? 1;
    if (!Number.isFinite(r) || r < 1 || c < 1) continue;
    maxRow = Math.max(maxRow, r);
    maxCol = Math.max(maxCol, c);
    byPos.set(`${r}-${c}`, s);
  }

  if (maxRow === 0 || maxCol === 0) return null;

  const cells = Array.from({ length: maxRow }, (_, ri) => {
    const rowNum = ri + 1;
    return Array.from({ length: maxCol }, (_, ci) => {
      const colNum = ci + 1;
      const seat = byPos.get(`${rowNum}-${colNum}`);
      if (!seat) return "aisle" as const;
      if (seat.status === "blocked") return "blocked" as const;
      return "seat" as const;
    });
  });

  return {
    version: 1,
    category,
    stageLabel: "STAGE",
    rows: maxRow,
    cols: maxCol,
    cells,
  };
}

function seatNumberFor(category: string, row: number, col: number) {
  return `${category}-${row}-${col}`;
}

function buildDesiredSeats(eventId: mongoose.Types.ObjectId | string, layout: SeatMapLayout) {
  const docs: {
    seatNumber: string;
    category: string;
    row: string;
    col: number;
    cellType: "seat" | "blocked";
  }[] = [];

  layout.cells.forEach((row, ri) => {
    const rowNum = ri + 1;
    row.forEach((cell, ci) => {
      if (cell === "aisle") return;
      const colNum = ci + 1;
      docs.push({
        seatNumber: seatNumberFor(layout.category, rowNum, colNum),
        category: layout.category,
        row: String(rowNum),
        col: colNum,
        cellType: cell === "blocked" ? "blocked" : "seat",
      });
    });
  });

  return docs;
}

export async function getEventSeatLayout(eventId: mongoose.Types.ObjectId | string): Promise<SeatMapLayout | null> {
  const event = await Event.findById(eventId).select("seatMapData").lean();
  if (event?.seatMapData) {
    const parsed = SeatMapLayoutSchema.safeParse(event.seatMapData);
    if (parsed.success) return parsed.data;
  }

  const seats = await EventSeat.find({ eventId }).lean();
  return inferLayoutFromSeats(seats);
}

export async function syncEventSeatMap(
  eventId: mongoose.Types.ObjectId | string,
  layoutInput: SeatMapLayout
): Promise<{ seats: number; blocked: number; preserved: number }> {
  const layout = SeatMapLayoutSchema.parse(layoutInput);
  const existing = await EventSeat.find({ eventId }).lean();
  const desired = buildDesiredSeats(eventId, layout);
  const desiredNumbers = new Set(desired.map((d) => d.seatNumber));

  let preserved = 0;

  for (const doc of desired) {
    const ex = existing.find((s) => s.seatNumber === doc.seatNumber);
    const targetStatus =
      doc.cellType === "blocked"
        ? "blocked"
        : ex?.status === "sold" || ex?.status === "reserved"
          ? ex.status
          : "available";

    if (ex) {
      if (ex.status === "sold" || ex.status === "reserved") preserved++;
      await EventSeat.updateOne(
        { _id: ex._id },
        {
          $set: {
            category: doc.category,
            row: doc.row,
            col: doc.col,
            status: targetStatus,
            ...(targetStatus === "available"
              ? { reservationId: null, reservationExpiresAt: null }
              : {}),
          },
        }
      );
    } else {
      await EventSeat.create({
        eventId,
        seatNumber: doc.seatNumber,
        category: doc.category,
        row: doc.row,
        col: doc.col,
        status: targetStatus,
      });
    }
  }

  const removable = existing.filter(
    (s) =>
      !desiredNumbers.has(s.seatNumber) &&
      (s.status === "available" || s.status === "blocked")
  );
  if (removable.length) {
    await EventSeat.deleteMany({ _id: { $in: removable.map((s) => s._id) } });
  }

  await Event.updateOne(
    { _id: eventId },
    { seatMapData: layout, enableSeating: true }
  );

  return {
    seats: desired.filter((d) => d.cellType === "seat").length,
    blocked: desired.filter((d) => d.cellType === "blocked").length,
    preserved,
  };
}

export async function clearEventSeatMap(eventId: mongoose.Types.ObjectId | string) {
  const sold = await EventSeat.countDocuments({ eventId, status: { $in: ["sold", "reserved"] } });
  if (sold > 0) {
    throw new Error("SEAT_MAP_HAS_SOLD");
  }
  await EventSeat.deleteMany({ eventId });
  await Event.updateOne({ _id: eventId }, { seatMapData: null, enableSeating: false });
}

export { createEmptyLayout };
