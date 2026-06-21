/**
 * 規格書 Appendix A.2 補充集合（原計劃為額外 MySQL 表）
 */
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { applyUpdatedAt, timestamps } from "./common.js";

const eventSeriesSchema = new Schema(
  {
    title: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    ...timestamps,
  },
  { collection: "event_series" }
);
applyUpdatedAt(eventSeriesSchema);

const eventCohostSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    /** 活動擁有者（建立者），用於帳戶級 cohost 名額統計 */
    organizerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    invitedEmail: { type: String, maxlength: 320 },
    role: { type: String, enum: ["editor", "viewer"], default: "editor" },
    canLogin: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["pending", "active", "revoked"],
      default: "pending",
      index: true,
    },
    ...timestamps,
  },
  { collection: "event_cohosts" }
);
eventCohostSchema.index({ eventId: 1, userId: 1 }, { unique: true, sparse: true });
eventCohostSchema.index({ organizerId: 1, status: 1 });

const eventCheckerSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ...timestamps,
  },
  { collection: "event_checkers" }
);
eventCheckerSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export type IEventSeries = InferSchemaType<typeof eventSeriesSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type IEventCohost = InferSchemaType<typeof eventCohostSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type IEventChecker = InferSchemaType<typeof eventCheckerSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const EventSeries: Model<IEventSeries> =
  mongoose.models.EventSeries ??
  mongoose.model<IEventSeries>("EventSeries", eventSeriesSchema);
export const EventCohost: Model<IEventCohost> =
  mongoose.models.EventCohost ?? mongoose.model<IEventCohost>("EventCohost", eventCohostSchema);
export const EventChecker: Model<IEventChecker> =
  mongoose.models.EventChecker ??
  mongoose.model<IEventChecker>("EventChecker", eventCheckerSchema);
