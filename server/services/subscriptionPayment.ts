import { Subscription, User } from "../models/index.js";

export async function activateSubscriptionPayment(referenceNumber: string): Promise<boolean> {
  const sub = await Subscription.findOne({ wonderPaymentSubscriptionId: referenceNumber });
  if (!sub) return false;
  if (sub.status === "active") return true;

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await User.updateOne(
    { _id: sub.userId },
    { plan: "pro", planExpiresAt: periodEnd }
  );
  await Subscription.updateOne(
    { _id: sub._id },
    {
      status: "active",
      plan: "pro",
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    }
  );
  return true;
}

export async function createPendingSubscriptionPayment(
  userId: string,
  referenceNumber: string
): Promise<void> {
  await Subscription.findOneAndUpdate(
    { userId },
    {
      userId,
      plan: "pro",
      status: "pending",
      wonderPaymentSubscriptionId: referenceNumber,
      cancelAtPeriodEnd: false,
    },
    { upsert: true }
  );
}
