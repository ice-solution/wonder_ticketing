import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { moneyField, timestamps } from "./common.js";

const orderItemSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    ticketTypeId: { type: Schema.Types.ObjectId, ref: "TicketType", required: true },
    ticketTypeName: { type: String, required: true, maxlength: 255 },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: moneyField,
    seatNumbers: [String],
    attendees: [
      {
        name: String,
        email: String,
        phone: String,
      },
    ],
    ...timestamps,
  },
  { collection: "order_items", toJSON: { getters: true }, toObject: { getters: true } }
);

export type IOrderItem = InferSchemaType<typeof orderItemSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const OrderItem: Model<IOrderItem> =
  mongoose.models.OrderItem ?? mongoose.model<IOrderItem>("OrderItem", orderItemSchema);
