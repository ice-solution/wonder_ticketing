import http from "node:http";

export type WebhookPayload = {
  type: string;
  data: Record<string, unknown>;
  createdAt?: string;
};

export type WebhookCaptureServer = {
  url: string;
  port: number;
  getAll: () => WebhookPayload[];
  waitFor: (type: string, timeoutMs?: number) => Promise<WebhookPayload>;
  reset: () => void;
  stop: () => Promise<void>;
};

export function startWebhookCaptureServer(): Promise<WebhookCaptureServer> {
  const payloads: WebhookPayload[] = [];

  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.method !== "POST") {
        res.writeHead(404);
        res.end();
        return;
      }
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          const parsed = JSON.parse(body) as WebhookPayload;
          payloads.push(parsed);
        } catch {
          /* ignore malformed */
        }
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("ok");
      });
    });

    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") throw new Error("Failed to bind webhook server");
      resolve({
        url: `http://127.0.0.1:${addr.port}/webhook`,
        port: addr.port,
        getAll: () => [...payloads],
        waitFor: async (type, timeoutMs = 8000) => {
          const deadline = Date.now() + timeoutMs;
          while (Date.now() < deadline) {
            const hit = payloads.find((p) => p.type === type);
            if (hit) return hit;
            await new Promise((r) => setTimeout(r, 150));
          }
          throw new Error(`Webhook "${type}" not received within ${timeoutMs}ms`);
        },
        reset: () => {
          payloads.length = 0;
        },
        stop: () =>
          new Promise((done, reject) => {
            server.close((err) => (err ? reject(err) : done()));
          }),
      });
    });
  });
}
