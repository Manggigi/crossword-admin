import { Hono } from "hono";
import { z } from "zod";
import { getDb } from "../../db/client";
import { playerUsers } from "../../db/schema";
import { createJwt, verifyJwt } from "../../auth/jwt";
import { openapi } from "../../openapi";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../../auth/password";

const router = new Hono<{ Bindings: Env }>();

const SignUpSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

openapi.openapi({ method: "post", path: "/api/v1/players/sign_up", request: { body: { content: { "application/json": { schema: SignUpSchema } } } }, responses: { 200: { description: "ok" }, 409: { description: "exists" } } }, async (c) => {
  const body = await c.req.json();
  const parsed = SignUpSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid payload" }, 400);
  const { email, password } = parsed.data;
  const db = getDb(c.env);
  const existing = await db.select().from(playerUsers).where(eq(playerUsers.email, email)).limit(1);
  if (existing[0]) return c.json({ error: "Email already taken" }, 409);
  const hash = await hashPassword(password);
  await db.insert(playerUsers).values({ email, passwordHash: hash, isGuest: false, createdAt: new Date() });
  return c.json({ ok: true });
});

openapi.openapi({ method: "post", path: "/api/v1/players/sign_in", request: { body: { content: { "application/json": { schema: SignUpSchema } } } }, responses: { 200: { description: "token" }, 401: { description: "bad creds" } } }, async (c) => {
  const body = await c.req.json();
  const parsed = SignUpSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid payload" }, 400);
  const { email, password } = parsed.data;
  const db = getDb(c.env);
  const rows = await db.select().from(playerUsers).where(eq(playerUsers.email, email)).limit(1);
  const user = rows[0];
  if (!user) return c.json({ error: "Invalid credentials" }, 401);
  const ok = user.passwordHash ? await verifyPassword(password, user.passwordHash) : false;
  if (!ok) return c.json({ error: "Invalid credentials" }, 401);
  const token = await createJwt({ sub: String(user.id), role: "player" }, c.env, 60 * 60);
  return c.json({ access_token: token, token_type: "Bearer", expires_in: 3600 });
});

openapi.openapi({ method: "post", path: "/api/v1/players/guest/sign_up", request: {}, responses: { 200: { description: "token" } } }, async (c) => {
  const db = getDb(c.env);
  const res = await db.insert(playerUsers).values({ email: null, passwordHash: null, isGuest: true, createdAt: new Date() }).returning({ id: playerUsers.id });
  const id = res[0]?.id ?? 0;
  const token = await createJwt({ sub: String(id), role: "player" }, c.env, 60 * 60);
  return c.json({ access_token: token, token_type: "Bearer", expires_in: 3600 });
});

openapi.openapi({ method: "get", path: "/api/v1/players/profile", request: {}, responses: { 200: { description: "profile" } } }, async (c) => {
  const auth = c.req.header("Authorization") || "";
  const m = /^Bearer\s+(.+)$/.exec(auth);
  if (!m) return c.json({ user: null }, 200);
  try {
    const payload = await verifyJwt<{ sub?: string }>(m[1], c.env);
    if (!payload.sub) return c.json({ user: null }, 200);
    const db = getDb(c.env);
    const rows = await db.select({ id: playerUsers.id, email: playerUsers.email, isGuest: playerUsers.isGuest }).from(playerUsers).where(eq(playerUsers.id, Number(payload.sub))).limit(1);
    return c.json({ user: rows[0] ?? null });
  } catch {
    return c.json({ user: null }, 200);
  }
});

export default router;


