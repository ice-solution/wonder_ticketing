import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { moneyField, timestamps } from "./common.js";

const discountCodeSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    code: { type: String, required: true, maxlength: 32 },
    type: { type: String, enum: ["percentage", "fixed"], required: true },
    value: moneyField,
    maxUses: Number,
    usedCount: { type: Number, default: 0 },
    minOrderAmount: Number,
    validFrom: Date,
    validUntil: Date,
    applicableTicketTypes: [{ type: Schema.Types.ObjectId, ref: "TicketType" }],
    status: { type: String, enum: ["active", "inactive", "expired"], default: "active" },
    ...timestamps,
  },
  { collection: "discount_codes", toJSON: { getters: true }, toObject: { getters: true } }
);

discountCodeSchema.index({ eventId: 1, code: 1 }, { unique: true });

export type IDiscountCode = InferSchemaType<typeof discountCodeSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const DiscountCode: Model<IDiscountCode> =
  mongoose.models.DiscountCode ??
  mongoose.model<IDiscountCode>("DiscountCode", discountCodeSchema);
