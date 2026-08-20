import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { ENV } from "./_core/env";

export const SHOP_SESSION_COOKIE = "printhub_shop_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

function secret() { return ENV.cookieSecret || "development-only-secret"; }
function sign(value: string) { return createHmac("sha256", secret()).update(value).digest("base64url"); }

export function validateShopCredentials(username: string, password: string): boolean {
  const configuredUsername = ENV.shopAdminUsername || "admin";
  const configuredPassword = ENV.shopAdminPassword || "admin";
  return username === configuredUsername && password === configuredPassword;
}

export function createShopSession() {
  const payload = `${randomUUID()}.${Date.now() + SESSION_TTL_MS}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyShopSession(value?: string): boolean {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const [id, expires, provided] = parts;
  if (!id || !expires || !provided || Number(expires) < Date.now()) return false;
  const expected = sign(`${id}.${expires}`);
  try { return timingSafeEqual(Buffer.from(provided), Buffer.from(expected)); } catch { return false; }
}

export function hasShopSession(cookieHeader?: string): boolean {
  const cookie = cookieHeader?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${SHOP_SESSION_COOKIE}=`));
  return verifyShopSession(cookie?.slice(SHOP_SESSION_COOKIE.length + 1));
}
