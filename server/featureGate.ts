import { PLATFORM_FEE_RATES } from "../shared/const.js";
import type { UserPlan } from "../shared/access.js";

export function calculatePlatformFee(amount: number, organizerPlan: UserPlan) {
  const feeRate = PLATFORM_FEE_RATES[organizerPlan];
  const feeAmount = Math.round(amount * feeRate * 100) / 100;
  const netToOrganizer = Math.round((amount - feeAmount) * 100) / 100;
  return { feeRate, feeAmount, netToOrganizer };
}
