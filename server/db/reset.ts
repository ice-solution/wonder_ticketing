import "dotenv/config";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "./connect.js";

/** 刪除目前 MONGODB_URI 指向的整個 database */
export async function resetDatabase(): Promise<string> {
  await connectDB();
  const name = mongoose.connection.name;
  await mongoose.connection.dropDatabase();
  console.log(`MongoDB dropped: ${name}`);
  return name;
}

async function main() {
  await resetDatabase();
  await disconnectDB();
}

const isMain = process.argv[1]?.endsWith("reset.ts");
if (isMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
