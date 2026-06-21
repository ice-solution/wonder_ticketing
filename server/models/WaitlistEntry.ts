import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { timestamps } from "./common.js";

const waitlistEntrySchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    ticketTypeId: { type: Schema.Types.ObjectId, ref: "TicketType" },
    name: { type: String, required: true, maxlength: 255 },
    email: { type: String, required: true, maxlength: 320 },
    phone: { type: String, maxlength: 32 },
    quantity: { type: Number, default: 1, min: 1 },
    status: {
      type: String,
      enum: ["waiting", "notified", "converted", "expired"],
      default: "waiting",
      index: true,
    },
    notifiedAt: Date,
    ...timestamps,
  },
  { collection: "waitlist_entries" }
);

waitlistEntrySchema.index({ eventId: 1, status: 1 });

export type IWaitlistEntry = InferSchemaType<typeof waitlistEntrySchema> & {
  _id: mongoose.Types.ObjectId;
};
export const WaitlistEntry: Model<IWaitlistEntry> =
  mongoose.models.WaitlistEntry ??
  mongoose.model<IWaitlistEntry>("WaitlistEntry", waitlistEntrySchema);
