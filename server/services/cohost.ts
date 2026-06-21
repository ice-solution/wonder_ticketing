import mongoose from "mongoose";
import { CALENDAR_ADMIN_LIMITS } from "../../shared/const.js";
import { isActivePro } from "../../shared/access.js";
import { EventCohost, Event, User } from "../models/index.js";

export async function getOrganizerCohostLimit(organizerId: mongoose.Types.ObjectId | string) {
  const user = await User.findById(organizerId).lean();
  if (!user) return CALENDAR_ADMIN_LIMITS.free;
  if (user.cohostLimitOverride != null) return user.cohostLimitOverride;
  return isActivePro(user) ? CALENDAR_ADMIN_LIMITS.pro : CALENDAR_ADMIN_LIMITS.free;
}

/** 帳戶內「可登入」的 cohost 人數（跨所有活動、distinct userId） */
export async function countActiveLoginCohosts(organizerId: mongoose.Types.ObjectId | string) {
  const rows = await EventCohost.distinct("userId", {
    organizerId,
    status: "active",
    canLogin: true,
    userId: { $ne: null },
  });
  return rows.filter(Boolean).length;
}

export async function assertCanAddCohost(
  organizerId: mongoose.Types.ObjectId | string,
  eventId: mongoose.Types.ObjectId | string,
  newUserId?: mongoose.Types.ObjectId | string
) {
  const event = await Event.findById(eventId).lean();
  if (!event || String(event.createdBy) !== String(organizerId)) {
    throw new Error("FORBIDDEN");
  }

  if (newUserId) {
    const already = await EventCohost.findOne({
      organizerId,
      userId: newUserId,
      status: "active",
      canLogin: true,
    }).lean();
    if (already) return;
  }

  const limit = await getOrganizerCohostLimit(organizerId);
  const current = await countActiveLoginCohosts(organizerId);
  if (current >= limit) {
    const err = new Error("COHOST_LIMIT");
    (err as Error & { limit: number }).limit = limit;
    throw err;
  }
}

export async function userCanManageEvent(
  userId: mongoose.Types.ObjectId | string,
  eventId: mongoose.Types.ObjectId | string
): Promise<boolean> {
  const event = await Event.findById(eventId).lean();
  if (!event) return false;
  if (String(event.createdBy) === String(userId)) return true;
  const cohost = await EventCohost.findOne({
    eventId,
    userId,
    status: "active",
    role: { $in: ["editor", "viewer"] },
  }).lean();
  return !!cohost;
}
