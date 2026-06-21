/**
 * v1.0 資料庫初始化：清空 MongoDB + 寫入 baseline seed
 * 用法：npm run db:bootstrap
 */
import "dotenv/config";
import { disconnectDB } from "./connect.js";
import { resetDatabase } from "./reset.js";
import { seedV1 } from "./seed.js";

async function bootstrap() {
  await resetDatabase();
  await seedV1();
  await disconnectDB();
  console.log("Bootstrap OK (v1.0 baseline)");
}

bootstrap().catch((e) => {
  console.error(e);
  process.exit(1);
});
