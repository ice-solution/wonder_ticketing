import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { applyUpdatedAt, timestamps } from "./common.js";

const eventSchema = new Schema(
  {
    title: { type: String, required: true, maxlength: 255 },
    titleEn: { type: String, maxlength: 255 },
    description: String,
    descriptionEn: String,
    bannerUrl: String,
    eventDate: { type: Date, required: true, index: true },
    eventEndDate: Date,
    venue: { type: String, required: true, maxlength: 500 },
    venueAddress: String,
    venueLatLng: { type: String, maxlength: 64 },
    organizerName: { type: String, maxlength: 255 },
    organizerDescription: String,
    termsAndConditions: String,
    maxAttendees: { type: Number, default: 300 },
    category: { type: String, maxlength: 64, index: true },
    eventType: {
      type: String,
      enum: ["in_person", "online", "hybrid"],
      default: "in_person",
    },
    visibility: {
      type: String,
      enum: ["public", "private", "members_only"],
      default: "public",
    },
    status: {
      type: String,
      enum: ["draft", "published", "cancelled", "completed"],
      default: "draft",
      index: true,
    },
    slug: { type: String, required: true, unique: true, index: true },
    customUrl: { type: String, unique: true, sparse: true },
    enableDonation: { type: Boolean, default: false },
    donationGoal: Number,
    enableSeating: { type: Boolean, default: false },
    seatMapData: Schema.Types.Mixed,
    enablePeerReferral: { type: Boolean, default: false },
    peerReferralReward: Schema.Types.Mixed,
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // Appendix 補充欄位
    brandColor: { type: String, maxlength: 7 },
    isFeatured: { type: Boolean, default: false, index: true },
    hideVenueUntilApproved: { type: Boolean, default: false },
    /** Phase 3：追蹤與嵌入 */
    metaPixelId: { type: String, maxlength: 64 },
    googleAnalyticsId: { type: String, maxlength: 32 },
    enableEmbedWidget: { type: Boolean, default: true },
    /** Private 活動邀請 token */
    inviteToken: { type: String, index: true, sparse: true },
    seriesId: { type: Schema.Types.ObjectId, ref: "EventSeries" },
    ...timestamps,
  },
  { collection: "events" }
);

applyUpdatedAt(eventSchema);
eventSchema.index({ status: 1, eventDate: 1 });
eventSchema.index({ createdBy: 1, status: 1 });

export type IEvent = InferSchemaType<typeof eventSchema> & { _id: mongoose.Types.ObjectId };
export const Event: Model<IEvent> =
  mongoose.models.Event ?? mongoose.model<IEvent>("Event", eventSchema);
