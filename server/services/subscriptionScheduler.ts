import { Subscription, User } from "../models/index.js";

const INTERVAL_MS = 60 * 60 * 1000;
let timer: ReturnType<typeof setInterval> | null = null;

export async function processExpiredSubscriptions(): Promise<void> {
  const now = new Date();

  const expiredUsers = await User.find({
    plan: "pro",
    planExpiresAt: { $lte: now },
  })
    .select("_id")
    .lean();

  for (const u of expiredUsers) {
    await User.updateOne({ _id: u._id }, { plan: "free", planExpiresAt: null });
    await Subscription.updateOne(
      { userId: u._id },
      { status: "expired", cancelAtPeriodEnd: false }
    );
    console.log(`[subscription] downgraded user ${u._id} (plan expired)`);
  }

  const expiredSubs = await Subscription.find({
    cancelAtPeriodEnd: true,
    currentPeriodEnd: { $lte: now },
    status: "active",
  }).lean();

  for (const sub of expiredSubs) {
    await User.updateOne(
      { _id: sub.userId, plan: "pro" },
      { plan: "free", planExpiresAt: null }
    );
    await Subscription.updateOne(
      { _id: sub._id },
      { status: "expired", cancelAtPeriodEnd: false }
    );
    console.log(`[subscription] downgraded user ${sub.userId} (cancel at period end)`);
  }
}

export function startSubscriptionScheduler(): void {
  if (timer) return;
  timer = setInterval(() => {
    processExpiredSubscriptions().catch((e) => console.error("[subscription]", e));
  }, INTERVAL_MS);
  processExpiredSubscriptions().catch((e) => console.error("[subscription]", e));
  console.log("[subscription] scheduler started (every hour)");
}
