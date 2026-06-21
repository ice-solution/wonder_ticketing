import type mongoose from "mongoose";
import { ReferralCode, type IReferralCode } from "../models/index.js";

export function calculatePeerReferralDiscount(
  amountAfterOtherDiscounts: number,
  ref: Pick<IReferralCode, "rewardType" | "rewardValue">
): number {
  const value = ref.rewardValue ?? 0;
  if (value <= 0 || amountAfterOtherDiscounts <= 0) return 0;

  switch (ref.rewardType) {
    case "discount":
      return Math.round(amountAfterOtherDiscounts * (value / 100) * 100) / 100;
    case "cashback":
    case "free_ticket":
      return Math.min(value, amountAfterOtherDiscounts);
    default:
      return 0;
  }
}

export async function findActivePeerReferral(code: string, eventId: mongoose.Types.ObjectId | string) {
  const ref = await ReferralCode.findOne({
    code: code.toUpperCase(),
    type: "peer",
    eventId,
    status: "active",
  }).lean();
  if (!ref) return null;
  if ((ref.usedCount ?? 0) >= (ref.maxUses ?? 100)) return null;
  return ref;
}

export async function recordPeerReferralRedemption(code: string, eventId: mongoose.Types.ObjectId | string) {
  const ref = await ReferralCode.findOne({
    code: code.toUpperCase(),
    type: "peer",
    eventId,
  });
  if (!ref) return;

  const nextCount = (ref.usedCount ?? 0) + 1;
  ref.usedCount = nextCount;
  if (nextCount >= (ref.maxUses ?? 100)) ref.status = "maxed";
  await ref.save();
}

export function peerReferralRewardLabel(
  ref: Pick<IReferralCode, "rewardType" | "rewardValue">,
  locale: "zh-TW" | "en" = "zh-TW"
): string {
  const v = ref.rewardValue ?? 0;
  if (ref.rewardType === "discount") {
    return locale === "en" ? `${v}% off` : `${v}% 折扣`;
  }
  if (ref.rewardType === "free_ticket") {
    return locale === "en" ? `HK$${v} off (friend reward)` : `減 HK$${v}（好友推薦）`;
  }
  return locale === "en" ? `HK$${v} cashback` : `回贈 HK$${v}`;
}
