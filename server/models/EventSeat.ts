import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { moneyField, timestamps } from "./common.js";

const eventSeatSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    seatNumber: { type: String, required: true, maxlength: 32 },
    category: { type: String, maxlength: 64 },
    row: { type: String, maxlength: 8 },
    col: Number,
    price: Number,
    status: {
      type: String,
      enum: ["available", "reserved", "sold", "blocked"],
      default: "available",
      index: true,
    },
    reservationId: String,
    reservationExpiresAt: Date,
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket" },
    ...timestamps,
  },
  { collection: "event_seats" }
);

eventSeatSchema.index({ eventId: 1, seatNumber: 1 }, { unique: true });
eventSeatSchema.index({ eventId: 1, status: 1, category: 1 });

export type IEventSeat = InferSchemaType<typeof eventSeatSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const EventSeat: Model<IEventSeat> =
  mongoose.models.EventSeat ?? mongoose.model<IEventSeat>("EventSeat", eventSeatSchema);
