/** 允許輸入中途為空字串，避免 type=number + value=0 無法刪除的問題 */

export const NUMBER_INPUT_PATTERN = /^-?\d*\.?\d*$/;

export function isValidNumberInputRaw(raw: string): boolean {
  return raw === "" || NUMBER_INPUT_PATTERN.test(raw);
}

export function parseNumberInput(raw: string, fallback = 0): number {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "-") return fallback;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : fallback;
}

export function clampNumber(n: number, min?: number, max?: number): number {
  let v = n;
  if (min != null) v = Math.max(min, v);
  if (max != null) v = Math.min(max, v);
  return v;
}
