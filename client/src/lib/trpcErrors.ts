import { TRPCClientError } from "@trpc/client";

const NO_RETRY_CODES = new Set([
  "FORBIDDEN",
  "UNAUTHORIZED",
  "NOT_FOUND",
  "BAD_REQUEST",
  "PARSE_ERROR",
  "METHOD_NOT_SUPPORTED",
]);

export function getTrpcErrorCode(error: unknown): string | undefined {
  if (error instanceof TRPCClientError) {
    return error.data?.code;
  }
  return undefined;
}

/** 403 / 404 等客戶端錯誤不應重試，避免 UI 長時間卡在 loading */
export function isRetryableTrpcError(error: unknown): boolean {
  const code = getTrpcErrorCode(error);
  if (!code) return true;
  return !NO_RETRY_CODES.has(code);
}
