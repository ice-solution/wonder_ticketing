import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { timestamps } from "./common.js";

const ticketSchema = new Schema(
  {
    ticketCode: { type: String, required: true, unique: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    orderItemId: { type: Schema.Types.ObjectId, ref: "OrderItem", required: true },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    ticketTypeId: { type: Schema.Types.ObjectId, ref: "TicketType", required: true },
    ticketTypeName: { type: String, required: true, maxlength: 255 },
    holderName: { type: String, maxlength: 255 },
    holderEmail: { type: String, maxlength: 320 },
    holderPhone: { type: String, maxlength: 32 },
    seatNumber: { type: String, maxlength: 32 },
    status: {
      type: String,
      enum: ["valid", "used", "cancelled", "transferred"],
      default: "valid",
      index: true,
    },
    transferredTo: { type: Schema.Types.ObjectId, ref: "User" },
    checkedInAt: Date,
    ...timestamps,
  },
  { collection: "tickets" }
);

ticketSchema.index({ eventId: 1, status: 1 });

export type ITicket = InferSchemaType<typeof ticketSchema> & { _id: mongoose.Types.ObjectId };
export const Ticket: Model<ITicket> =
  mongoose.models.Ticket ?? mongoose.model<ITicket>("Ticket", ticketSchema);
