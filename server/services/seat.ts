import mongoose from "mongoose";
import { customAlphabet } from "nanoid";
import { EventSeat, Event } from "../models/index.js";

const resNano = customAlphabet("0123456789abcdef", 12);
const RESERVE_MS = 5 * 60 * 1000;

export async function releaseExpiredReservations(eventId: string) {
  await EventSeat.updateMany(
    {
      eventId,
      status: "reserved",
      reservationExpiresAt: { $lt: new Date() },
    },
    { $set: { status: "available", reservationId: null, reservationExpiresAt: null } }
  );
}

export async function reserveSeats(eventId: string, seatNumbers: string[]) {
  await releaseExpiredReservations(eventId);
  const reservationId = resNano();
  const expiresAt = new Date(Date.now() + RESERVE_MS);

  const seats = await EventSeat.find({
    eventId,
    seatNumber: { $in: seatNumbers },
    status: "available",
  });

  if (seats.length !== seatNumbers.length) {
    throw new Error("SEATS_UNAVAILABLE");
  }

  await EventSeat.updateMany(
    { eventId, seatNumber: { $in: seatNumbers }, status: "available" },
    {
      $set: {
        status: "reserved",
        reservationId,
        reservationExpiresAt: expiresAt,
      },
    }
  );

  return { reservationId, expiresAt };
}

export async function validateSeatReservation(
  eventId: mongoose.Types.ObjectId | string,
  seatNumbers: string[],
  reservationId: string
) {
  const seats = await EventSeat.find({
    eventId,
    seatNumber: { $in: seatNumbers },
    status: "reserved",
    reservationId,
    reservationExpiresAt: { $gt: new Date() },
  });
  if (seats.length !== seatNumbers.length) {
    throw new Error("SEAT_RESERVATION_INVALID");
  }
}

export async function markSeatsSold(
  eventId: mongoose.Types.ObjectId | string,
  seatNumbers: string[],
  ticketId: mongoose.Types.ObjectId | string
) {
  await EventSeat.updateMany(
    { eventId, seatNumber: { $in: seatNumbers } },
    {
      $set: {
        status: "sold",
        ticketId,
        reservationId: null,
        reservationExpiresAt: null,
      },
    }
  );
}

export async function releaseReservation(reservationId: string) {
  await EventSeat.updateMany(
    { reservationId, status: "reserved" },
    {
      $set: {
        status: "available",
        reservationId: null,
        reservationExpiresAt: null,
      },
    }
  );
}

export async function seedSeatGrid(
  eventId: mongoose.Types.ObjectId | string,
  opts: { rows: number; cols: number; category: string }
) {
  const event = await Event.findById(eventId);
  if (!event) throw new Error("NOT_FOUND");
  const docs = [];
  for (let r = 1; r <= opts.rows; r++) {
    for (let c = 1; c <= opts.cols; c++) {
      docs.push({
        eventId,
        seatNumber: `${opts.category}-${r}-${c}`,
        category: opts.category,
        row: String(r),
        col: c,
        status: "available",
      });
    }
  }
  await EventSeat.insertMany(docs, { ordered: false }).catch(() => {
    /* ignore duplicate seat numbers */
  });
  await Event.updateOne({ _id: eventId }, { enableSeating: true });
}
