import { env } from "../_core/env.js";
import { geminiGenerateJson } from "../lib/gemini.js";

export type AiCopyInput = {
  title: string;
  titleEn?: string;
  venue: string;
  eventDate: Date;
  category?: string;
  eventType?: string;
  locale: "zh-TW" | "en";
};

function buildTemplateCopy(input: AiCopyInput): { description: string; descriptionEn: string } {
  const dateStr = input.eventDate.toLocaleString(
    input.locale === "en" ? "en-HK" : "zh-HK",
    { dateStyle: "full", timeStyle: "short" }
  );

  const description = [
    `歡迎參加「${input.title}」！`,
    ``,
    `📍 地點：${input.venue}`,
    `📅 時間：${dateStr}`,
    input.category ? `🏷️ 類別：${input.category}` : "",
    ``,
    `這是一場${input.eventType === "online" ? "線上" : input.eventType === "hybrid" ? "線上線下混合" : "實體"}活動，期待與您見面！`,
    `立即購票，名額有限，售完即止。`,
  ]
    .filter(Boolean)
    .join("\n");

  const titleEn = input.titleEn ?? input.title;
  const descriptionEn = [
    `Join us for "${titleEn}"!`,
    ``,
    `📍 Venue: ${input.venue}`,
    `📅 When: ${dateStr}`,
    input.category ? `🏷️ Category: ${input.category}` : "",
    ``,
    `This is a ${input.eventType ?? "in-person"} event. Get your tickets before they're gone!`,
  ]
    .filter(Boolean)
    .join("\n");

  return { description, descriptionEn };
}

function eventTypeLabel(eventType?: string): string {
  if (eventType === "online") return "線上";
  if (eventType === "hybrid") return "線上線下混合";
  return "實體";
}

async function generateWithGemini(
  input: AiCopyInput
): Promise<{ description: string; descriptionEn: string }> {
  const dateStr = input.eventDate.toLocaleString("zh-HK", {
    dateStyle: "full",
    timeStyle: "short",
  });
  const dateStrEn = input.eventDate.toLocaleString("en-HK", {
    dateStyle: "full",
    timeStyle: "short",
  });

  const prompt = `你是專業的活動行銷文案撰寫者，為香港活動售票平台撰寫活動介紹。

活動資訊：
- 標題（中文）：${input.title}
- 標題（英文）：${input.titleEn ?? input.title}
- 地點：${input.venue}
- 日期時間（繁中）：${dateStr}
- 日期時間（英文）：${dateStrEn}
- 類別：${input.category ?? "一般活動"}
- 形式：${eventTypeLabel(input.eventType)}

請撰寫吸引票務轉換的活動描述：
1. description：繁體中文，2–4 段，語氣專業親切，可適度使用 emoji，勿捏造未提供的嘉賓或節目細節
2. descriptionEn：對應的英文版，語氣自然，非逐字翻譯

只回傳 JSON，欄位為 description、descriptionEn。`;

  const result = await geminiGenerateJson<{ description: string; descriptionEn: string }>({
    prompt,
    jsonSchema: {
      type: "object",
      properties: {
        description: { type: "string" },
        descriptionEn: { type: "string" },
      },
      required: ["description", "descriptionEn"],
    },
  });

  if (!result.description?.trim() || !result.descriptionEn?.trim()) {
    throw new Error("Gemini returned incomplete copy");
  }

  return {
    description: result.description.trim(),
    descriptionEn: result.descriptionEn.trim(),
  };
}

/** Gemini 優先；未設定 key 或 API 失敗時回退內建模板 */
export async function generateEventCopy(input: AiCopyInput): Promise<{
  description: string;
  descriptionEn: string;
}> {
  if (env.GEMINI_API_KEY) {
    try {
      return await generateWithGemini(input);
    } catch (err) {
      console.warn("[aiCopy] Gemini failed, using template fallback:", err);
    }
  }

  return buildTemplateCopy(input);
}
