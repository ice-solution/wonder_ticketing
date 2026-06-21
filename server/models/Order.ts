import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { applyUpdatedAt, moneyField, timestamps } from "./common.js";

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    buyerName: { type: String, required: true, maxlength: 255 },
    buyerFirstName: { type: String, maxlength: 128 },
    buyerLastName: { type: String, maxlength: 128 },
    buyerEmail: { type: String, required: true, maxlength: 320 },
    buyerPhone: { type: String, required: true, maxlength: 32 },
    totalAmount: moneyField,
    donationAmount: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    platformFee: Number,
    currency: { type: String, default: "HKD", maxlength: 3 },
    /** online=一般結帳；walk_in=現場記錄、款項主辦方自行收取 */
    orderSource: {
      type: String,
      enum: ["online", "walk_in"],
      default: "online",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["fps", "payme", "wechat", "alipay", "card", "walk_in"],
    },
    walkInNote: String,
    recordedBy: { type: Schema.Types.ObjectId, ref: "User" },
    wonderPaymentId: String,
    wonderPaymentStatus: String,
    status: {
      type: String,
      enum: ["pending", "paid", "cancelled", "refunded", "partial_refund", "pending_approval"],
      default: "pending",
      index: true,
    },
    paidAt: Date,
    refundedAt: Date,
    discountCodeId: { type: Schema.Types.ObjectId, ref: "DiscountCode" },
    referralCodeUsed: { type: String, maxlength: 32 },
    seatReservationId: { type: String, maxlength: 64 },
    locale: { type: String, default: "zh-TW" },
    ...timestamps,
  },
  { collection: "orders", toJSON: { getters: true }, toObject: { getters: true } }
);

applyUpdatedAt(orderSchema);
orderSchema.index({ eventId: 1, status: 1 });
orderSchema.index({ userId: 1, createdAt: -1 });

export type IOrder = InferSchemaType<typeof orderSchema> & { _id: mongoose.Types.ObjectId };
export const Order: Model<IOrder> =
  mongoose.models.Order ?? mongoose.model<IOrder>("Order", orderSchema);
