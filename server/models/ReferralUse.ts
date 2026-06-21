import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { timestamps } from "./common.js";

const referralUseSchema = new Schema(
  {
    referralCodeId: {
      type: Schema.Types.ObjectId,
      ref: "ReferralCode",
      required: true,
      index: true,
    },
    referrerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    refereeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rewardGranted: { type: Boolean, default: false },
    ...timestamps,
  },
  { collection: "referral_uses" }
);

export type IReferralUse = InferSchemaType<typeof referralUseSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const ReferralUse: Model<IReferralUse> =
  mongoose.models.ReferralUse ??
  mongoose.model<IReferralUse>("ReferralUse", referralUseSchema);
