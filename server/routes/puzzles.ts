import { Hono } from "hono";
import { getDb } from "../db/client";
import { puzzles } from "../db/schema";
import { desc, eq } from "drizzle-orm";

const router = new Hono<{ Bindings: Env }>();

router.get("/daily", async (c) => {
  const limit = Number(new URL(c.req.url).searchParams.get("limit") ?? "20");
  const db = getDb(c.env);
  const rows = await db
    .select({ id: puzzles.id, title: puzzles.title, date: puzzles.date, status: puzzles.status, iconUrl: puzzles.iconUrl })
    .from(puzzles)
    .orderBy(desc(puzzles.date))
    .limit(Math.min(Math.max(limit, 1), 100));
  return c.json({ puzzles: rows });
});

router.get(":id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id)) return c.json({ error: "Invalid id" }, 400);
  const db = getDb(c.env);
  const rows = await db
    .select({ id: puzzles.id, title: puzzles.title, date: puzzles.date, status: puzzles.status, iconUrl: puzzles.iconUrl })
    .from(puzzles)
    .where(eq(puzzles.id, id))
    .limit(1);
  const puzzle = rows[0];
  if (!puzzle) return c.json({ error: "Not found" }, 404);
  return c.json({ puzzle });
});

export default router;



