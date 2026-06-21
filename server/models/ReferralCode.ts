import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { timestamps } from "./common.js";

const referralCodeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    code: { type: String, required: true, unique: true, maxlength: 16 },
    type: { type: String, enum: ["organizer", "peer"], required: true },
    eventId: { type: Schema.Types.ObjectId, ref: "Event" },
    rewardType: {
      type: String,
      enum: ["pro_month", "discount", "free_ticket", "cashback"],
    },
    rewardValue: Number,
    maxUses: { type: Number, default: 12 },
    usedCount: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive", "maxed"], default: "active" },
    ...timestamps,
  },
  { collection: "referral_codes" }
);

referralCodeSchema.index({ code: 1 });

export type IReferralCode = InferSchemaType<typeof referralCodeSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const ReferralCode: Model<IReferralCode> =
  mongoose.models.ReferralCode ??
  mongoose.model<IReferralCode>("ReferralCode", referralCodeSchema);
