import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { applyUpdatedAt, timestamps } from "./common.js";

const userSchema = new Schema(
  {
    openId: { type: String, required: true, unique: true, index: true },
    name: String,
    email: { type: String, maxlength: 320 },
    phone: { type: String, maxlength: 32 },
    loginMethod: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
    plan: { type: String, enum: ["free", "pro"], default: "free", index: true },
    planExpiresAt: Date,
    locale: { type: String, default: "zh-TW", maxlength: 5 },
    referralCode: { type: String, unique: true, sparse: true, maxlength: 16 },
    referredBy: { type: Schema.Types.ObjectId, ref: "User" },
    lastSignedIn: { type: Date, default: Date.now },
    /** Organizer 每週通知發送計數（Email + WhatsApp 合計） */
    organizerNotificationQuota: {
      sentCount: { type: Number, default: 0 },
      weekStart: { type: Date, default: Date.now },
    },
    /** Wonder 後台調高 cohost 可登入人數上限（預設 Free 3 / Pro 5） */
    cohostLimitOverride: { type: Number, min: 1 },
    ...timestamps,
  },
  { collection: "users" }
);

applyUpdatedAt(userSchema);

export type IUser = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };
export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", userSchema);
