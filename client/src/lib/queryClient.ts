import { QueryClient } from "@tanstack/react-query";
import { isRetryableTrpcError } from "./trpcErrors";

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          if (!isRetryableTrpcError(error)) return false;
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}
