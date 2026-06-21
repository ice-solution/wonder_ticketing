import { Event } from "../models/index.js";
import { env } from "../_core/env.js";
import {
  isWhatsAppConfigured,
  parseWhatsAppWebhook,
  sendWhatsAppText,
  type WhatsAppIncomingMessage,
} from "../lib/whatsappCloud.js";

type ListedEvent = { slug: string; title: string; eventDate: Date; venue: string };

const sessions = new Map<string, { events: ListedEvent[]; updatedAt: number }>();
const SESSION_TTL_MS = 30 * 60 * 1000;

function clientBaseUrl(): string {
  return env.CLIENT_URL ?? "http://localhost:5173";
}

function pruneSessions() {
  const now = Date.now();
  for (const [key, session] of sessions) {
    if (now - session.updatedAt > SESSION_TTL_MS) sessions.delete(key);
  }
}

function normalizeCommand(text: string): string {
  return text.trim().toLowerCase();
}

function isHelpCommand(cmd: string): boolean {
  return ["help", "hi", "hello", "start", "menu", "?", "幫助", "說明", "你好", "嗨", "選單"].includes(cmd);
}

function isListCommand(cmd: string): boolean {
  return ["events", "list", "活動", "列表", "活動列表"].includes(cmd);
}

async function fetchUpcomingEvents(limit = 5): Promise<ListedEvent[]> {
  const now = new Date();
  const docs = await Event.find({
    status: "published",
    visibility: "public",
    eventDate: { $gte: now },
  })
    .sort({ eventDate: 1 })
    .limit(limit)
    .lean();

  return docs.map((e) => ({
    slug: e.slug,
    title: e.title,
    eventDate: e.eventDate,
    venue: e.venue,
  }));
}

async function searchEvents(keyword: string, limit = 5): Promise<ListedEvent[]> {
  const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const docs = await Event.find({
    status: "published",
    visibility: "public",
    $or: [{ title: regex }, { titleEn: regex }, { venue: regex }],
  })
    .sort({ eventDate: 1 })
    .limit(limit)
    .lean();

  return docs.map((e) => ({
    slug: e.slug,
    title: e.title,
    eventDate: e.eventDate,
    venue: e.venue,
  }));
}

function formatEventList(events: ListedEvent[]): string {
  if (!events.length) {
    return "目前沒有公開活動。\n\n輸入「活動」查看即將舉行的活動，或直接搜尋關鍵字。";
  }

  const lines = events.map((e, i) => {
    const date = e.eventDate.toLocaleString("zh-HK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    return `${i + 1}. ${e.title}\n   📅 ${date}\n   📍 ${e.venue}`;
  });

  return `🎫 即將舉行的活動：\n\n${lines.join("\n\n")}\n\n回覆數字 1–${events.length} 查看詳情與購票連結。`;
}

function formatEventDetail(event: ListedEvent): string {
  const date = event.eventDate.toLocaleString("zh-HK", {
    dateStyle: "full",
    timeStyle: "short",
  });
  const url = `${clientBaseUrl()}/events/${event.slug}`;
  return `🎫 ${event.title}\n\n📅 ${date}\n📍 ${event.venue}\n\n🛒 購票：\n${url}\n\n輸入「活動」返回列表。`;
}

function helpText(): string {
  return (
    "👋 Wonder Ticketing 購票 Bot\n\n" +
    "指令：\n" +
    "• 活動 — 查看即將舉行的活動\n" +
    "• 輸入關鍵字 — 搜尋活動\n" +
    "• 回覆數字 — 查看活動詳情\n" +
    "• 幫助 — 顯示此訊息"
  );
}

export async function handleWhatsAppUserMessage(from: string, text: string): Promise<string> {
  pruneSessions();
  const cmd = normalizeCommand(text);

  if (isHelpCommand(cmd)) return helpText();

  if (isListCommand(cmd)) {
    const events = await fetchUpcomingEvents();
    sessions.set(from, { events, updatedAt: Date.now() });
    return formatEventList(events);
  }

  const num = parseInt(cmd, 10);
  const session = sessions.get(from);
  if (!Number.isNaN(num) && num >= 1 && session?.events[num - 1]) {
    return formatEventDetail(session.events[num - 1]);
  }

  if (cmd.length >= 2) {
    const events = await searchEvents(cmd);
    if (events.length === 1) {
      sessions.set(from, { events, updatedAt: Date.now() });
      return formatEventDetail(events[0]);
    }
    if (events.length > 1) {
      sessions.set(from, { events, updatedAt: Date.now() });
      return formatEventList(events);
    }
  }

  return `${helpText()}\n\n找不到「${text}」相關活動，試試輸入「活動」或關鍵字搜尋。`;
}

export async function processWhatsAppWebhook(body: unknown): Promise<void> {
  const incoming: WhatsAppIncomingMessage[] = parseWhatsAppWebhook(body);

  for (const msg of incoming) {
    try {
      const reply = await handleWhatsAppUserMessage(msg.from, msg.text);
      if (isWhatsAppConfigured()) {
        await sendWhatsAppText(msg.from, reply);
      } else {
        console.log(`[whatsapp:bot] to=${msg.from}\n${reply}`);
      }
    } catch (e) {
      console.error("[whatsapp:bot] message failed:", e);
      if (isWhatsAppConfigured()) {
        try {
          await sendWhatsAppText(msg.from, "抱歉，處理訊息時發生錯誤，請稍後再試。");
        } catch {
          /* ignore */
        }
      }
    }
  }
}
