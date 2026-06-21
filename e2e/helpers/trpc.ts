import type { APIRequestContext } from "@playwright/test";

type TrpcBatchInput = Record<string, { json: unknown }>;

type TrpcBatchResult = Array<{
  result?: { data?: { json?: unknown } };
  error?: { json?: { message?: string } };
}>;

export async function trpcQuery<T>(
  request: APIRequestContext,
  procedure: string,
  input: unknown
): Promise<T> {
  const batchInput: TrpcBatchInput = { "0": { json: input } };
  const url = `/api/trpc/${procedure}?batch=1&input=${encodeURIComponent(JSON.stringify(batchInput))}`;
  const res = await request.get(url);
  if (!res.ok()) {
    throw new Error(`tRPC query ${procedure} failed: ${res.status()} ${await res.text()}`);
  }
  const body = (await res.json()) as TrpcBatchResult;
  const item = body[0];
  if (item?.error) {
    throw new Error(item.error.json?.message ?? `tRPC query ${procedure} error`);
  }
  return item?.result?.data?.json as T;
}

export async function trpcMutate<T>(
  request: APIRequestContext,
  procedure: string,
  input: unknown
): Promise<T> {
  const batchInput: TrpcBatchInput = { "0": { json: input } };
  const res = await request.post(`/api/trpc/${procedure}?batch=1`, {
    data: batchInput,
  });
  if (!res.ok()) {
    throw new Error(`tRPC mutate ${procedure} failed: ${res.status()} ${await res.text()}`);
  }
  const body = (await res.json()) as TrpcBatchResult;
  const item = body[0];
  if (item?.error) {
    throw new Error(item.error.json?.message ?? `tRPC mutate ${procedure} error`);
  }
  return item?.result?.data?.json as T;
}
