import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { moneyField, timestamps } from "./common.js";

const donationSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    donorName: { type: String, maxlength: 255 },
    donorEmail: { type: String, maxlength: 320 },
    amount: moneyField,
    currency: { type: String, default: "HKD", maxlength: 3 },
    message: String,
    isAnonymous: { type: Boolean, default: false },
    wonderPaymentId: String,
    status: {
      type: String,
      enum: ["pending", "completed", "refunded"],
      default: "pending",
    },
    ...timestamps,
  },
  { collection: "donations", toJSON: { getters: true }, toObject: { getters: true } }
);

export type IDonation = InferSchemaType<typeof donationSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const Donation: Model<IDonation> =
  mongoose.models.Donation ?? mongoose.model<IDonation>("Donation", donationSchema);
