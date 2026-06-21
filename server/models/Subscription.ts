import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { applyUpdatedAt, timestamps } from "./common.js";

const subscriptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    plan: { type: String, enum: ["free", "pro"], required: true },
    status: {
      type: String,
      enum: ["pending", "active", "cancelled", "expired", "trial"],
      required: true,
    },
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: { type: Boolean, default: false },
    wonderPaymentSubscriptionId: String,
    ...timestamps,
  },
  { collection: "subscriptions" }
);

applyUpdatedAt(subscriptionSchema);
subscriptionSchema.index({ userId: 1 });

export type ISubscription = InferSchemaType<typeof subscriptionSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const Subscription: Model<ISubscription> =
  mongoose.models.Subscription ??
  mongoose.model<ISubscription>("Subscription", subscriptionSchema);
