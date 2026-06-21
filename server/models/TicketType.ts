import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { applyUpdatedAt, moneyField, timestamps } from "./common.js";

const ticketTypeSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    name: { type: String, required: true, maxlength: 255 },
    nameEn: { type: String, maxlength: 255 },
    description: String,
    price: moneyField,
    currency: { type: String, default: "HKD", maxlength: 3 },
    quantity: { type: Number, required: true, min: 0 },
    sold: { type: Number, default: 0, min: 0 },
    sortOrder: { type: Number, default: 0 },
    salesStart: Date,
    salesEnd: Date,
    minPerOrder: { type: Number, default: 1 },
    maxPerOrder: { type: Number, default: 10 },
    requireApproval: { type: Boolean, default: false },
    unlockCode: { type: String, maxlength: 64 },
    seatCategory: { type: String, maxlength: 64 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    isFlexPrice: { type: Boolean, default: false },
    tokenGate: Schema.Types.Mixed,
    ...timestamps,
  },
  { collection: "ticket_types", toJSON: { getters: true }, toObject: { getters: true } }
);

applyUpdatedAt(ticketTypeSchema);

export type ITicketType = InferSchemaType<typeof ticketTypeSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const TicketType: Model<ITicketType> =
  mongoose.models.TicketType ?? mongoose.model<ITicketType>("TicketType", ticketTypeSchema);
