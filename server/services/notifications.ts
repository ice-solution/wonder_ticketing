import { User } from "../models/index.js";
import { canSendOrganizerNotification, getWeeklySendLimit } from "../../shared/access.js";
import type { UserPlan } from "../../shared/features.js";
import { isSesConfigured, sendSesEmail } from "../lib/sesEmail.js";
import { isWhatsAppConfigured, sendWhatsAppText } from "../lib/whatsappCloud.js";
import {
  buildOrderConfirmationEmail,
  buildTicketTransferEmail,
  buildEventReminderEmail,
} from "../lib/emailTemplates.js";

function weekStartMonday(d = new Date()): Date {
  const date = new Date(d);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

async function refreshQuotaIfNeeded(userId: string) {
  const user = await User.findById(userId);
  if (!user) return null;
  const quota = user.organizerNotificationQuota ?? { sentCount: 0, weekStart: new Date() };
  const currentWeek = weekStartMonday();
  if (!quota.weekStart || quota.weekStart < currentWeek) {
    await User.updateOne(
      { _id: userId },
      { organizerNotificationQuota: { sentCount: 0, weekStart: currentWeek } }
    );
    return { sentCount: 0, weekStart: currentWeek };
  }
  return { sentCount: quota.sentCount ?? 0, weekStart: quota.weekStart };
}

export async function getOrganizerNotificationStatus(userId: string, plan: UserPlan) {
  const quota = await refreshQuotaIfNeeded(userId);
  const limit = getWeeklySendLimit(plan);
  const sent = quota?.sentCount ?? 0;
  return { limit, sent, remaining: Math.max(0, limit - sent) };
}

async function hasQuotaAvailable(userId: string, plan: UserPlan, count = 1): Promise<boolean> {
  const quota = await refreshQuotaIfNeeded(userId);
  const check = canSendOrganizerNotification(plan, quota);
  return check.allowed && check.remaining >= count;
}

async function consumeQuota(userId: string, plan: UserPlan, count = 1): Promise<void> {
  await refreshQuotaIfNeeded(userId);
  await User.updateOne(
    { _id: userId },
    { $inc: { "organizerNotificationQuota.sentCount": count } }
  );
}

export type NotificationChannel = "email" | "whatsapp";

export function getEmailProviderStatus() {
  return {
    configured: isSesConfigured(),
    provider: isSesConfigured() ? ("aws_ses" as const) : ("console" as const),
  };
}

export function getWhatsAppNotificationStatus() {
  return {
    configured: isWhatsAppConfigured(),
    provider: isWhatsAppConfigured() ? ("meta_cloud" as const) : ("console" as const),
  };
}

async function deliverEmail(to: string, subject: string, text: string, html?: string) {
  if (isSesConfigured()) {
    await sendSesEmail({ to, subject, text, html });
    return;
  }
  console.log(`[notification:email] to=${to} subject=${subject}`);
  console.log(text);
}

export async function sendNotification(opts: {
  organizerId: string;
  organizerPlan: UserPlan;
  channel: NotificationChannel;
  to: string;
  subject: string;
  body: string;
  html?: string;
  eventId?: string;
  skipQuota?: boolean;
}): Promise<{ sent: boolean; reason?: string }> {
  if (!opts.skipQuota) {
    const allowed = await hasQuotaAvailable(opts.organizerId, opts.organizerPlan);
    if (!allowed) {
      return { sent: false, reason: "WEEKLY_QUOTA_EXCEEDED" };
    }
  }

  try {
    if (opts.channel === "email") {
      await deliverEmail(opts.to, opts.subject, opts.body, opts.html);
    } else if (isWhatsAppConfigured()) {
      const text = opts.subject ? `${opts.subject}\n\n${opts.body}` : opts.body;
      await sendWhatsAppText(opts.to, text);
    } else {
      console.log(`[notification:whatsapp] to=${opts.to} subject=${opts.subject}`);
      console.log(opts.body);
    }
  } catch (e) {
    console.error("[notification] send failed:", e);
    return { sent: false, reason: "SEND_FAILED" };
  }

  if (!opts.skipQuota) {
    await consumeQuota(opts.organizerId, opts.organizerPlan);
  }

  return { sent: true };
}

export async function sendOrderConfirmation(opts: {
  organizerId: string;
  organizerPlan: UserPlan;
  eventId: string;
  eventTitle: string;
  eventDate?: Date;
  venue?: string;
  buyerEmail: string;
  buyerName: string;
  orderNumber: string;
  ticketCodes: string[];
}) {
  const { text, html } = buildOrderConfirmationEmail({
    buyerName: opts.buyerName,
    eventTitle: opts.eventTitle,
    orderNumber: opts.orderNumber,
    ticketCodes: opts.ticketCodes,
    eventDate: opts.eventDate,
    venue: opts.venue,
  });

  return sendNotification({
    organizerId: opts.organizerId,
    organizerPlan: opts.organizerPlan,
    channel: "email",
    to: opts.buyerEmail,
    subject: `【Wonder Ticketing】${opts.eventTitle} — 購票確認`,
    body: text,
    html,
  });
}

export async function sendEventReminderBatch(opts: {
  organizerId: string;
  organizerPlan: UserPlan;
  eventTitle: string;
  eventDate: Date;
  venue?: string;
  eventSlug: string;
  templateContent: string;
  recipients: { email: string; name: string }[];
}): Promise<{ ok: boolean; sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const r of opts.recipients) {
    const { text, html } = buildEventReminderEmail({
      buyerName: r.name || "貴賓",
      eventTitle: opts.eventTitle,
      eventDate: opts.eventDate,
      venue: opts.venue,
      eventSlug: opts.eventSlug,
      templateContent: opts.templateContent,
    });

    const result = await sendNotification({
      organizerId: opts.organizerId,
      organizerPlan: opts.organizerPlan,
      channel: "email",
      to: r.email,
      subject: `【Wonder Ticketing】活動提醒：${opts.eventTitle}`,
      body: text,
      html,
    });

    if (result.sent) sent++;
    else failed++;
  }

  return { ok: failed === 0, sent, failed };
}

export async function sendTicketTransferNotice(opts: {
  organizerId: string;
  organizerPlan: UserPlan;
  eventId: string;
  eventTitle: string;
  ticketCode: string;
  fromEmail: string;
  toEmail: string;
}) {
  const { text, html } = buildTicketTransferEmail({
    eventTitle: opts.eventTitle,
    ticketCode: opts.ticketCode,
    fromEmail: opts.fromEmail,
  });

  return sendNotification({
    organizerId: opts.organizerId,
    organizerPlan: opts.organizerPlan,
    channel: "email",
    to: opts.toEmail,
    subject: `【Wonder Ticketing】您收到一張「${opts.eventTitle}」票券`,
    body: text,
    html,
  });
}
