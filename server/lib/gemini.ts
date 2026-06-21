import { env } from "../_core/env.js";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

export type GeminiGenerateOptions = {
  prompt: string;
  jsonSchema?: Record<string, unknown>;
};

export async function geminiGenerateJson<T>(options: GeminiGenerateOptions): Promise<T> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const model = env.GEMINI_MODEL;
  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const generationConfig: Record<string, unknown> = {
    responseMimeType: "application/json",
    temperature: 0.7,
  };
  if (options.jsonSchema) {
    generationConfig.responseSchema = options.jsonSchema;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: options.prompt }] }],
      generationConfig,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API ${res.status}: ${body.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    throw new Error("Gemini returned empty response");
  }

  return JSON.parse(text) as T;
}
