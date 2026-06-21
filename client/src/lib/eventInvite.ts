const PREFIX = "wonder_invite_";

export function saveEventInvite(slug: string, token: string) {
  sessionStorage.setItem(`${PREFIX}${slug}`, token);
}

export function getEventInvite(slug: string): string | undefined {
  return sessionStorage.getItem(`${PREFIX}${slug}`) ?? undefined;
}

export function clearEventInvite(slug: string) {
  sessionStorage.removeItem(`${PREFIX}${slug}`);
}

/** 從 URL search 擷取並儲存 invite token */
export function syncInviteFromSearch(slug: string, search: string) {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  const invite = params.get("invite");
  if (invite) saveEventInvite(slug, invite);
  return invite ?? getEventInvite(slug);
}
