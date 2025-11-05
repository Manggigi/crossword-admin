import { Hono } from "hono";
import { getDb } from "../../db/client";
import { gameSessions } from "../../db/schema";
import { openapi } from "../../openapi";
import { z } from "zod";
import { verifyJwt } from "../../auth/jwt";
import { eq } from "drizzle-orm";

const router = new Hono<{ Bindings: Env }>();

async function requirePlayerId(c: any): Promise<number | null> {
  const auth = c.req.header("Authorization") || "";
  const m = /^Bearer\s+(.+)$/.exec(auth);
  if (!m) return null;
  try {
    const payload = await verifyJwt<{ sub?: string }>(m[1], c.env);
    return payload.sub ? Number(payload.sub) : null;
  } catch {
    return null;
  }
}

openapi.openapi({
  method: "post",
  path: "/api/v1/puzzles/{id}/game_sessions",
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: "created" } },
}, async (c) => {
  const playerId = await requirePlayerId(c);
  const id = Number(c.req.param("id"));
  const db = getDb(c.env);
  const now = new Date();
  const res = await db
    .insert(gameSessions)
    .values({ puzzleId: id, playerId: playerId ?? null, status: "active", data: null, createdAt: now, updatedAt: now })
    .returning({ id: gameSessions.id });
  return c.json({ id: res[0]?.id });
});

openapi.openapi({ method: "get", path: "/api/v1/game_sessions/{id}", request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: "show" }, 404: { description: "not found" } } }, async (c) => {
  const id = Number(c.req.param("id"));
  const db = getDb(c.env);
  const rows = await db.select().from(gameSessions).where(eq(gameSessions.id, id)).limit(1);
  const row = rows[0];
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({ game_session: row });
});

openapi.openapi({ method: "patch", path: "/api/v1/game_sessions/{id}", request: { params: z.object({ id: z.string() }), body: { content: { "application/json": { schema: z.object({ status: z.string().optional(), data: z.record(z.any()).nullable().optional() }) } } } }, responses: { 200: { description: "updated" } } }, async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json().catch(() => ({}));
  const db = getDb(c.env);
  await db.update(gameSessions).set({ status: body.status, data: body.data ? JSON.stringify(body.data) : null, updatedAt: new Date() }).where(eq(gameSessions.id, id));
  return c.json({ ok: true });
});

export default router;


