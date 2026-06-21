import type { Request, Response, NextFunction } from "express";
import { ApiKey } from "../models/index.js";
import { hashApiKey } from "../lib/apiKey.js";

export interface ApiKeyRequest extends Request {
  apiKeyOrganizerId?: string;
}

export async function apiKeyAuth(req: ApiKeyRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing API key" });
  }
  const raw = header.slice(7).trim();
  if (!raw.startsWith("wtk_")) {
    return res.status(401).json({ error: "Invalid API key format" });
  }

  const hash = hashApiKey(raw);
  const key = await ApiKey.findOne({ keyHash: hash, revokedAt: null }).lean();
  if (!key) return res.status(401).json({ error: "Invalid API key" });
  if (key.expiresAt && key.expiresAt < new Date()) {
    return res.status(401).json({ error: "API key expired" });
  }

  await ApiKey.updateOne({ _id: key._id }, { lastUsedAt: new Date() });
  req.apiKeyOrganizerId = String(key.organizerId);
  next();
}
