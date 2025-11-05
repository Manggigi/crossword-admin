import { Hono } from "hono";
import { z } from "zod";
import { getDb } from "../db/client";
import { adminUsers } from "../db/schema";
import { eq } from "drizzle-orm";
import { createJwt, verifyJwt } from "../auth/jwt";
import { clearAdminSessionCookie, setAdminSessionCookie } from "../auth/cookies";

const router = new Hono<{ Bindings: Env }>();

const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/sign_in", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = SignInSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid payload" }, 400);

  const { email, password } = parsed.data;
  const db = getDb(c.env);
  const rows = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  const user = rows[0];
  if (!user) return c.json({ error: "Invalid credentials" }, 401);

  // TEMP: dev-only plaintext compare (replace with proper hash verify)
  if (user.passwordHash !== password) return c.json({ error: "Invalid credentials" }, 401);

  const token = await createJwt({ sub: String(user.id), role: user.role }, c.env, 60 * 60);
  setAdminSessionCookie(c, token, 60 * 60);
  return c.json({ ok: true });
});

router.post("/sign_out", async (c) => {
  clearAdminSessionCookie(c);
  return c.json({ ok: true });
});

router.get("/me", async (c) => {
  const cookie = c.req.header("Cookie") || "";
  const match = /(?:^|; )admin_session=([^;]+)/.exec(cookie);
  const token = match ? decodeURIComponent(match[1]) : null;
  if (!token) return c.json({ user: null }, 200);
  try {
    const payload = await verifyJwt<{ sub?: string; role?: string }>(token, c.env);
    if (!payload.sub) return c.json({ user: null }, 200);
    const db = getDb(c.env);
    const rows = await db
      .select({ id: adminUsers.id, email: adminUsers.email, role: adminUsers.role })
      .from(adminUsers)
      .where(eq(adminUsers.id, Number(payload.sub)))
      .limit(1);
    return c.json({ user: rows[0] ?? null });
  } catch {
    return c.json({ user: null }, 200);
  }
});

export default router;









