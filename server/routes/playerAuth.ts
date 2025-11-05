import { Hono } from "hono";
import { z } from "zod";
import { getDb } from "../db/client";
import { playerUsers } from "../db/schema";
import { createJwt, verifyJwt } from "../auth/jwt";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../auth/password";

const router = new Hono<{ Bindings: Env }>();

const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
const SignInSchema = SignUpSchema;

router.post("/sign_up", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = SignUpSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid payload" }, 400);
  const { email, password } = parsed.data;
  const db = getDb(c.env);
  // Check existing
  const existing = await db
    .select()
    .from(playerUsers)
    .where(eq(playerUsers.email, email))
    .limit(1);
  if (existing[0]) return c.json({ error: "Email already taken" }, 409);
  const now = new Date();
  const hash = await hashPassword(password);
  await db
    .insert(playerUsers)
    .values({ email, passwordHash: hash, isGuest: false, createdAt: now });
  return c.json({ ok: true });
});

router.post("/sign_in", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = SignInSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid payload" }, 400);
  const { email, password } = parsed.data;
  const db = getDb(c.env);
  const rows = await db
    .select()
    .from(playerUsers)
    .where(eq(playerUsers.email, email))
    .limit(1);
  const user = rows[0];
  if (!user) return c.json({ error: "Invalid credentials" }, 401);
  const ok = user.passwordHash
    ? await verifyPassword(password, user.passwordHash)
    : false;
  if (!ok) return c.json({ error: "Invalid credentials" }, 401);
  const token = await createJwt(
    { sub: String(user.id), role: "player" },
    c.env,
    60 * 60
  );
  return c.json({
    access_token: token,
    token_type: "Bearer",
    expires_in: 3600,
  });
});

router.post("/guest", async (c) => {
  const db = getDb(c.env);
  const now = new Date();
  const result = await db
    .insert(playerUsers)
    .values({ email: null, passwordHash: null, isGuest: true, createdAt: now })
    .returning({ id: playerUsers.id });
  const id = result[0]?.id ?? 0;
  const token = await createJwt(
    { sub: String(id), role: "player" },
    c.env,
    60 * 60
  );
  return c.json({
    access_token: token,
    token_type: "Bearer",
    expires_in: 3600,
  });
});

router.get("/me", async (c) => {
  const auth = c.req.header("Authorization") || "";
  const m = /^Bearer\s+(.+)$/.exec(auth);
  if (!m) return c.json({ user: null }, 200);
  try {
    const payload = await verifyJwt<{ sub?: string }>(m[1], c.env);
    if (!payload.sub) return c.json({ user: null }, 200);
    const db = getDb(c.env);
    const rows = await db
      .select({
        id: playerUsers.id,
        email: playerUsers.email,
        isGuest: playerUsers.isGuest,
      })
      .from(playerUsers)
      .where(eq(playerUsers.id, Number(payload.sub)))
      .limit(1);
    return c.json({ user: rows[0] ?? null });
  } catch {
    return c.json({ user: null }, 200);
  }
});

export default router;
