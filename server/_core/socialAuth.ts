import type { Response } from "express";
import { env } from "./env.js";
import { upsertUserFromOAuth } from "../db.js";
import { signSession, setSessionCookie } from "./auth.js";

export type SocialProvider = "google" | "facebook";

function apiBase(): string {
  return env.WEBHOOK_BASE_URL ?? `http://localhost:${env.PORT}`;
}

function clientBase(): string {
  return env.CLIENT_URL ?? "http://localhost:5173";
}

export function encodeOAuthState(redirect: string): string {
  return Buffer.from(JSON.stringify({ redirect })).toString("base64url");
}

export function decodeOAuthState(state: string | undefined): string {
  if (!state) return clientBase();
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString()) as { redirect?: string };
    return parsed.redirect ?? clientBase();
  } catch {
    return clientBase();
  }
}

export function getGoogleAuthUrl(redirectAfterLogin: string): string | null {
  if (!env.GOOGLE_CLIENT_ID) return null;
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${apiBase()}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state: encodeOAuthState(redirectAfterLogin),
    access_type: "online",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export function getFacebookAuthUrl(redirectAfterLogin: string): string | null {
  if (!env.FACEBOOK_APP_ID) return null;
  const params = new URLSearchParams({
    client_id: env.FACEBOOK_APP_ID,
    redirect_uri: `${apiBase()}/api/auth/facebook/callback`,
    scope: "email,public_profile",
    state: encodeOAuthState(redirectAfterLogin),
  });
  return `https://www.facebook.com/v18.0/dialog/oauth?${params}`;
}

export async function handleGoogleCallback(code: string, res: Response): Promise<string> {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth not configured");
  }
  const redirectUri = `${apiBase()}/api/auth/google/callback`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData.error ?? "Google token exchange failed");
  }

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = (await profileRes.json()) as { id?: string; email?: string; name?: string };
  if (!profile.id) throw new Error("Google profile missing id");

  const user = await upsertUserFromOAuth({
    openId: `google:${profile.id}`,
    email: profile.email,
    name: profile.name,
    loginMethod: "google",
  });
  const token = signSession(String(user!._id));
  setSessionCookie(res, token);
  return String(user!._id);
}

export async function handleFacebookCallback(code: string, res: Response): Promise<string> {
  if (!env.FACEBOOK_APP_ID || !env.FACEBOOK_APP_SECRET) {
    throw new Error("Facebook OAuth not configured");
  }
  const redirectUri = `${apiBase()}/api/auth/facebook/callback`;
  const tokenUrl = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
  tokenUrl.searchParams.set("client_id", env.FACEBOOK_APP_ID);
  tokenUrl.searchParams.set("client_secret", env.FACEBOOK_APP_SECRET);
  tokenUrl.searchParams.set("redirect_uri", redirectUri);
  tokenUrl.searchParams.set("code", code);

  const tokenRes = await fetch(tokenUrl);
  const tokenData = (await tokenRes.json()) as { access_token?: string; error?: { message?: string } };
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData.error?.message ?? "Facebook token exchange failed");
  }

  const profileUrl = new URL("https://graph.facebook.com/me");
  profileUrl.searchParams.set("fields", "id,name,email");
  profileUrl.searchParams.set("access_token", tokenData.access_token);
  const profileRes = await fetch(profileUrl);
  const profile = (await profileRes.json()) as { id?: string; email?: string; name?: string };
  if (!profile.id) throw new Error("Facebook profile missing id");

  const user = await upsertUserFromOAuth({
    openId: `facebook:${profile.id}`,
    email: profile.email,
    name: profile.name,
    loginMethod: "facebook",
  });
  const token = signSession(String(user!._id));
  setSessionCookie(res, token);
  return String(user!._id);
}

export function getSocialLoginStatus() {
  return {
    google: !!env.GOOGLE_CLIENT_ID,
    facebook: !!env.FACEBOOK_APP_ID,
    devLogin: env.NODE_ENV !== "production",
  };
}
