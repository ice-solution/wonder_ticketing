import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { timestamps } from "./common.js";

const eventMessageSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, maxlength: 2000 },
    ...timestamps,
  },
  { collection: "event_messages" }
);

eventMessageSchema.index({ eventId: 1, createdAt: -1 });

export type IEventMessage = InferSchemaType<typeof eventMessageSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const EventMessage: Model<IEventMessage> =
  mongoose.models.EventMessage ??
  mongoose.model<IEventMessage>("EventMessage", eventMessageSchema);
