import type { Context, Next } from "hono";
import { verifyJwt } from "../auth/jwt";

export async function requireAdmin(c: Context, next: Next) {
  const cookie = c.req.header("Cookie") || "";
  const match = /(?:^|; )admin_session=([^;]+)/.exec(cookie);
  const token = match ? decodeURIComponent(match[1]) : null;
  if (!token) return c.json({ error: "Unauthorized" }, 401);
  try {
    const payload = await verifyJwt<{ sub?: string; role?: string }>(token, c.env);
    if (!payload.sub || payload.role !== "admin") return c.json({ error: "Unauthorized" }, 401);
    c.set("adminId", payload.sub);
    return next();
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
}

export async function requirePlayer(c: Context, next: Next) {
  const auth = c.req.header("Authorization") || "";
  const m = /^Bearer\s+(.+)$/.exec(auth);
  if (!m) return c.json({ error: "Unauthorized" }, 401);
  try {
    const payload = await verifyJwt<{ sub?: string }>(m[1], c.env);
    if (!payload.sub) return c.json({ error: "Unauthorized" }, 401);
    c.set("playerId", payload.sub);
    return next();
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
}



