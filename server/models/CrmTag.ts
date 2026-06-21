import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { applyUpdatedAt, timestamps } from "./common.js";

/** 活動級 CRM 標籤定義（PRODUCT_DECISIONS §2） */
const crmTagSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    name: { type: String, required: true, maxlength: 64 },
    color: { type: String, maxlength: 7 },
    sortOrder: { type: Number, default: 0 },
    ...timestamps,
  },
  { collection: "crm_tags" }
);

applyUpdatedAt(crmTagSchema);
crmTagSchema.index({ eventId: 1, name: 1 }, { unique: true });

const crmAttendeeTagSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    tagId: { type: Schema.Types.ObjectId, ref: "CrmTag", required: true },
    /** 參加者識別：登入用戶或訪客 email */
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    attendeeEmail: { type: String, maxlength: 320 },
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket" },
    taggedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ...timestamps,
  },
  { collection: "crm_attendee_tags" }
);

crmAttendeeTagSchema.index({ eventId: 1, tagId: 1, userId: 1 });
crmAttendeeTagSchema.index({ eventId: 1, tagId: 1, attendeeEmail: 1 });

export type ICrmTag = InferSchemaType<typeof crmTagSchema> & { _id: mongoose.Types.ObjectId };
export type ICrmAttendeeTag = InferSchemaType<typeof crmAttendeeTagSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const CrmTag: Model<ICrmTag> =
  mongoose.models.CrmTag ?? mongoose.model<ICrmTag>("CrmTag", crmTagSchema);
export const CrmAttendeeTag: Model<ICrmAttendeeTag> =
  mongoose.models.CrmAttendeeTag ??
  mongoose.model<ICrmAttendeeTag>("CrmAttendeeTag", crmAttendeeTagSchema);
