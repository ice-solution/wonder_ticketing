import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { timestamps } from "./common.js";

const eventReminderSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    type: { type: String, enum: ["email", "whatsapp", "push"], required: true },
    triggerBefore: { type: Number, required: true },
    templateContent: String,
    status: { type: String, enum: ["pending", "sent", "failed"], default: "pending" },
    sentAt: Date,
    ...timestamps,
  },
  { collection: "event_reminders" }
);

export type IEventReminder = InferSchemaType<typeof eventReminderSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const EventReminder: Model<IEventReminder> =
  mongoose.models.EventReminder ??
  mongoose.model<IEventReminder>("EventReminder", eventReminderSchema);
