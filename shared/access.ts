import { PLATFORM_WEEKLY_SEND_LIMITS } from "./const.js";

export type UserPlan = "free" | "pro";

export interface AccessUser {
  plan: UserPlan;
  planExpiresAt?: Date | null;
}

/** 有效 Pro：plan=pro 且未過期 */
export function isActivePro(user: AccessUser | null | undefined): boolean {
  if (!user || user.plan !== "pro") return false;
  if (!user.planExpiresAt) return true;
  return user.planExpiresAt.getTime() > Date.now();
}

/**
 * members_only 活動：已登入且為有效 Pro 即可存取（見 PRODUCT_DECISIONS §3）
 */
export function canAccessMembersOnlyEvent(
  user: AccessUser | null | undefined,
  isLoggedIn: boolean
): boolean {
  return isLoggedIn && isActivePro(user);
}

export function canViewEvent(
  visibility: "public" | "private" | "members_only",
  user: AccessUser | null | undefined,
  isLoggedIn: boolean,
  opts?: {
    inviteToken?: string;
    eventInviteToken?: string;
  }
): boolean {
  if (visibility === "public") return true;
  if (visibility === "private") {
    if (!opts?.inviteToken || !opts?.eventInviteToken) return false;
    return opts.inviteToken === opts.eventInviteToken;
  }
  return canAccessMembersOnlyEvent(user, isLoggedIn);
}

export function getWeeklySendLimit(plan: UserPlan): number {
  return PLATFORM_WEEKLY_SEND_LIMITS[plan];
}

export interface OrganizerNotificationQuota {
  sentCount: number;
  weekStart: Date;
}

/** 是否仍可發送（organizer 帳戶級） */
export function canSendOrganizerNotification(
  plan: UserPlan,
  quota: OrganizerNotificationQuota | null | undefined
): { allowed: boolean; remaining: number; limit: number } {
  const limit = getWeeklySendLimit(plan);
  const sent = quota?.sentCount ?? 0;
  return { allowed: sent < limit, remaining: Math.max(0, limit - sent), limit };
}
