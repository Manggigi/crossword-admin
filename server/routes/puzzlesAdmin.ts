import { z } from "zod";
import { openapi } from "../openapi";
import { getDb } from "../db/client";
import { puzzles } from "../db/schema";
import { eq } from "drizzle-orm";
import { verifyJwt } from "../auth/jwt";

async function requireAdminCookie(c: any) {
  const cookie = c.req.header("Cookie") || "";
  const match = /(?:^|; )admin_session=([^;]+)/.exec(cookie);
  const token = match ? decodeURIComponent(match[1]) : null;
  if (!token) return null;
  try {
    const payload = await verifyJwt<{ sub?: string; role?: string }>(token, c.env);
    if (payload.role !== "admin") return null;
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

const PuzzleCreate = z.object({
  title: z.string().min(1),
  date: z.string().min(1),
  description: z.string().optional(),
  difficulty: z.string().optional(),
  collectionId: z.number().optional(),
});

openapi.openapi({
  method: "post",
  path: "/api/puzzles",
  request: { body: { content: { "application/json": { schema: PuzzleCreate } } } },
  responses: { 200: { description: "Created" }, 401: { description: "Unauthorized" } },
}, async (c) => {
  const adminId = await requireAdminCookie(c);
  if (!adminId) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json();
  const parsed = PuzzleCreate.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid" }, 400);
  const db = getDb(c.env);
  const now = new Date();
  const result = await db
    .insert(puzzles)
    .values({ ...parsed.data, status: "draft", createdAt: now, updatedAt: now })
    .returning({ id: puzzles.id });
  return c.json({ id: result[0]?.id });
});

const PuzzleUpdate = PuzzleCreate.partial();

openapi.openapi({
  method: "put",
  path: "/api/puzzles/{id}",
  request: { params: z.object({ id: z.string() }), body: { content: { "application/json": { schema: PuzzleUpdate } } } },
  responses: { 200: { description: "Updated" }, 401: { description: "Unauthorized" } },
}, async (c) => {
  const adminId = await requireAdminCookie(c);
  if (!adminId) return c.json({ error: "Unauthorized" }, 401);
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const parsed = PuzzleUpdate.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid" }, 400);
  const db = getDb(c.env);
  await db.update(puzzles).set({ ...parsed.data, updatedAt: new Date() }).where(eq(puzzles.id, id));
  return c.json({ ok: true });
});

openapi.openapi({
  method: "post",
  path: "/api/puzzles/{id}/publish",
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: "Published" }, 401: { description: "Unauthorized" } },
}, async (c) => {
  const adminId = await requireAdminCookie(c);
  if (!adminId) return c.json({ error: "Unauthorized" }, 401);
  const id = Number(c.req.param("id"));
  const db = getDb(c.env);
  await db
    .update(puzzles)
    .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
    .where(eq(puzzles.id, id));
  return c.json({ ok: true });
});


