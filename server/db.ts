/**
 * 資料存取層 — 取代原規格 drizzle/schema.ts + db.ts
 * 使用 Mongoose；多租戶以 createdBy / eventId 隔離
 */
import mongoose from "mongoose";
import {
  Event,
  Order,
  Ticket,
  TicketType,
  User,
  type IEvent,
} from "./models/index.js";

export async function getUserByOpenId(openId: string) {
  return User.findOne({ openId }).lean();
}

export async function upsertUserFromOAuth(data: {
  openId: string;
  name?: string;
  email?: string;
  loginMethod?: string;
}) {
  return User.findOneAndUpdate(
    { openId: data.openId },
    {
      $set: {
        name: data.name,
        email: data.email,
        loginMethod: data.loginMethod,
        lastSignedIn: new Date(),
        updatedAt: new Date(),
      },
      $setOnInsert: {
        openId: data.openId,
        role: "user",
        plan: "free",
        locale: "zh-TW",
        createdAt: new Date(),
      },
    },
    { upsert: true, new: true }
  ).lean();
}

export async function listEventsByOrganizer(organizerId: mongoose.Types.ObjectId | string) {
  return Event.find({ createdBy: organizerId }).sort({ eventDate: -1 }).lean();
}

export async function listPublishedEvents(opts: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}) {
  const page = opts.page ?? 1;
  const limit = Math.min(opts.limit ?? 20, 50);
  const filter: Record<string, unknown> = { status: "published", visibility: "public" };
  if (opts.category) filter.category = opts.category;
  if (opts.search) {
    filter.$or = [
      { title: { $regex: opts.search, $options: "i" } },
      { titleEn: { $regex: opts.search, $options: "i" } },
    ];
  }
  const [items, total] = await Promise.all([
    Event.find(filter)
      .sort({ eventDate: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Event.countDocuments(filter),
  ]);
  return { items, total, page, limit };
}

export async function getEventBySlug(slug: string) {
  return Event.findOne({ slug }).lean();
}

export async function getEventById(id: string) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Event.findById(id).lean();
}

export async function assertEventOwner(
  eventId: string,
  userId: mongoose.Types.ObjectId | string
): Promise<IEvent | null> {
  const event = await getEventById(eventId);
  if (!event || String(event.createdBy) !== String(userId)) return null;
  return event as IEvent;
}

export async function getTicketTypesByEvent(eventId: string) {
  return TicketType.find({ eventId, status: "active" }).sort({ sortOrder: 1 }).lean();
}

export async function getOrderByNumber(orderNumber: string) {
  return Order.findOne({ orderNumber }).lean();
}

export async function getTicketsByOrder(orderId: string) {
  return Ticket.find({ orderId }).lean();
}

export async function getValidTicketsByEvent(eventId: string) {
  return Ticket.find({ eventId, status: "valid" }).lean();
}
