import type { Response } from "express";
import { env } from "./env.js";
import { upsertUserFromOAuth } from "../db.js";
import { signSession, setSessionCookie } from "./auth.js";
import { encodeOAuthState, decodeOAuthState } from "./socialAuth.js";

type OidcDiscovery = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
};

let discoveryCache: { issuer: string; doc: OidcDiscovery; fetchedAt: number } | null = null;
const DISCOVERY_TTL_MS = 60 * 60 * 1000;

function apiBase(): string {
  return env.WEBHOOK_BASE_URL ?? `http://localhost:${env.PORT}`;
}

function normalizedIssuer(): string {
  return (env.SSO_OIDC_ISSUER ?? "").replace(/\/$/, "");
}

function redirectUri(): string {
  return `${apiBase()}/api/auth/sso/callback`;
}

export function isEnterpriseSsoConfigured(): boolean {
  return !!(env.SSO_OIDC_ISSUER && env.SSO_OIDC_CLIENT_ID && env.SSO_OIDC_CLIENT_SECRET);
}

export function getEnterpriseSsoStatus() {
  return {
    enabled: isEnterpriseSsoConfigured(),
    label: env.SSO_OIDC_LABEL ?? "Enterprise SSO",
    domainAllowlist: parseDomainAllowlist(),
  };
}

function parseDomainAllowlist(): string[] {
  return (env.SSO_OIDC_DOMAIN_ALLOWLIST ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

function isEmailDomainAllowed(email?: string): boolean {
  const allowlist = parseDomainAllowlist();
  if (!allowlist.length) return true;
  if (!email?.includes("@")) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? allowlist.includes(domain) : false;
}

async function fetchDiscovery(): Promise<OidcDiscovery> {
  const issuer = normalizedIssuer();
  const now = Date.now();
  if (discoveryCache && discoveryCache.issuer === issuer && now - discoveryCache.fetchedAt < DISCOVERY_TTL_MS) {
    return discoveryCache.doc;
  }

  const res = await fetch(`${issuer}/.well-known/openid-configuration`);
  if (!res.ok) {
    throw new Error(`OIDC discovery failed: ${res.status}`);
  }
  const doc = (await res.json()) as OidcDiscovery;
  if (!doc.authorization_endpoint || !doc.token_endpoint) {
    throw new Error("OIDC discovery missing endpoints");
  }
  discoveryCache = { issuer, doc, fetchedAt: now };
  return doc;
}

export async function getEnterpriseSsoAuthUrl(redirectAfterLogin: string): Promise<string | null> {
  if (!isEnterpriseSsoConfigured()) return null;
  const discovery = await fetchDiscovery();
  const params = new URLSearchParams({
    client_id: env.SSO_OIDC_CLIENT_ID!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: env.SSO_OIDC_SCOPES ?? "openid profile email",
    state: encodeOAuthState(redirectAfterLogin),
  });
  return `${discovery.authorization_endpoint}?${params}`;
}

type TokenResponse = {
  access_token?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
};

type UserInfo = {
  sub?: string;
  email?: string;
  name?: string;
  preferred_username?: string;
};

function subjectFromIdToken(idToken: string): { sub?: string; email?: string; name?: string } {
  const parts = idToken.split(".");
  if (parts.length < 2) return {};
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as {
      sub?: string;
      email?: string;
      name?: string;
      preferred_username?: string;
    };
    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name ?? payload.preferred_username,
    };
  } catch {
    return {};
  }
}

export async function handleEnterpriseSsoCallback(code: string, res: Response): Promise<string> {
  if (!isEnterpriseSsoConfigured()) {
    throw new Error("Enterprise SSO not configured");
  }

  const discovery = await fetchDiscovery();
  const tokenRes = await fetch(discovery.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(),
      client_id: env.SSO_OIDC_CLIENT_ID!,
      client_secret: env.SSO_OIDC_CLIENT_SECRET!,
    }),
  });

  const tokenData = (await tokenRes.json()) as TokenResponse;
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description ?? tokenData.error ?? "OIDC token exchange failed");
  }

  let profile: UserInfo = {};
  if (discovery.userinfo_endpoint) {
    const userRes = await fetch(discovery.userinfo_endpoint, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (userRes.ok) {
      profile = (await userRes.json()) as UserInfo;
    }
  }

  if (!profile.sub && tokenData.id_token) {
    const fromId = subjectFromIdToken(tokenData.id_token);
    profile = { ...fromId, ...profile, sub: profile.sub ?? fromId.sub };
  }

  if (!profile.sub) throw new Error("OIDC profile missing sub");

  const email = profile.email ?? profile.preferred_username;
  if (!isEmailDomainAllowed(email)) {
    throw new Error("SSO_DOMAIN_NOT_ALLOWED");
  }

  const issuerKey = normalizedIssuer().replace(/[^a-z0-9]/gi, "_").slice(0, 48);
  const user = await upsertUserFromOAuth({
    openId: `sso:${issuerKey}:${profile.sub}`,
    email,
    name: profile.name ?? email?.split("@")[0],
    loginMethod: "enterprise_sso",
  });

  const token = signSession(String(user!._id));
  setSessionCookie(res, token);
  return String(user!._id);
}
