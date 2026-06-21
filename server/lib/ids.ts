import { customAlphabet } from "nanoid";
import { ORDER_NUMBER_PREFIX } from "../../shared/const.js";

const nano = customAlphabet("0123456789ABCDEFGHJKLMNPQRSTUVWXYZ", 10);
const ticketNano = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 16);
const slugNano = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 8);

export function generateOrderNumber(): string {
  return `${ORDER_NUMBER_PREFIX}${nano()}`;
}

export function generateTicketCode(): string {
  return `TIX-${ticketNano()}`;
}

export function slugify(title: string): string {
  const normalized = title.trim().toLowerCase();
  const ascii = normalized
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  if (ascii.length >= 3) return ascii;

  const cjk = normalized
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fff-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  if (cjk.length >= 2) return cjk;

  return `event-${slugNano()}`;
}

export async function uniqueEventSlug(
  title: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  let slug = slugify(title);
  let n = 0;
  while (await exists(slug)) {
    n += 1;
    slug = `${slugify(title)}-${n}`;
  }
  return slug;
}
