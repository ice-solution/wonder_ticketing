import type { Context } from "../_core/context.js";
import { canViewEvent } from "../../shared/access.js";
import { userCanManageEvent } from "../services/cohost.js";

type EventAccess = {
  _id: unknown;
  visibility: string;
  inviteToken?: string | null;
};

export async function resolveEventAccess(
  event: EventAccess,
  ctx: Context,
  inviteToken?: string | null
): Promise<{ allowed: boolean; isOrganizer: boolean }> {
  const isOrganizer = ctx.user
    ? await userCanManageEvent(ctx.user._id, String(event._id))
    : false;

  if (isOrganizer) return { allowed: true, isOrganizer: true };

  const allowed = canViewEvent(
    event.visibility as "public" | "private" | "members_only",
    ctx.user,
    !!ctx.user,
    {
      inviteToken: inviteToken ?? undefined,
      eventInviteToken: event.inviteToken ?? undefined,
    }
  );

  return { allowed, isOrganizer: false };
}

export function stripPrivateFields<T extends Record<string, unknown>>(
  event: T,
  isOrganizer: boolean
): T {
  if (isOrganizer) return event;
  const { inviteToken, ...rest } = event;
  return rest as T;
}

export function accessDeniedMessage(visibility: string): string {
  if (visibility === "private") {
    return "此活動為私人活動，請使用主辦方提供的邀請連結";
  }
  if (visibility === "members_only") {
    return "此活動僅限 Pro 會員瀏覽";
  }
  return "無權限瀏覽此活動";
}
