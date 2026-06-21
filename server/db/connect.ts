import mongoose from "mongoose";

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is required (replaces MySQL DATABASE_URL from spec)");
  }

  mongoose.set("strictQuery", true);

  const conn = await mongoose.connect(uri);
  console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
