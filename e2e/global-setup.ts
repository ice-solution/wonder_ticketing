import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** E2E 前清空 MongoDB 並寫入 v1.0 baseline seed */
export default async function globalSetup() {
  if (process.env.PLAYWRIGHT_SKIP_DB_RESET === "1") {
    console.log("[e2e] SKIP db bootstrap (PLAYWRIGHT_SKIP_DB_RESET=1)");
    return;
  }
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  console.log("[e2e] Bootstrapping v1.0 database…");
  execSync("npm run db:bootstrap", { cwd: root, stdio: "inherit", env: { ...process.env } });
}
