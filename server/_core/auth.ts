import jwt from "jsonwebtoken";
import type { Response } from "express";
import { User } from "../models/User.js";
import { env } from "./env.js";
import type { SessionUser } from "./context.js";

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function signSession(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: "7d" });
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(env.COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_MS,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(env.COOKIE_NAME);
}

/** 開發／測試用：模擬 OAuth 登入 */
export async function devLogin(res: Response, opts: { email: string; name?: string }) {
  const openId = `dev:${opts.email}`;
  const user = await User.findOneAndUpdate(
    { openId },
    {
      $set: {
        email: opts.email,
        name: opts.name ?? opts.email.split("@")[0],
        loginMethod: "dev",
        lastSignedIn: new Date(),
        updatedAt: new Date(),
      },
      $setOnInsert: {
        openId,
        role: "user",
        plan: "free",
        locale: "zh-TW",
        createdAt: new Date(),
      },
    },
    { upsert: true, new: true }
  ).lean();

  const token = signSession(String(user!._id));
  setSessionCookie(res, token);
  return user as SessionUser;
}
