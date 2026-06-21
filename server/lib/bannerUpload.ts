import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const BANNERS_DIR = path.resolve(__dirname, "../../uploads/banners");

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_BYTES = 5 * 1024 * 1024;

export async function ensureBannersDir() {
  await fs.mkdir(BANNERS_DIR, { recursive: true });
}

export async function saveEventBanner(
  eventId: string,
  dataBase64: string,
  mimeType: string
): Promise<string> {
  const ext = MIME_EXT[mimeType];
  if (!ext) throw new Error("INVALID_MIME");

  const buffer = Buffer.from(dataBase64, "base64");
  if (buffer.length === 0) throw new Error("EMPTY_FILE");
  if (buffer.length > MAX_BYTES) throw new Error("FILE_TOO_LARGE");

  await ensureBannersDir();

  const filename = `${eventId}.${ext}`;
  const filepath = path.join(BANNERS_DIR, filename);

  // Remove other extensions for same event
  for (const other of Object.values(MIME_EXT)) {
    if (other === ext) continue;
    await fs.unlink(path.join(BANNERS_DIR, `${eventId}.${other}`)).catch(() => {});
  }

  await fs.writeFile(filepath, buffer);
  return `/uploads/banners/${filename}?v=${Date.now()}`;
}

export async function removeEventBanner(eventId: string) {
  await ensureBannersDir();
  for (const ext of Object.values(MIME_EXT)) {
    await fs.unlink(path.join(BANNERS_DIR, `${eventId}.${ext}`)).catch(() => {});
  }
}
