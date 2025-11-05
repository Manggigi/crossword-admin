import { Hono } from "hono";
import { getDb } from "../../db/client";
import { shares } from "../../db/schema";
import { openapi } from "../../openapi";
import { z } from "zod";

const router = new Hono<{ Bindings: Env }>();

openapi.openapi({
  method: "post",
  path: "/api/v1/puzzles/{id}/shares",
  request: { params: z.object({ id: z.string() }), body: { content: { "application/json": { schema: z.object({ channel: z.string() }) } } } },
  responses: { 200: { description: "ok" } },
}, async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const db = getDb(c.env);
  const res = await db
    .insert(shares)
    .values({ puzzleId: id, playerId: null, channel: body.channel || "unknown", createdAt: new Date() })
    .returning({ id: shares.id });
  return c.json({ id: res[0]?.id });
});

export default router;


