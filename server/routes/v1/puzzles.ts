import { Hono } from "hono";
import { getDb } from "../../db/client";
import { puzzles } from "../../db/schema";
import { openapi } from "../../openapi";
import { z } from "zod";
import { PuzzleCompact, PuzzleExpanded } from "../../schemas/v1";
import { desc, eq } from "drizzle-orm";

function paginate(url: string) {
  const u = new URL(url);
  const page = Math.max(1, Number(u.searchParams.get("page") || 1));
  const perPage = Math.min(100, Math.max(1, Number(u.searchParams.get("per_page") || 20)));
  return { page, perPage, offset: (page - 1) * perPage };
}

const router = new Hono<{ Bindings: Env }>();

const ListResponse = z.object({ puzzles: z.array(PuzzleCompact) });

for (const path of ["/api/v1/puzzles/daily", "/api/v1/puzzles/training", "/api/v1/puzzles/themed"]) {
  openapi.openapi({ method: "get", path, request: {}, responses: { 200: { description: "List", content: { "application/json": { schema: ListResponse } } } } }, async (c) => {
    const db = getDb(c.env);
    const { perPage, offset } = paginate(c.req.url);
    const rows = await db
      .select({ id: puzzles.id, title: puzzles.title, date: puzzles.date, status: puzzles.status, icon_url: puzzles.iconUrl })
      .from(puzzles)
      .orderBy(desc(puzzles.date))
      .limit(perPage)
      .offset(offset);
    c.header("Cache-Control", "public, max-age=60");
    return c.json({ puzzles: rows });
  });
}

openapi.openapi({
  method: "get",
  path: "/api/v1/puzzles/{id}",
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: "Puzzle", content: { "application/json": { schema: z.object({ puzzle: PuzzleExpanded }) } } },
    404: { description: "Not found" },
  },
}, async (c) => {
  const id = Number(c.req.param("id"));
  const db = getDb(c.env);
  const rows = await db
    .select({
      id: puzzles.id,
      title: puzzles.title,
      date: puzzles.date,
      status: puzzles.status,
      icon_url: puzzles.iconUrl,
      description: puzzles.description,
      difficulty: puzzles.difficulty,
    })
    .from(puzzles)
    .where(eq(puzzles.id, id))
    .limit(1);
  const puzzle = rows[0];
  if (!puzzle) return c.json({ error: "Not found" }, 404);
  c.header("Cache-Control", "public, max-age=60");
  return c.json({ puzzle });
});

export default router;


