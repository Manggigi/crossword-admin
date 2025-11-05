import { Hono } from "hono";
import { getDb } from "../../db/client";
import { sessionHints } from "../../db/schema";
import { openapi } from "../../openapi";
import { z } from "zod";

const router = new Hono<{ Bindings: Env }>();

openapi.openapi({
  method: "post",
  path: "/api/v1/game_sessions/{id}/session_hints",
  request: { params: z.object({ id: z.string() }), body: { content: { "application/json": { schema: z.object({ payload: z.record(z.any()) }) } } } },
  responses: { 200: { description: "created" } },
}, async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const db = getDb(c.env);
  const now = new Date();
  const res = await db
    .insert(sessionHints)
    .values({ gameSessionId: id, payload: JSON.stringify(body.payload ?? {}), createdAt: now })
    .returning({ id: sessionHints.id });
  return c.json({ id: res[0]?.id });
});

export default router;


