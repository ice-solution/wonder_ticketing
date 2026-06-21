import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import "./lib/i18n";
import { trpc, createTrpcClient } from "./lib/trpc";
import { createAppQueryClient } from "./lib/queryClient";
import { App } from "./App";

const queryClient = createAppQueryClient();
const trpcClient = createTrpcClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  </StrictMode>
);
