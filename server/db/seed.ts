import "dotenv/config";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "./connect.js";
import { Event, TicketType, User } from "../models/index.js";

export const V1_DEMO_SLUG = "wonder-demo-concert";

/** v1.0 baseline：主辦方、Admin、示範活動 */
export async function seedV1() {
  const needsDisconnect = mongoose.connection.readyState !== 1;
  if (needsDisconnect) await connectDB();

  const organizer = await User.findOneAndUpdate(
    { openId: "dev:organizer@wonder.hk" },
    {
      $set: {
        name: "Demo Organizer",
        email: "organizer@wonder.hk",
        plan: "pro",
        loginMethod: "dev",
        role: "user",
      },
      $setOnInsert: { openId: "dev:organizer@wonder.hk", locale: "zh-TW" },
    },
    { upsert: true, new: true }
  );

  await User.findOneAndUpdate(
    { openId: "dev:admin@wonder.hk" },
    {
      $set: {
        name: "Platform Admin",
        email: "admin@wonder.hk",
        role: "admin",
        plan: "pro",
        loginMethod: "dev",
      },
      $setOnInsert: { openId: "dev:admin@wonder.hk", locale: "zh-TW" },
    },
    { upsert: true, new: true }
  );

  let event = await Event.findOne({ slug: V1_DEMO_SLUG });
  if (!event) {
    event = await Event.create({
      title: "Wonder Demo Concert",
      titleEn: "Wonder Demo Concert",
      description: "Wonder Ticketing v1.0 示範活動",
      eventDate: new Date(Date.now() + 7 * 86400000),
      venue: "Hong Kong",
      slug: V1_DEMO_SLUG,
      status: "published",
      visibility: "public",
      createdBy: organizer._id,
      maxAttendees: 300,
      enableEmbedWidget: true,
    });

    await TicketType.create({
      eventId: event._id,
      name: "一般入場",
      price: 100,
      quantity: 100,
      sold: 0,
    });

    await TicketType.create({
      eventId: event._id,
      name: "VIP",
      price: 280,
      quantity: 20,
      sold: 0,
    });
  }

  console.log("Seed v1.0 OK:", {
    organizer: organizer.email,
    admin: "admin@wonder.hk",
    eventSlug: event.slug,
  });

  if (needsDisconnect) await disconnectDB();
  return { organizer, event };
}

async function main() {
  await connectDB();
  await seedV1();
  await disconnectDB();
}

const isMain = process.argv[1]?.endsWith("seed.ts");
if (isMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
