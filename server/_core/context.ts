import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import jwt from "jsonwebtoken";
import { User, type IUser } from "../models/User.js";
import { env } from "./env.js";

export type SessionUser = Pick<
  IUser,
  "_id" | "openId" | "name" | "email" | "role" | "plan" | "planExpiresAt" | "locale"
>;

export interface Context {
  user: SessionUser | null;
}

function readToken(req: CreateExpressContextOptions["req"]): string | null {
  const cookie = req.cookies?.[env.COOKIE_NAME];
  if (cookie) return cookie;
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export async function createContext({ req }: CreateExpressContextOptions): Promise<Context> {
  const token = readToken(req);
  if (!token) return { user: null };

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string };
    const user = await User.findById(payload.sub).lean();
    if (!user) return { user: null };
    return {
      user: {
        _id: user._id,
        openId: user.openId,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        planExpiresAt: user.planExpiresAt,
        locale: user.locale,
      },
    };
  } catch {
    return { user: null };
  }
}
