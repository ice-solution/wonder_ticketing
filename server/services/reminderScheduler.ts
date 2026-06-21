import { Event, EventReminder, Order, User } from "../models/index.js";
import { isActivePro } from "../../shared/access.js";
import { sendEventReminderBatch } from "./notifications.js";

const INTERVAL_MS = 5 * 60 * 1000;
let timer: ReturnType<typeof setInterval> | null = null;

export async function processPendingReminders(): Promise<void> {
  const pending = await EventReminder.find({ status: "pending", triggerBefore: { $gt: 0 } })
    .limit(50)
    .lean();
  const now = new Date();

  for (const reminder of pending) {
    const event = await Event.findById(reminder.eventId).lean();
    if (!event?.eventDate) continue;

    const sendAt = new Date(event.eventDate);
    sendAt.setHours(sendAt.getHours() - reminder.triggerBefore);
    if (now < sendAt) continue;

    const claimed = await EventReminder.findOneAndUpdate(
      { _id: reminder._id, status: "pending" },
      { $set: { status: "sent", sentAt: new Date() } },
      { new: true }
    );
    if (!claimed) continue;

    try {
      if (reminder.type !== "email") {
        console.log(`[reminder] skip non-email type=${reminder.type}`);
        continue;
      }

      const orders = await Order.find({ eventId: event._id, status: "paid" }).lean();
      const recipients = [
        ...new Map(
          orders
            .filter((o) => o.buyerEmail)
            .map((o) => [o.buyerEmail, { email: o.buyerEmail, name: o.buyerName }])
        ).values(),
      ];

      if (recipients.length === 0) continue;

      const organizer = await User.findById(event.createdBy).lean();
      const plan = organizer && isActivePro(organizer) ? ("pro" as const) : ("free" as const);

      const result = await sendEventReminderBatch({
        organizerId: String(event.createdBy),
        organizerPlan: plan,
        eventTitle: event.title,
        eventDate: event.eventDate,
        venue: event.venue,
        eventSlug: event.slug,
        templateContent: reminder.templateContent ?? "",
        recipients,
      });

      if (!result.ok) {
        await EventReminder.updateOne({ _id: reminder._id }, { status: "failed" });
      }
    } catch (e) {
      console.error("[reminder] failed:", e);
      await EventReminder.updateOne({ _id: reminder._id }, { status: "failed" });
    }
  }
}

export function startReminderScheduler(): void {
  if (timer) return;
  timer = setInterval(() => {
    processPendingReminders().catch((e) => console.error("[reminder]", e));
  }, INTERVAL_MS);
  processPendingReminders().catch((e) => console.error("[reminder]", e));
  console.log("[reminder] scheduler started (every 5 min)");
}
